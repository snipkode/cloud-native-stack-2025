import express from 'express';
import { body } from 'express-validator';
import {
  grantAccess,
  revokeAccess,
  getAccessGrants,
  checkAccess,
} from '../controllers/accessController.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Access Control
 *   description: Fine-grained access control endpoints
 */

/**
 * @swagger
 * /access/grant:
 *   post:
 *     summary: Grant access to a resource (Admin only)
 *     tags: [Access Control]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to grant access to
 *               resourceType:
 *                 type: string
 *                 enum: [deployment, billing, user, system]
 *                 description: Type of resource
 *               resourceId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional ID of specific resource
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permissions to grant
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration time for access
 *             required:
 *               - userId
 *               - resourceType
 *               - permissions
 *     responses:
 *       201:
 *         description: Access granted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessGrant:
 *                   $ref: '#/components/schemas/AccessGrant'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/grant',
  authenticateAdmin,
  [
    body('userId').isUUID(),
    body('resourceType').isIn(['deployment', 'billing', 'user', 'system']),
    body('resourceId').optional().isUUID(),
    body('permissions').isArray(),
    validateRequest,
  ],
  grantAccess
);

/**
 * @swagger
 * /access/{id}:
 *   delete:
 *     summary: Revoke access grant (Admin only)
 *     tags: [Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Access grant ID
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Access grant not found
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
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateAdmin, revokeAccess);

/**
 * @swagger
 * /access:
 *   get:
 *     summary: Get all access grants (Admin only)
 *     tags: [Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Optional user ID to filter grants
 *     responses:
 *       200:
 *         description: List of access grants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessGrants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AccessGrant'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateAdmin, getAccessGrants);

/**
 * @swagger
 * /access/check:
 *   get:
 *     summary: Check if user has access to a resource
 *     tags: [Access Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *           enum: [deployment, billing, user, system]
 *         required: true
 *         description: Type of resource to check access for
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: false
 *         description: Optional specific resource ID to check access for
 *       - in: query
 *         name: permission
 *         schema:
 *           type: string
 *         required: true
 *         description: Specific permission to check
 *     responses:
 *       200:
 *         description: Access check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAccess:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *                   description: Optional reason for access denial
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/check', authenticate, checkAccess);

export default router;
