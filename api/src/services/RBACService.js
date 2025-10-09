import { Permission, Role, UserPermission, UserRole, User, RolePermission } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * RBAC Service - Provides fine-grained access control functionality
 */
export class RBACService {
  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(userId, permissionName, resourceId = null) {
    try {
      // Get user with their roles and direct permissions
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }, // Don't include junction table attributes
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              }
            ]
          },
          {
            model: Permission,
            as: 'directPermissions',
            through: { attributes: ['expiresAt'] },
          }
        ]
      });

      if (!user) {
        return false;
      }

      // Check if user is admin (super user)
      if (user.role === 'admin') {
        return true;
      }

      // Check direct user permissions
      const directPermission = user.directPermissions.find(perm => {
        const matches = perm.name === permissionName;
        // Check expiration if applicable
        const isNotExpired = !user.UserPermission || !user.UserPermission.expiresAt || 
                             new Date(user.UserPermission.expiresAt) > new Date();
        return matches && isNotExpired;
      });

      if (directPermission) {
        return true;
      }

      // Check role-based permissions
      for (const role of user.roles) {
        if (role.Permissions) {
          const rolePermission = role.Permissions.find(perm => perm.name === permissionName);
          if (rolePermission) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('RBACService: Error checking user permission:', error.message);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: ['expiresAt'] }, // Include expiration from UserRole
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              }
            ]
          },
          {
            model: Permission,
            as: 'directPermissions',
            through: { attributes: ['expiresAt', 'grantedAt', 'reason'] },
          }
        ]
      });

      if (!user) {
        return [];
      }

      const permissions = new Set();

      // Add direct permissions
      user.directPermissions.forEach(perm => {
        if (!perm.UserPermission.expiresAt || new Date(perm.UserPermission.expiresAt) > new Date()) {
          permissions.add({
            name: perm.name,
            description: perm.description,
            resourceType: perm.resourceType,
            action: perm.action,
            type: 'direct',
            grantedAt: perm.UserPermission.grantedAt,
            reason: perm.UserPermission.reason
          });
        }
      });

      // Add role-based permissions
      for (const role of user.roles) {
        // Check if role is expired
        const isRoleExpired = role.UserRole && role.UserRole.expiresAt && 
                             new Date(role.UserRole.expiresAt) < new Date();
        
        if (!isRoleExpired) {
          role.Permissions.forEach(perm => {
            permissions.add({
              name: perm.name,
              description: perm.description,
              resourceType: perm.resourceType,
              action: perm.action,
              type: 'role',
              roleName: role.name
            });
          });
        }
      }

      // Add system permissions for admin
      if (user.role === 'admin') {
        permissions.add({
          name: '*:*',
          description: 'All permissions (admin)',
          resourceType: '*',
          action: '*',
          type: 'system',
          roleName: 'admin'
        });
      }

      return Array.from(permissions);
    } catch (error) {
      logger.error('RBACService: Error getting user permissions:', error.message);
      return [];
    }
  }

  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(userId, roleId, assignedBy = null, expiresAt = null) {
    try {
      const [result, created] = await UserRole.findOrCreate({
        where: {
          userId,
          roleId
        },
        defaults: {
          userId,
          roleId,
          assignedBy,
          expiresAt,
        }
      });
      return { result, created };
    } catch (error) {
      logger.error('RBACService: Error assigning role to user:', error.message);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRoleFromUser(userId, roleId) {
    try {
      await UserRole.destroy({
        where: {
          userId,
          roleId,
        }
      });
    } catch (error) {
      logger.error('RBACService: Error removing role from user:', error.message);
      throw error;
    }
  }

  /**
   * Grant a specific permission to a user
   */
  static async grantPermissionToUser(userId, permissionId, grantedBy = null, expiresAt = null, reason = null) {
    try {
      const [result, created] = await UserPermission.findOrCreate({
        where: {
          userId,
          permissionId
        },
        defaults: {
          userId,
          permissionId,
          grantedBy,
          expiresAt,
          reason,
        }
      });
      return { result, created };
    } catch (error) {
      logger.error('RBACService: Error granting permission to user:', error.message);
      throw error;
    }
  }

  /**
   * Revoke a specific permission from a user
   */
  static async revokePermissionFromUser(userId, permissionId) {
    try {
      await UserPermission.destroy({
        where: {
          userId,
          permissionId,
        }
      });
    } catch (error) {
      logger.error('RBACService: Error revoking permission from user:', error.message);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  static async createPermission(name, description, resourceType, action, systemDefined = false) {
    try {
      const [permission, created] = await Permission.findOrCreate({
        where: { name },
        defaults: {
          name,
          description,
          resourceType,
          action,
          systemDefined,
        }
      });
      return { permission, created };
    } catch (error) {
      logger.error('RBACService: Error creating permission:', error.message);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  static async createRole(name, description, systemDefined = false) {
    try {
      const [role, created] = await Role.findOrCreate({
        where: { name },
        defaults: {
          name,
          description,
          systemDefined,
        }
      });
      return { role, created };
    } catch (error) {
      logger.error('RBACService: Error creating role:', error.message);
      throw error;
    }
  }

  /**
   * Assign a permission to a role
   */
  static async assignPermissionToRole(permissionId, roleId) {
    try {
      const result = await RolePermission.create({
        permissionId,
        roleId,
      });
      return result;
    } catch (error) {
      logger.error('RBACService: Error assigning permission to role:', error.message);
      throw error;
    }
  }

  /**
   * Remove a permission from a role
   */
  static async removePermissionFromRole(permissionId, roleId) {
    try {
      await RolePermission.destroy({
        where: {
          permissionId,
          roleId,
        }
      });
    } catch (error) {
      logger.error('RBACService: Error removing permission from role:', error.message);
      throw error;
    }
  }

  /**
   * Evaluate if a user can perform an action on a specific resource
   * This includes both permission check and ownership validation when applicable
   */
  static async canUserPerformOnResource(userId, action, resourceType, resourceId = null) {
    // For no specific resource ID, check basic permission
    if (!resourceId) {
      const permissionName = `${resourceType}:${action}`;
      return await this.hasPermission(userId, permissionName);
    }
    
    // For specific resources, verify the user has legitimate access to it
    // This can be through: admin privileges, general permission, ownership, or granted access
    try {
      // Check if user is admin (super user)
      const user = await import('../models/index.js').then(m => m.User.findByPk(userId));
      if (user && user.role === 'admin') {
        return true;
      }
      
      // Check if this is a user-specific resource (user:read, user:update, etc.)
      if (resourceType === 'user' && resourceId) {
        // Users should only access their own user resource unless they're admin
        return userId === resourceId;
      }
      
      // Check if user has general permission for this type of resource
      const permissionName = `${resourceType}:${action}`;
      const hasGeneralPermission = await this.hasPermission(userId, permissionName);
      
      if (hasGeneralPermission) {
        return true; // User has general permission to perform this action
      }
      
      // For other resource types, there should be a way to check ownership
      // For deployments, we need to check deployment ownership
      if ((resourceType === 'deployment' || resourceType === 'test-deployment') && resourceId) {
        const { Deployment } = await import('../models/index.js');
        // Use paranoid: false to include soft-deleted records when checking ownership
        const deployment = await Deployment.findByPk(resourceId, { paranoid: false });
        
        // If deployment exists and user owns it, allow access
        if (deployment && deployment.userId === userId) {
          return true;
        }
        
        // If not owner, check for granted access through AccessGrants
        const { AccessGrant } = await import('../models/index.js');
        const accessGrant = await AccessGrant.findOne({
          where: {
            userId: userId,
            resourceType: resourceType === 'test-deployment' ? 'deployment' : resourceType, // test-deployment uses same AccessGrant table
            resourceId: resourceId,
          }
        });
        
        if (accessGrant) {
          // Check expiration
          if (accessGrant.expiresAt && new Date(accessGrant.expiresAt) < new Date()) {
            return false;
          }
          // Check if the specific permission is granted
          // Map the action to the corresponding access grant permission
          const permissionMap = {
            'read': ['read', 'view'],
            'create': ['create', 'add'],
            'update': ['update', 'edit', 'modify'],
            'delete': ['delete', 'remove']
          };
          
          const allowedActions = permissionMap[action] || [action];
          const hasGrantedPermission = allowedActions.some(allowedAction => 
            accessGrant.permissions.includes(allowedAction)
          );
          
          return hasGrantedPermission;
        }
        
        return false; // Not owner and no explicit grant
      }
      
      return false; // No general permission and not resource owner
    } catch (error) {
      logger.error('RBACService: Error in resource ownership check:', error.message);
      return false; // Default to deny if there's an error
    }
  }
}

export default RBACService;