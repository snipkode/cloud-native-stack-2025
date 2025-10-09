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
  rebuildDeployment,
  scaleDeployment,
  getEnvVars,
  unsetEnvVars,
  addDomain,
  removeDomain,
  getDomains,
  addPortMapping,
  removePortMapping,
  getPortMappings,
  getLogs,
  runCommand,
  purgeCache,
  getNetworkInfo,
  listApps,
  listPlugins,
  getResourceUsage,
  updateResourceAllocation,
} from '../controllers/deploymentController.js';
import { authenticate } from '../middleware/auth.js';
import { checkDeploymentAccess, requireDeploymentAccess, rbacAuthorize, requireRBACDeploymentAccess } from '../middleware/authorization.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { 
  requirePermission, 
  requireAnyPermission,
  requireResourcePermission,
  loadUserPermissions 
} from '../middleware/rbac.js';
import { 
  deploymentLimiter, 
  deploymentCreationLimiter, 
  commandExecutionLimiter, 
  envVarLimiter, 
  deploymentUpdateLimiter 
} from '../middleware/rateLimiters.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Deployments
 *   description: Deployment management endpoints
 */

/**
 * @swagger
 * /deployments:
 *   post:
 *     summary: Create a new deployment (Authenticated users with deployment:create permission)
 *     tags: [Deployments]
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
 *                 description: Name of the deployment
 *               repositoryUrl:
 *                 type: string
 *                 format: uri
 *                 description: URL of the Git repository
 *               branch:
 *                 type: string
 *                 description: Branch to deploy (defaults to 'main')
 *               envVars:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: Environment variables
 *             required:
 *               - name
 *               - repositoryUrl
 *     responses:
 *       201:
 *         description: Deployment created successfully
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
  deploymentCreationLimiter,
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('repositoryUrl').isURL(),
    body('branch').optional().trim(),
    validateRequest,
  ],
  createDeployment
);

/**
 * @swagger
 * /deployments:
 *   get:
 *     summary: Get all deployments for the authenticated user (Authenticated users with deployment:read permission)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deployments retrieved successfully
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
router.get('/', authenticate, getDeployments);

/**
 * @swagger
 * /deployments/{id}:
 *   get:
 *     summary: Get a specific deployment (Authenticated users with deployment:read permission and ownership/authorization)
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
 *         description: Deployment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deployment:
 *                   $ref: '#/components/schemas/Deployment'
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
router.get('/:id', authenticate, rbacAuthorize('read', 'deployment', 'id'), getDeployment);

/**
 * @swagger
 * /deployments/{id}/restart:
 *   post:
 *     summary: Restart a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *         description: Deployment restart initiated
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
router.post('/:id/restart', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), restartDeployment);

/**
 * @swagger
 * /deployments/{id}/stop:
 *   post:
 *     summary: Stop a deployment (Authenticated users with deployment:update permission and ownership/authorization)
 *     description: Stops a running application and changes its status to 'stopped'. This command will stop the actual running processes of the application on the platform.
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
 *         description: Deployment stopped successfully
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
router.post('/:id/stop', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), stopDeployment);

/**
 * @swagger
 * /deployments/{id}:
 *   delete:
 *     summary: Delete a deployment (Authenticated users with deployment:delete permission and ownership/authorization)
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
 *         description: Deployment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
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
router.delete('/:id', authenticate, rbacAuthorize('delete', 'deployment', 'id'), deleteDeployment);

/**
 * @swagger
 * /deployments/{id}/logs:
 *   get:
 *     summary: Get deployment logs (Authenticated users with deployment:read permission and ownership/authorization)
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
 *         description: Deployment logs retrieved successfully
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
router.get('/:id/logs', authenticate, rbacAuthorize('read', 'deployment', 'id'), getDeploymentLogs);

/**
 * @swagger
 * /deployments/{id}/rebuild:
 *   post:
 *     summary: Rebuild a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *         description: Deployment rebuild initiated
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
router.post('/:id/rebuild', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), rebuildDeployment);

/**
 * @swagger
 * /deployments/{id}/scale:
 *   post:
 *     summary: Scale deployment processes (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scaleConfig:
 *                 type: object
 *                 additionalProperties:
 *                   type: integer
 *                 description: "Scale configuration (e.g., {\\\"web\\\": 2, \\\"worker\\\": 1})"
 *             required:
 *               - scaleConfig
 *     responses:
 *       200:
 *         description: Deployment scaled successfully
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
router.post('/:id/scale', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), scaleDeployment);

/**
 * @swagger
 * /deployments/{id}/env:
 *   get:
 *     summary: Get environment variables for a deployment (Authenticated users with deployment:read permission and ownership/authorization)
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
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         required: false
 *         description: Specific environment variable key to get
 *     responses:
 *       200:
 *         description: Environment variables retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 envVars:
 *                   type: string
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
router.get('/:id/env', authenticate, rbacAuthorize('read', 'deployment', 'id'), getEnvVars);

/**
 * @swagger
 * /deployments/{id}/env/unset:
 *   post:
 *     summary: Unset environment variables for a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of environment variable keys to unset
 *             required:
 *               - keys
 *     responses:
 *       200:
 *         description: Environment variables unset successfully
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
router.post('/:id/env/unset', envVarLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), unsetEnvVars);

/**
 * @swagger
 * /deployments/{id}/domains:
 *   post:
 *     summary: Add domain to a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Domain to add
 *             required:
 *               - domain
 *     responses:
 *       200:
 *         description: Domain added to deployment successfully
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
router.post('/:id/domains', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), addDomain);

/**
 * @swagger
 * /deployments/{id}/domains/remove:
 *   post:
 *     summary: Remove domain from a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Domain to remove
 *             required:
 *               - domain
 *     responses:
 *       200:
 *         description: Domain removed from deployment successfully
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
router.post('/:id/domains/remove', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), removeDomain);

/**
 * @swagger
 * /deployments/{id}/domains:
 *   get:
 *     summary: Get domains for a deployment (Authenticated users with deployment:read permission and ownership/authorization)
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
 *         description: Domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 domains:
 *                   type: string
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
router.get('/:id/domains', authenticate, rbacAuthorize('read', 'deployment', 'id'), getDomains);

/**
 * @swagger
 * /deployments/{id}/ports:
 *   post:
 *     summary: Add port mapping to a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portMapping:
 *                 type: string
 *                 description: Port mapping in format 'protocol:external:internal' (e.g., 'http:80:5000')
 *             required:
 *               - portMapping
 *     responses:
 *       200:
 *         description: Port mapping added to deployment successfully
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
router.post('/:id/ports', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), addPortMapping);

/**
 * @swagger
 * /deployments/{id}/ports/remove:
 *   post:
 *     summary: Remove port mapping from a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portMapping:
 *                 type: string
 *                 description: Port mapping in format 'protocol:external:internal' to remove
 *             required:
 *               - portMapping
 *     responses:
 *       200:
 *         description: Port mapping removed from deployment successfully
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
router.post('/:id/ports/remove', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), removePortMapping);

/**
 * @swagger
 * /deployments/{id}/ports:
 *   get:
 *     summary: Get port mappings for a deployment (Authenticated users with deployment:read permission and ownership/authorization)
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
 *         description: Port mappings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portMappings:
 *                   type: string
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
router.get('/:id/ports', authenticate, rbacAuthorize('read', 'deployment', 'id'), getPortMappings);

/**
 * @swagger
 * /deployments/{id}/app-logs:
 *   get:
 *     summary: Get application logs for a deployment (Authenticated users with deployment:read permission and ownership/authorization)
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
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         required: false
 *         description: Number of log lines to retrieve
 *     responses:
 *       200:
 *         description: Application logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: string
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
router.get('/:id/app-logs', authenticate, rbacAuthorize('read', 'deployment', 'id'), getLogs);

/**
 * @swagger
 * /deployments/{id}/run:
 *   post:
 *     summary: Run command in deployment container (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               command:
 *                 type: string
 *                 description: Command to run in the container
 *             required:
 *               - command
 *     responses:
 *       200:
 *         description: Command output
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 output:
 *                   type: string
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
router.post('/:id/run', commandExecutionLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), runCommand);

/**
 * @swagger
 * /deployments/{id}/cache/purge:
 *   post:
 *     summary: Purge build cache for a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *         description: Build cache purged successfully
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
router.post('/:id/cache/purge', deploymentUpdateLimiter, authenticate, rbacAuthorize('update', 'deployment', 'id'), purgeCache);

/**
 * @swagger
 * /deployments/{id}/network:
 *   get:
 *     summary: Get network information for a deployment (Authenticated users with deployment:read permission and ownership/authorization)
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
 *         description: Network information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 networkInfo:
 *                   type: string
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
router.get('/:id/network', authenticate, rbacAuthorize('read', 'deployment', 'id'), getNetworkInfo);

/**
 * @swagger
 * /deployments/apps:
 *   get:
 *     summary: List all applications on the platform (Authenticated users with deployment:read permission)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apps:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/apps', authenticate, requireResourcePermission('read', 'deployment'), listApps);

/**
 * @swagger
 * /deployments/plugins:
 *   get:
 *     summary: List all installed plugins on the platform (Authenticated users with deployment:read permission)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of plugins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plugins:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/plugins', authenticate, requireResourcePermission('read', 'deployment'), listPlugins);

/**
 * @swagger
 * /deployments/usage:
 *   get:
 *     summary: Get user's resource usage and plan information (Authenticated users)
 *     tags: [Deployments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resource usage and plan information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/Plan'
 *                 usage:
 *                   type: object
 *                   properties:
 *                     apps:
 *                       type: integer
 *                     ram:
 *                       type: integer
 *                     cpu:
 *                       type: integer
 *                     storage:
 *                       type: integer
 *                 available:
 *                   type: object
 *                   properties:
 *                     apps:
 *                       type: [integer, string]
 *                     ram:
 *                       type: integer
 *                     cpu:
 *                       type: integer
 *                     storage:
 *                       type: integer
 *       404:
 *         description: User does not have an active plan
 *       401:
 *         description: Unauthorized
 */
router.get('/usage', authenticate, getResourceUsage);

/**
 * @swagger
 * /deployments/{id}/resources:
 *   put:
 *     summary: Update resource allocation for a deployment (Authenticated users with deployment:update permission and ownership/authorization)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allocatedRAM:
 *                 type: integer
 *                 description: RAM allocation in MB
 *               allocatedCPU:
 *                 type: integer
 *                 description: CPU allocation in cores
 *               allocatedStorage:
 *                 type: integer
 *                 description: Storage allocation in GB
 *             required:
 *               - allocatedRAM
 *               - allocatedCPU
 *               - allocatedStorage
 *     responses:
 *       200:
 *         description: Resource allocation updated successfully
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
 *         description: Deployment not found
 *       400:
 *         description: Requested resources exceed plan limits
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.put('/:id/resources', authenticate, rbacAuthorize('update', 'deployment', 'id'), updateResourceAllocation);

export default router;
