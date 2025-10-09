import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to verify Midtrans webhook signature
 * This middleware should be used after raw body has been processed
 */
export const verifyMidtransWebhook = (req, res, next) => {
  try {
    // Get the notification signature from the header
    // According to Midtrans documentation, it should be 'x-midtrans-signature'
    const signature = req.headers['x-midtrans-signature'];
    
    // Log the webhook for debugging
    console.log('Midtrans webhook received:', {
      path: req.path,
      headers: req.headers,
      signature: signature
    });
    
    // Verify the signature using Midtrans algorithm
    // The signature is calculated as SHA-512 of: order_id+status_code+gross_amount+server_key
    const { order_id, status_code, gross_amount } = req.body;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    if (!serverKey) {
      console.error('MIDTRANS_SERVER_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!order_id || !status_code || !gross_amount) {
      console.error('Missing required fields in webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }
    
    // The correct Midtrans signature algorithm includes the server key in the hash
    const notificationString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHmac('sha512', serverKey)
      .update(notificationString)
      .digest('hex');
    
    // Verify signature - make it case insensitive
    const normalizedReceived = signature ? signature.toLowerCase() : '';
    const normalizedExpected = expectedSignature.toLowerCase();
    
    if (normalizedReceived !== normalizedExpected) {
      console.error('Invalid Midtrans webhook signature', {
        received: signature,
        expected: expectedSignature,
        normalizedReceived,
        normalizedExpected
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Signature is valid, continue
    console.log('Midtrans webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).json({ error: 'Webhook verification failed' });
  }
};