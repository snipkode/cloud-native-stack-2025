import express from 'express';
import { body } from 'express-validator';
import {
  createDeployment,
  getDeployments,
  getDeployment,
  restartDeployment,
  stopDeployment,
  deleteDeployment,
  getDeploymentLogs,
} from '../controllers/deploymentController.js';
import { authenticate } from '../middleware/auth.js';
import { checkDeploymentAccess, rbacAuthorize } from '../middleware/authorization.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  requirePermission, 
  requireAnyPermission,
  requireResourcePermission,
  loadUserPermissions 
} from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * /test/deployments:
 *   post:
 *     summary: Test creating a deployment (Authenticated users with test-deployment:create permission)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the test deployment
 *               repositoryUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL of the Git repository for testing
 *               branch:
 *                 type: string
 *                 description: Branch to deploy (defaults to 'main')
 *             required:
 *               - name
 *               - repositoryUrl
 *     responses:
 *       201:
 *         description: Test deployment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deployment:
 *                   $ref: '#/components/schemas/Deployment'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       402:
 *         description: Insufficient credits
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
  '/',
  authenticate,
  requireResourcePermission('create', 'test-deployment'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('repositoryUrl').isURL().withMessage('Valid repository URL is required'),
    body('branch').optional().trim(),
    validateRequest,
  ],
  createDeployment
);

/**
 * @swagger
 * /test/deployments:
 *   get:
 *     summary: Get all test deployments for the authenticated user (Authenticated users with test-deployment:read permission)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of test deployments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deployments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Deployment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, requireResourcePermission('read', 'test-deployment'), getDeployments);

/**
 * @swagger
 * /test/deployments/{id}:
 *   get:
 *     summary: Get a specific test deployment (Authenticated users with test-deployment:read permission and ownership/authorization)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Test deployment ID
 *     responses:
 *       200:
 *         description: Test deployment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deployment:
 *                   $ref: '#/components/schemas/Deployment'
 *       404:
 *         description: Test deployment not found
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
router.get('/:id', authenticate, rbacAuthorize('read', 'test-deployment', 'id'), getDeployment);

/**
 * @swagger
 * /test/deployments/{id}/restart:
 *   post:
 *     summary: Restart a test deployment (Authenticated users with test-deployment:update permission and ownership/authorization)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Test deployment ID
 *     responses:
 *       200:
 *         description: Test deployment restart initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deployment:
 *                   $ref: '#/components/schemas/Deployment'
 *       404:
 *         description: Test deployment not found
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
router.post('/:id/restart', authenticate, rbacAuthorize('update', 'test-deployment', 'id'), restartDeployment);

/**
 * @swagger
 * /test/deployments/{id}/stop:
 *   post:
 *     summary: Stop a test deployment (Authenticated users with test-deployment:update permission and ownership/authorization)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Test deployment ID
 *     responses:
 *       200:
 *         description: Test deployment stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deployment:
 *                   $ref: '#/components/schemas/Deployment'
 *       404:
 *         description: Test deployment not found
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
router.post('/:id/stop', authenticate, rbacAuthorize('update', 'test-deployment', 'id'), stopDeployment);

/**
 * @swagger
 * /test/deployments/{id}:
 *   delete:
 *     summary: Delete a test deployment (Authenticated users with test-deployment:delete permission and ownership/authorization)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Test deployment ID
 *     responses:
 *       200:
 *         description: Test deployment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Test deployment not found
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
router.delete('/:id', authenticate, rbacAuthorize('delete', 'test-deployment', 'id'), deleteDeployment);

/**
 * @swagger
 * /test/deployments/{id}/logs:
 *   get:
 *     summary: Get test deployment logs (Authenticated users with test-deployment:read permission and ownership/authorization)
 *     tags: [Test Deployments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Test deployment ID
 *     responses:
 *       200:
 *         description: Test deployment logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeploymentLog'
 *       404:
 *         description: Test deployment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeploymentLog'
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
router.get('/:id/logs', authenticate, rbacAuthorize('read', 'test-deployment', 'id'), getDeploymentLogs);

export default router;