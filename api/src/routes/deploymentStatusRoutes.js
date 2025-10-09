import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { rbacAuthorize } from '../middleware/authorization.js';
import { Deployment } from '../models/index.js';
import deploymentJobService from '../services/deploymentJobService.js';

const router = express.Router();

/**
 * @swagger
 * /deployments/{id}/status:
 *   get:
 *     summary: Get deployment status (Authenticated users with deployment:read permission and ownership/authorization)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Deployment ID
 *     responses:
 *       200:
 *         description: Deployment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Current deployment status
 *                 details:
 *                   type: object
 *                   description: Additional status details
 *       404:
 *         description: Deployment not found
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
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/status', authenticate, rbacAuthorize('read', 'deployment', 'id'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Check if the deployment job is still active
    const jobStatus = deploymentJobService.getJobStatus(id);
    
    res.json({
      status: deployment.status,
      details: jobStatus || null,
      deployment: {
        id: deployment.id,
        status: deployment.status,
        name: deployment.name,
        appUrl: deployment.appUrl,
        lastDeployedAt: deployment.lastDeployedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /deployments/queue:
 *   get:
 *     summary: Get deployment queue information (Authenticated users with deployment:read permission)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queueLength:
 *                   type: number
 *                   description: Number of deployments waiting in queue
 *                 activeJobs:
 *                   type: number
 *                   description: Number of active deployment jobs
 *                 maxWorkers:
 *                   type: number
 *                   description: Maximum number of worker threads
 *                 availableWorkers:
 *                   type: number
 *                   description: Number of available worker threads
 *                 utilization:
 *                   type: string
 *                   description: Worker utilization percentage
 *                 priorityBreakdown:
 *                   type: object
 *                   properties:
 *                     high:
 *                       type: number
 *                       description: Number of high priority jobs (restart)
 *                     medium:
 *                       type: number
 *                       description: Number of medium priority jobs (create)
 *                     low:
 *                       type: number
 *                       description: Number of low priority jobs (rebuild)
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/queue', authenticate, async (req, res, next) => {
  try {
    const queueInfo = deploymentJobService.getQueueInfo();
    res.json(queueInfo);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /deployments/{id}/cancel:
 *   post:
 *     summary: Cancel a deployment job if it's in the queue (Authenticated users with deployment:update permission and ownership/authorization)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Deployment ID
 *     responses:
 *       200:
 *         description: Job cancelled successfully or was not in queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Cancellation result message
 *                 cancelled:
 *                   type: boolean
 *                   description: Whether the job was actually cancelled
 *       404:
 *         description: Deployment not found
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
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/cancel', authenticate, rbacAuthorize('update', 'deployment', 'id'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const cancelled = deploymentJobService.cancelJob(id);
    
    res.json({
      message: cancelled ? 'Job cancelled successfully' : 'Job was not in queue or already active',
      cancelled
    });
  } catch (error) {
    next(error);
  }
});

export default router;