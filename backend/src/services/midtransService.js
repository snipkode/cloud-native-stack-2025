import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

class MidtransService {
  constructor() {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Server Key for signature validation
    this.serverKey = process.env.MIDTRANS_SERVER_KEY;
  }

  /**
   * Create a payment transaction
   * @param {Object} params - Payment parameters
   * @param {number} params.userId - User ID
   * @param {number} params.amount - Amount in IDR
   * @param {string} params.orderId - Order ID
   * @param {string} params.description - Payment description
   * @param {Object} params.customer - Customer details (optional)
   * @param {Array} params.enabledPayments - Enabled payment methods (optional)
   * @param {Object} params.expiry - Expiry configuration (optional)
   * @returns {Promise<Object>} Payment token and redirect URL
   */
  async createPayment(params) {
    try {
      const { userId, amount, email, firstName, transactionId, description = 'Top-up Credits' } = params;

      // Format amount to IDR (Indonesian Rupiah)
      const formattedAmount = parseFloat(amount).toFixed(0);

      // Get user information from the customer parameter
      const customerDetails = {
        first_name: firstName,
        last_name: `${userId}`,
        email: email,
      };

      // Filter out undefined/null values
      Object.keys(customerDetails).forEach(key => {
        if (customerDetails[key] === undefined || customerDetails[key] === null) {
          delete customerDetails[key];
        }
      });

      const parameter = {
        transaction_details: {
          order_id: `TOPUP-${transactionId}`,
          gross_amount: formattedAmount
        },
        item_details: [
          {
            id: 'credits',
            price: formattedAmount,
            quantity: 1,
            name: description
          }
        ]
      };

      // Only add customer_details if there's at least one property
      if (Object.keys(customerDetails).length > 0) {
        parameter.customer_details = customerDetails;
      }

      const transaction = await this.snap.createTransaction(parameter);
      return {
        transactionId: transaction.transaction_id,
        orderId: transaction.order_id,
        paymentUrl: transaction.redirect_url,
        token: transaction.token,
        status: transaction.transaction_status,
        amount: formattedAmount,
        currency: transaction.currency || 'IDR',
        expiryTime: transaction.expiry_time || null,
      };
    } catch (error) {
      console.error('Midtrans transaction creation error:', error);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} orderId - Order ID to verify
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionStatus(orderId) {
    try {
      const transaction = await this.snap.transaction.status(orderId);
      return transaction;
    } catch (error) {
      console.error('Midtrans transaction status error:', error);
      throw error;
    }
  }

  /**
   * Handle transaction notification from Midtrans
   * @param {Object} notification - Midtrans notification payload
   * @returns {Promise<Object>} Processed transaction details
   */
  async handleNotification(notification) {
    try {
      const transaction = await this.snap.transaction.notification(notification);
      return transaction;
    } catch (error) {
      console.error('Midtrans notification processing error:', error);
      throw error;
    }
  }

  /**
   * Validate Midtrans notification signature
   * @param {Object} notification - Webhook notification payload
   * @param {string} signatureKey - Signature key from Midtrans header
   * @returns {boolean} Whether signature is valid
   */
  validateWebhook(notification, signatureKey) {
    try {
      const { order_id, status_code, gross_amount } = notification;
      
      if (!this.serverKey) {
        console.error('MIDTRANS_SERVER_KEY not configured');
        return false;
      }

      const notificationString = `${order_id}${status_code}${gross_amount}${this.serverKey}`;
      const sha512 = crypto.createHash('sha512').update(notificationString).digest('hex');
      const expectedSignature = sha512.toLowerCase();
      
      // Compare the signature
      return expectedSignature === signatureKey.toLowerCase();
    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  /**
   * Process webhook notification from Midtrans
   * @param {Object} notification - Webhook notification from Midtrans
   * @returns {Object} - Processed result
   */
  async processWebhook(notification) {
    try {
      // Determine internal status based on Midtrans status
      const {
        transaction_id,
        order_id,
        transaction_status,
        fraud_status,
        payment_type,
        status_code,
        gross_amount,
      } = notification;

      // Determine internal status based on Midtrans status
      let internalStatus = 'pending';
      if (transaction_status === 'capture' && fraud_status === 'accept') {
        internalStatus = 'completed';
      } else if (transaction_status === 'settlement') {
        internalStatus = 'completed';
      } else if (
        transaction_status === 'cancel' || 
        transaction_status === 'expire' || 
        transaction_status === 'deny' ||
        transaction_status === 'failure'
      ) {
        internalStatus = 'failed';
      }

      return {
        paymentGatewayId: transaction_id,
        orderId: order_id,
        status: internalStatus,
        paymentType: payment_type,
        statusCode: status_code,
        amount: parseFloat(gross_amount),
        rawNotification: notification,
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  async captureTransaction(transactionId) {
    try {
      // Note: Snap API doesn't typically have a capture method
      // This might be for Core API
      const response = await this.snap.transaction.capture(transactionId);
      return response;
    } catch (error) {
      console.error('Midtrans capture error:', error);
      throw error;
    }
  }

  async refundTransaction(transactionId, refundParams = {}) {
    try {
      // Note: For Snap API, we might need to use Core API for refunds
      const response = await this.snap.transaction.refund(transactionId, refundParams);
      return response;
    } catch (error) {
      console.error('Midtrans refund error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const midtransService = new MidtransService();

export default midtransService;