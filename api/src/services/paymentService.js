import { Transaction, User, Plan } from '../models/index.js';
import midtransService from '../services/midtransService.js';
import crypto from 'crypto';
import sequelize from '../config/database.js';
import logger from '../utils/logger.js';

class PaymentService {
  /**
   * Process a top-up request using Midtrans
   * @param {Object} params - Top-up parameters
   * @param {string} params.userId - User ID
   * @param {number} params.amount - Amount to top-up
   * @param {string} params.email - User's email
   * @param {string} params.firstName - User's first name
   * @returns {Object} - Payment transaction result
   */
  async processTopup(params) {
    const { userId, amount, email, firstName } = params;

    // Validate minimum amount (10 credits)
    if (amount < 10) {
      throw new Error('Minimum topup amount is 10');
    }

    // Create a database transaction to ensure consistency
    const dbTransaction = await sequelize.transaction();

    try {
      // Create a pending transaction record in our database
      const transaction = await Transaction.create({
        userId,
        type: 'topup',
        amount,
        status: 'pending',
        paymentMethod: 'midtrans',
        paymentGatewayId: `INV-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        description: `Top-up of ${amount} credits`,
      }, { transaction: dbTransaction });

      // Create payment with Midtrans
      const midtransResult = await midtransService.createPayment({
        userId,
        amount,
        email,
        firstName,
        transactionId: transaction.id,
        description: `Top-up of ${amount} credits`,
      });

      // Update our transaction record with Midtrans details
      await transaction.update({
        paymentGatewayId: midtransResult.transactionId,
        // Only update midtrans-specific fields if they exist in the model
        ...(Transaction.rawAttributes.midtransTransactionId && { midtransTransactionId: midtransResult.transactionId }),
        ...(Transaction.rawAttributes.midtransOrderId && { midtransOrderId: midtransResult.orderId }),
        metadata: {
          ...transaction.metadata,
          midtrans_payment_url: midtransResult.paymentUrl,
          midtrans_token: midtransResult.token,
          midtrans_expiry: midtransResult.expiryTime,
        }
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      return {
        transaction,
        paymentUrl: midtransResult.paymentUrl,
        token: midtransResult.token,
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Process Midtrans webhook notification
   * @param {Object} notification - Webhook notification from Midtrans
   * @returns {Object} - Processing result
   */
  async processWebhook(notification) {
    // Process the notification using the Midtrans service
    const processed = await midtransService.processWebhook(notification);

    // Find the transaction in our database using the transaction_id from Midtrans
    let transaction = await Transaction.findOne({
      where: { 
        paymentGatewayId: processed.paymentGatewayId  // This is the transaction_id from Midtrans
      }
    });

    // If not found with transaction_id, also try to find with order_id (fallback approach)
    if (!transaction) {
      transaction = await Transaction.findOne({
        where: {
          // Try looking up by order_id which might be stored as paymentGatewayId during creation
          paymentGatewayId: processed.orderId
        }
      });
    }

    // If still not found, try looking by metadata reference to Midtrans transaction
    if (!transaction && processed.rawNotification && processed.rawNotification.order_id) {
      // Instead of searching in JSON metadata, use the separate midtransOrderId field 
      // which should have been populated during transaction creation
      transaction = await Transaction.findOne({
        where: { 
          midtransOrderId: processed.rawNotification.order_id 
        }
      });
    }

    if (!transaction) {
      logger.warn(`Webhook received for unknown transaction, paymentGatewayId: ${processed.paymentGatewayId}`);
      logger.debug(`Order ID: ${processed.orderId}, Raw notification: ${JSON.stringify(processed.rawNotification)}`);
      
      // Return success to acknowledge the webhook but indicate transaction was not found
      // This prevents Midtrans from retrying indefinitely while logging the issue
      return { 
        message: 'Webhook received but transaction not found', 
        paymentGatewayId: processed.paymentGatewayId,
        status: 'ignored'
      };
    }

    // Only allow status updates to pending transactions
    if (transaction.status !== 'pending') {
      logger.warn(`Webhook attempt for already ${transaction.status} transaction: ${processed.paymentGatewayId}`);
      return { message: 'Invalid transaction state', status: 'ignored' };
    }

    const dbTransaction = await sequelize.transaction();

    try {
      // Save the current status before updating
      const previousStatus = transaction.status;
      
      // Update transaction with new status
      await transaction.update({
        status: processed.status,
        paymentType: processed.paymentType,
        fraudStatus: processed.rawNotification.fraud_status || null,
        metadata: {
          ...transaction.metadata,
          midtrans_notification: processed.rawNotification,
          webhook_processed_at: new Date().toISOString(),
        }
      }, { transaction: dbTransaction });

      // If payment is successful, update user's credits or plan (only if not already processed)
      if (processed.status === 'completed' && previousStatus !== 'completed') {
        const user = await User.findByPk(transaction.userId, { 
          lock: dbTransaction.LOCK.UPDATE,
          transaction: dbTransaction,
          include: [{ model: Plan, as: 'plan' }]
        });

        // Check if this transaction is for plan subscription (not just topup)
        if (transaction.description && transaction.description.includes('Plan subscription')) {
          // This is a plan subscription payment
          // Update user's plan from pendingPlanId
          if (user.pendingPlanId) {
            try {
              // Import the updateUserPlan function
              const module = await import('../controllers/billingController.js');
              const { updateUserPlan } = module;
              
              // Update user's plan to the new plan
              await updateUserPlan(user.id, user.pendingPlanId);
              
              // Clear pending plan ID
              await user.update({ pendingPlanId: null }, { transaction: dbTransaction });
              
              logger.info(`User ${user.id} plan updated successfully to plan ${user.pendingPlanId}`);
            } catch (planUpdateError) {
              logger.error(`Failed to update user plan after payment: ${planUpdateError.message}`);
              // Don't fail the entire transaction, just log the error
            }
          }
        } else {
          // This is a regular topup transaction, add credits
          await user.update({
            credits: parseFloat(user.credits) + parseFloat(transaction.amount),
          }, { transaction: dbTransaction });
        }
      }

      await dbTransaction.commit();

      return {
        message: 'Webhook processed successfully',
        transactionId: transaction.id,
        status: processed.status,
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Sync transaction status with Midtrans
   * @param {string} transactionId - Internal transaction ID
   * @returns {Object} - Sync result
   */
  async syncTransactionStatus(transactionId) {
    const transaction = await Transaction.findOne({
      where: { id: transactionId }
    });

    if (!transaction || !transaction.paymentGatewayId) {
      throw new Error('Transaction not found or has no payment gateway ID');
    }

    // Get status from Midtrans
    const midtransStatus = await midtransService.getTransactionStatus(transaction.paymentGatewayId);

    const dbTransaction = await sequelize.transaction();

    try {
      // Determine internal status based on Midtrans status
      let internalStatus = transaction.status; // Default to current status
      if (midtransStatus.transaction_status === 'capture' && midtransStatus.fraud_status === 'accept') {
        internalStatus = 'completed';
      } else if (midtransStatus.transaction_status === 'settlement') {
        internalStatus = 'completed';
      } else if (
        midtransStatus.transaction_status === 'cancel' || 
        midtransStatus.transaction_status === 'expire' || 
        midtransStatus.transaction_status === 'deny' ||
        midtransStatus.transaction_status === 'failure'
      ) {
        internalStatus = 'failed';
      }

      // Update transaction if status changed
      if (transaction.status !== internalStatus) {
        await transaction.update({
          status: internalStatus,
          paymentType: midtransStatus.payment_type,
          fraudStatus: midtransStatus.fraud_status,
          metadata: {
            ...transaction.metadata,
            midtrans_sync_status: midtransStatus,
            status_synced_at: new Date().toISOString(),
          }
        }, { transaction: dbTransaction });

        // If status is now completed and user doesn't have credits added yet
        if (internalStatus === 'completed' && transaction.status !== 'completed') {
          const user = await User.findByPk(transaction.userId, { 
            lock: dbTransaction.LOCK.UPDATE,
            transaction: dbTransaction
          });

          // Only add credits if transaction was not previously completed
          if (transaction.status !== 'completed') {
            await user.update({
              credits: parseFloat(user.credits) + parseFloat(transaction.amount),
            }, { transaction: dbTransaction });
          }
        }
      }

      await dbTransaction.commit();

      return {
        transaction,
        midtransStatus,
        internalStatus,
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }
}

// Create singleton instance
const paymentService = new PaymentService();

export default paymentService;