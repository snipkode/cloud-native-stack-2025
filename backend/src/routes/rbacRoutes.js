import express from 'express';
import { rbacController } from '../controllers/RBACController.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { 
  requirePermission, 
  requireAnyPermission, 
  loadUserPermissions 
} from '../middleware/rbac.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role-Based Access Control management
 */

/**
 * @swagger
 * /rbac/permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [RBAC]
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
 *                 description: Permission name in format resource:action
 *               description:
 *                 type: string
 *                 description: Permission description
 *               resourceType:
 *                 type: string
 *                 description: Type of resource
 *               action:
 *                 type: string
 *                 description: Action that can be performed
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 permission:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Permission already exists
 */
router.post('/permissions', authenticateAdmin, rbacController.createPermission);

/**
 * @swagger
 * /rbac/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *       403:
 *         description: Insufficient permissions
 */
router.get('/permissions', authenticateAdmin, rbacController.getPermissions);

/**
 * @swagger
 * /rbac/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [RBAC]
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
 *                 description: Role name
 *               description:
 *                 type: string
 *                 description: Role description
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 role:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Role already exists
 */
router.post('/roles', authenticateAdmin, rbacController.createRole);

/**
 * @swagger
 * /rbac/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       403:
 *         description: Insufficient permissions
 */
router.get('/roles', authenticateAdmin, rbacController.getRoles);

/**
 * @swagger
 * /rbac/users/{userId}/roles:
 *   post:
 *     summary: Assign a role to a user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *                 description: Role ID to assign
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/users/:userId/roles', authenticateAdmin, rbacController.assignRoleToUser);

/**
 * @swagger
 * /rbac/users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Remove a role from a user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Role ID to remove
 *     responses:
 *       200:
 *         description: Role removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/users/:userId/roles/:roleId', authenticateAdmin, rbacController.removeRoleFromUser);

/**
 * @swagger
 * /rbac/users/{userId}/permissions:
 *   post:
 *     summary: Grant a specific permission to a user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionId:
 *                 type: string
 *                 format: uuid
 *                 description: Permission ID to grant
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *               reason:
 *                 type: string
 *                 description: Optional reason for granting permission
 *     responses:
 *       200:
 *         description: Permission granted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/users/:userId/permissions', authenticateAdmin, rbacController.grantPermissionToUser);

/**
 * @swagger
 * /rbac/users/{userId}/permissions/{permissionId}:
 *   delete:
 *     summary: Revoke a specific permission from a user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: permissionId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Permission ID to revoke
 *     responses:
 *       200:
 *         description: Permission revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/users/:userId/permissions/:permissionId', authenticateAdmin, rbacController.revokePermissionFromUser);

/**
 * @swagger
 * /rbac/roles/{roleId}/permissions:
 *   post:
 *     summary: Assign a permission to a role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionId:
 *                 type: string
 *                 format: uuid
 *                 description: Permission ID to assign
 *     responses:
 *       200:
 *         description: Permission assigned to role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 */
router.post('/roles/:roleId/permissions', authenticateAdmin, rbacController.assignPermissionToRole);

/**
 * @swagger
 * /rbac/roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove a permission from a role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Role ID
 *       - in: path
 *         name: permissionId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Permission ID to remove
 *     responses:
 *       200:
 *         description: Permission removed from role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/roles/:roleId/permissions/:permissionId', authenticateAdmin, rbacController.removePermissionFromRole);

/**
 * @swagger
 * /rbac/users/{userId}/permissions:
 *   get:
 *     summary: Get user's permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 permissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPermission'
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users/:userId/permissions', authenticateAdmin, rbacController.getUserPermissions);

/**
 * @swagger
 * /rbac/my/permissions:
 *   get:
 *     summary: Get current user's permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 permissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPermission'
 */
router.get('/my/permissions', loadUserPermissions, rbacController.getCurrentUserPermissions);

export default router;