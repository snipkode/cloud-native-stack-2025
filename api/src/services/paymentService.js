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

      logger.info(`Updating transaction ${transaction.id} with Midtrans details: paymentGatewayId=${midtransResult.transactionId}, orderId=${midtransResult.orderId}`);
      
      // UPDATE: Use orderId (TOPUP-xxx) as paymentGatewayId for reliable webhook matching
      // This ensures consistency because order_id is controlled by us and matches between create and webhook
      await transaction.update({
        paymentGatewayId: midtransResult.orderId, // Use order_id for webhook matching (we control this)
        // Store the Midtrans transactionId and orderId in separate fields
        midtransTransactionId: midtransResult.transactionId,
        midtransOrderId: midtransResult.orderId,
        paymentType: midtransResult.paymentType,
        metadata: {
          ...transaction.metadata,
          midtrans_transaction_id: midtransResult.transactionId, // Store original transaction_id for reference
          midtrans_payment_url: midtransResult.paymentUrl,
          midtrans_token: midtransResult.token,
          midtrans_expiry: midtransResult.expiryTime,
        }
      }, { transaction: dbTransaction });

      logger.info(`Transaction ${transaction.id} updated. paymentGatewayId (order_id): ${transaction.paymentGatewayId}, midtransTransactionId: ${transaction.midtransTransactionId}`);

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
    logger.info(`Processing Midtrans webhook: ${JSON.stringify({
      transaction_id: notification.transaction_id,
      transaction_status: notification.transaction_status,
      fraud_status: notification.fraud_status,
      status_code: notification.status_code,
      order_id: notification.order_id,
      gross_amount: notification.gross_amount
    })}`);

    // Process the notification using the Midtrans service
    const processed = await midtransService.processWebhook(notification);

    logger.info(`Processed webhook result: ${JSON.stringify({ 
      paymentGatewayId: processed.paymentGatewayId, 
      status: processed.status,
      orderId: processed.orderId
    })}`);

    logger.info(`Searching for transaction with paymentGatewayId: ${processed.paymentGatewayId}`);

    // UPDATE: Now search using orderId (which we control and is consistent)
    // After our refactor, paymentGatewayId now contains the order_id (TOPUP-xxx)
    const transaction = await Transaction.findOne({
      where: { 
        paymentGatewayId: processed.orderId  // Use order_id which we set in processTopup
      }
    });

    if (!transaction) {
      logger.warn(`Webhook: Transaction not found for order_id: ${processed.orderId}`);
      logger.warn(`Expected: paymentGatewayId in database = order_id from Midtrans = ${processed.orderId}`);
      
      // Return success to acknowledge the webhook but indicate transaction was not found
      return { 
        message: 'Webhook received but transaction not found', 
        paymentGatewayId: processed.paymentGatewayId,
        status: 'ignored'
      };
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
    } else {
      logger.info(`Found transaction ${transaction.id} for webhook, previous status: ${transaction.status}`);
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

      logger.info(`Updated transaction status from ${previousStatus} to ${processed.status} for transaction ${transaction.id}`);

      // If payment is successful, update user's credits or plan (only if not already processed)
      if (processed.status === 'completed' && previousStatus !== 'completed') {
        logger.info(`Processing completed transaction ${transaction.id} for user ${transaction.userId}, adding ${transaction.amount} credits`);
        
        const user = await User.findByPk(transaction.userId, { 
          lock: dbTransaction.LOCK.UPDATE,
          transaction: dbTransaction,
          include: [{ model: Plan, as: 'plan' }]
        });

        // Check if this transaction is for plan subscription (not just topup)
        if (transaction.description && transaction.description.includes('Plan subscription')) {
          logger.info(`Processing plan subscription for user ${user.id}`);
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
          logger.info(`Adding ${transaction.amount} credits to user ${user.id}, previous balance: ${user.credits}`);
          await user.update({
            credits: parseFloat(user.credits) + parseFloat(transaction.amount),
          }, { transaction: dbTransaction });
          logger.info(`Updated user ${user.id} credits to: ${user.credits + parseFloat(transaction.amount)}`);
        }
      } else {
        logger.info(`Skipping credit update for transaction ${transaction.id} - processed.status: ${processed.status}, previousStatus: ${previousStatus}`);
      }

      await dbTransaction.commit();

      logger.info(`Webhook processed successfully for transaction ${transaction.id}, final status: ${processed.status}`);

      return {
        message: 'Webhook processed successfully',
        transactionId: transaction.id,
        status: processed.status,
      };
    } catch (error) {
      logger.error(`Error processing webhook for transaction: ${error.message}`, error);
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