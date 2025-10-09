import express from 'express';
import { 
  getPlans, 
  getPlanById, 
  subscribeToPlan, 
  getCurrentPlan 
} from '../controllers/planController.js';
import { authenticate } from '../middleware/auth.js';
import { requireResourcePermission } from '../middleware/rbac.js';
import { planLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management endpoints
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all available plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of available plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 */
router.get('/', getPlans);

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: Get plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 */
router.get('/:id', getPlanById);

/**
 * @swagger
 * /plans/my-plan:
 *   get:
 *     summary: Get current user's plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/Plan'
 *       404:
 *         description: User does not have an active plan
 *       401:
 *         description: Unauthorized
 */
router.get('/my-plan', authenticate, getCurrentPlan);

/**
 * @swagger
 * /plans/subscribe:
 *   post:
 *     summary: Subscribe to a plan
 *     tags: [Plans]
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
 *       200:
 *         description: Successfully subscribed to plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 plan:
 *                   $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 *       401:
 *         description: Unauthorized
 */
router.post('/subscribe', planLimiter, authenticate, requireResourcePermission('update', 'user'), subscribeToPlan);

export default router;