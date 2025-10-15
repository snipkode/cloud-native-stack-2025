import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to verify Midtrans webhook signature
 * This middleware should be used after raw body has been processed
 * NOTE: Midtrans can send signature in both header and body depending on configuration
 */
export const verifyMidtransWebhook = (req, res, next) => {
  try {
    // Get the notification signature - check both header and body
    // Midtrans typically uses 'x-midtrans-signature' header but signature can also be in body
    const signature = req.headers['x-midtrans-signature'] || 
                     req.headers['x-signature-key'] || 
                     req.headers['x-real-signature'] ||
                     req.body?.signature_key; // Also check if signature_key is in the body
    
    // Log the webhook for debugging
    console.log('Midtrans webhook received:', {
      path: req.path,
      headers: req.headers,
      signature: signature,
      bodySignature: req.body?.signature_key
    });
    
    // Check if we have raw body available
    if (!req.rawBody) {
      console.error('Raw body not available for signature verification');
      return res.status(400).json({ error: 'Raw body not available for signature verification' });
    }
    
    // Get the server key
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('MIDTRANS_SERVER_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    // Calculate expected signature using the raw body and server key
    // Format: SHA-512(raw_body + server_key)
    const notificationString = req.rawBody + serverKey;
    const expectedSignature = crypto
      .createHash('sha512')
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