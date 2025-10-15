import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import billingRoutes from '../routes/billingRoutes.js';

export const setupMiddleware = (app, config) => {
  // Trust proxy in production to handle X-Forwarded-For headers correctly
  if (config.nodeEnv === 'production') {
    app.set('trust proxy', config.trustProxy);
  }

  // Enhanced security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
        scriptSrc: ["'self'", "https:", "http:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:"],
        frameSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "http:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  }));

  // Global rate limiting to prevent abuse
  const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this API, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // In production, trust proxy headers to get real client IP
    ...(config.nodeEnv === 'production' && { 
      trustProxy: true 
    })
  });

  app.use(globalRateLimit);
  app.use(cors());

  // For the webhook endpoint, we need to capture raw body first and preserve it
  const webhookRawHandler = express.raw({ type: 'application/json', limit: '10mb' });
  const webhookHandler = (req, res, next) => {
    // Store the raw body before parsing, so it's available for signature verification
    if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString();
      try {
        req.body = JSON.parse(req.body.toString());
      } catch (e) {
        console.error(`Error parsing webhook body: ${e.message}`);
        return res.status(400).json({ error: 'Invalid JSON in webhook' });
      }
    }
    next();
  };

  // Apply specific raw handling for webhook before the general routes
  app.use('/api/billing/webhook', webhookRawHandler, webhookHandler, billingRoutes);

  // Apply standard body parsing for all other routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};