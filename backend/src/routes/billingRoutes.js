import express from 'express';
import { body } from 'express-validator';
import {
  createTopup,
  getTransactions,
  getTransaction,
  handleWebhook,
  syncTransactionStatus,
  createPlanSubscription,
} from '../controllers/billingController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { verifyMidtransWebhook } from '../middleware/midtransWebhook.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing and transactions endpoints
 */

/**
 * @swagger
 * /billing/topup:
 *   post:
 *     summary: Create a topup transaction
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10
 *                 description: Amount to topup in credits
 *             required:
 *               - amount
 *     responses:
 *       201:
 *         description: Topup transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *                 paymentUrl:
 *                   type: string
 *                   description: URL where user can complete the payment
 *       400:
 *         description: Invalid input or amount below minimum
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/topup',
  authenticate,
  [
    body('amount').isNumeric().isFloat({ min: 10 }),
    validateRequest,
  ],
  createTopup
);

/**
 * @swagger
 * /billing/transactions:
 *   get:
 *     summary: Get all transactions for the authenticated user
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/transactions', authenticate, getTransactions);

/**
 * @swagger
 * /billing/transactions/{id}:
 *   get:
 *     summary: Get a specific transaction
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/transactions/:id', authenticate, getTransaction);

/**
 * @swagger
 * /billing/webhook:
 *   post:
 *     summary: Handle payment gateway webhook
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentGatewayId:
 *                 type: string
 *                 description: Payment gateway transaction ID
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *                 description: Payment status
 *             required:
 *               - paymentGatewayId
 *               - status
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/webhook', verifyMidtransWebhook, handleWebhook);

/**\n * @swagger\n * /billing/sync/{transactionId}:\n *   post:\n *     summary: Manually sync transaction status with Midtrans\n *     tags: [Billing]\n *     security:\n *       - bearerAuth: []\n *     parameters:\n *       - in: path\n *         name: transactionId\n *         schema:\n *           type: string\n *           format: uuid\n *         required: true\n *         description: Internal transaction ID\n *     responses:\n *       200:\n *         description: Transaction sync completed successfully\n *         content:\n *           application/json:\n *             schema:\n *               type: object\n *               properties:\n *                 transaction:\n *                   $ref: '#/components/schemas/Transaction'\n *                 midtransStatus:\n *                   type: object\n *                   description: Raw status from Midtrans\n *                 internalStatus:\n *                   type: string\n *                   description: Internal status\n *       404:\n *         description: Transaction not found\n *         content:\n *           application/json:\n *             schema:\n *               $ref: '#/components/schemas/Error'\n *       401:\n *         description: Unauthorized\n *         content:\n *           application/json:\n *             schema:\n *               $ref: '#/components/schemas/Error'\n */
router.post('/sync/:transactionId', authenticate, syncTransactionStatus);

/**
 * @swagger
 * /billing/subscribe-plan:
 *   post:
 *     summary: Subscribe to a plan (Authenticated users)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the plan to subscribe to
 *             required:
 *               - planId
 *     responses:
 *       201:
 *         description: Plan subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 plan:
 *                   $ref: '#/components/schemas/Plan'
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *                 paymentUrl:
 *                   type: string
 *                   description: URL where user can complete the payment
 *                 token:
 *                   type: string
 *                   description: Payment token for frontend integration
 *       404:
 *         description: Plan not found or not available
 *       401:
 *         description: Unauthorized
 */
router.post('/subscribe-plan', authenticate, createPlanSubscription);

export default router;
