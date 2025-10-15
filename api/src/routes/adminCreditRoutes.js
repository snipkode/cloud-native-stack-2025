import express from 'express';
import { body, param } from 'express-validator';
import { 
  updateCredit, 
  getCreditHistory, 
  resetUserCredits 
} from '../controllers/adminCreditController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Credit Management
 *   description: Admin endpoints for manual credit manipulation
 */

/**
 * @swagger
 * /admin/credits/{userId}:
 *   patch:
 *     summary: Manually update user's credits (Admin only)
 *     tags: [Admin Credit Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to update credits for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - type
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Credit amount to add/subtract/set
 *                 example: 100
 *               type:
 *                 type: string
 *                 enum: [add, subtract, set]
 *                 description: Type of operation to perform
 *                 example: add
 *               description:
 *                 type: string
 *                 description: Description for the credit change
 *                 example: "Manual credit adjustment"
 *     responses:
 *       200:
 *         description: Credit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 operation:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     previousCredits:
 *                       type: number
 *                     newCredits:
 *                       type: number
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not admin
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId',
  authenticateAdmin,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    body('amount').isNumeric().withMessage('Amount must be a number').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('type').isIn(['add', 'subtract', 'set']).withMessage('Type must be add, subtract, or set'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description must be string with max 500 characters')
  ],
  validateRequest,
  updateCredit
);

/**
 * @swagger
 * /admin/credits/{userId}/history:
 *   get:
 *     summary: Get user's credit transaction history (Admin only)
 *     tags: [Admin Credit Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to get credit history for
 *     responses:
 *       200:
 *         description: Credit history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not admin
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId/history',
  authenticateAdmin,
  [
    param('userId').isUUID().withMessage('Invalid user ID format')
  ],
  validateRequest,
  getCreditHistory
);

/**
 * @swagger
 * /admin/credits/{userId}/reset:
 *   patch:
 *     summary: Reset user's credits to specific amount (Admin only)
 *     tags: [Admin Credit Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to reset credits for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newCreditAmount
 *             properties:
 *               newCreditAmount:
 *                 type: number
 *                 description: New credit amount to set
 *                 example: 0
 *               reason:
 *                 type: string
 *                 description: Reason for credit reset
 *                 example: "Manual reset after failed transaction"
 *     responses:
 *       200:
 *         description: Credits reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 operation:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     previousCredits:
 *                       type: number
 *                     newCredits:
 *                       type: number
 *                     reason:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not admin
 *       404:
 *         description: User not found
 */
router.patch(
  '/:userId/reset',
  authenticateAdmin,
  [
    param('userId').isUUID().withMessage('Invalid user ID format'),
    body('newCreditAmount').isNumeric().withMessage('New credit amount must be a number').isFloat({ min: 0 }).withMessage('New credit amount must be non-negative'),
    body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('Reason must be string with max 500 characters')
  ],
  validateRequest,
  resetUserCredits
);

export default router;