import RBACService from '../services/RBACService.js';
import { Role, Permission, User } from '../models/index.js';

/**
 * RBAC Controller - Manages roles, permissions, and access control
 */
export const rbacController = {
  /**
   * Create a new permission
   */
  createPermission: async (req, res, next) => {
    try {
      const { name, description, resourceType, action } = req.body;

      // Validate required fields
      if (!name || !resourceType || !action) {
        return res.status(400).json({ 
          error: 'Name, resourceType, and action are required' 
        });
      }

      // Check if user has permission to create permissions
      const canCreate = await RBACService.hasPermission(req.user.id, 'permission:create');
      if (!canCreate && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to create permissions' 
        });
      }

      const { permission, created } = await RBACService.createPermission(
        name, 
        description, 
        resourceType, 
        action
      );

      if (!created) {
        return res.status(409).json({ 
          error: 'Permission already exists' 
        });
      }

      res.status(201).json({ 
        message: 'Permission created successfully', 
        permission 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all permissions
   */
  getPermissions: async (req, res, next) => {
    try {
      // Check if user has permission to view permissions
      const canView = await RBACService.hasPermission(req.user.id, 'permission:read');
      if (!canView && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to view permissions' 
        });
      }

      const permissions = await Permission.findAll({
        order: [['resourceType', 'ASC'], ['action', 'ASC']]
      });

      res.json({ permissions });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new role
   */
  createRole: async (req, res, next) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ 
          error: 'Name is required' 
        });
      }

      // Check if user has permission to create roles
      const canCreate = await RBACService.hasPermission(req.user.id, 'role:create');
      if (!canCreate && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to create roles' 
        });
      }

      const { role, created } = await RBACService.createRole(name, description);

      if (!created) {
        return res.status(409).json({ 
          error: 'Role already exists' 
        });
      }

      res.status(201).json({ 
        message: 'Role created successfully', 
        role 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all roles
   */
  getRoles: async (req, res, next) => {
    try {
      // Check if user has permission to view roles
      const canView = await RBACService.hasPermission(req.user.id, 'role:read');
      if (!canView && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to view roles' 
        });
      }

      const roles = await Role.findAll({
        order: [['name', 'ASC']]
      });

      res.json({ roles });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign a role to a user
   */
  assignRoleToUser: async (req, res, next) => {
    try {
      const { userId, roleId, expiresAt } = req.body;

      if (!userId || !roleId) {
        return res.status(400).json({ 
          error: 'userId and roleId are required' 
        });
      }

      // Check if user has permission to assign roles
      const canAssign = await RBACService.hasPermission(req.user.id, 'role:assign');
      if (!canAssign && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to assign roles' 
        });
      }

      // Verify the user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await RBACService.assignRoleToUser(userId, roleId, req.user.id, expiresAt);

      res.json({ 
        message: 'Role assigned successfully' 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a role from a user
   */
  removeRoleFromUser: async (req, res, next) => {
    try {
      const { userId, roleId } = req.params;

      // Check if user has permission to remove roles
      const canRemove = await RBACService.hasPermission(req.user.id, 'role:remove');
      if (!canRemove && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to remove roles' 
        });
      }

      await RBACService.removeRoleFromUser(userId, roleId);

      res.json({ 
        message: 'Role removed successfully' 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Grant a specific permission to a user
   */
  grantPermissionToUser: async (req, res, next) => {
    try {
      const { userId, permissionId, expiresAt, reason } = req.body;

      if (!userId || !permissionId) {
        return res.status(400).json({ 
          error: 'userId and permissionId are required' 
        });
      }

      // Check if user has permission to grant permissions
      const canGrant = await RBACService.hasPermission(req.user.id, 'permission:grant');
      if (!canGrant && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to grant permissions' 
        });
      }

      // Verify the user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await RBACService.grantPermissionToUser(
        userId, 
        permissionId, 
        req.user.id, 
        expiresAt, 
        reason
      );

      res.json({ 
        message: 'Permission granted successfully' 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Revoke a specific permission from a user
   */
  revokePermissionFromUser: async (req, res, next) => {
    try {
      const { userId, permissionId } = req.params;

      // Check if user has permission to revoke permissions
      const canRevoke = await RBACService.hasPermission(req.user.id, 'permission:revoke');
      if (!canRevoke && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to revoke permissions' 
        });
      }

      await RBACService.revokePermissionFromUser(userId, permissionId);

      res.json({ 
        message: 'Permission revoked successfully' 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign a permission to a role
   */
  assignPermissionToRole: async (req, res, next) => {
    try {
      const { permissionId, roleId } = req.body;

      if (!permissionId || !roleId) {
        return res.status(400).json({ 
          error: 'permissionId and roleId are required' 
        });
      }

      // Check if user has permission to assign permissions to roles
      const canAssign = await RBACService.hasPermission(req.user.id, 'role:permission:assign');
      if (!canAssign && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to assign permissions to roles' 
        });
      }

      await RBACService.assignPermissionToRole(permissionId, roleId);

      res.json({ 
        message: 'Permission assigned to role successfully' 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a permission from a role
   */
  removePermissionFromRole: async (req, res, next) => {
    try {
      const { permissionId, roleId } = req.params;

      // Check if user has permission to remove permissions from roles
      const canRemove = await RBACService.hasPermission(req.user.id, 'role:permission:remove');
      if (!canRemove && req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: 'Insufficient permissions to remove permissions from roles' 
        });
      }

      await RBACService.removePermissionFromRole(permissionId, roleId);

      res.json({ 
        message: 'Permission removed from role successfully' 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user's permissions
   */
  getUserPermissions: async (req, res, next) => {
    try {
      const { userId } = req.params;

      // Users can only view their own permissions unless they have admin rights
      if (req.user.id !== userId && req.user.role !== 'admin') {
        const canView = await RBACService.hasPermission(req.user.id, 'permission:view');
        if (!canView) {
          return res.status(403).json({ 
            error: 'Insufficient permissions to view user permissions' 
          });
        }
      }

      const permissions = await RBACService.getUserPermissions(userId);

      res.json({ 
        userId,
        permissions 
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user's permissions
   */
  getCurrentUserPermissions: async (req, res, next) => {
    try {
      const permissions = await RBACService.getUserPermissions(req.user.id);

      res.json({ 
        userId: req.user.id,
        permissions 
      });
    } catch (error) {
      next(error);
    }
  },
};