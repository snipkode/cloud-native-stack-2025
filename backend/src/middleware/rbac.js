import RBACService from '../services/RBACService.js';

/**
 * Middleware to check if a user has a specific permission
 */
export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = await RBACService.hasPermission(req.user.id, permissionName);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions', 
          requiredPermission: permissionName,
          userId: req.user.id
        });
      }

      req.userPermissions = req.userPermissions || [];
      if (!req.userPermissions.includes(permissionName)) {
        req.userPermissions.push(permissionName);
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check if a user has any of the specified permissions
 */
export const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      let hasAnyPermission = false;
      let userPermissions = [];

      for (const permName of permissionNames) {
        const hasPermission = await RBACService.hasPermission(req.user.id, permName);
        if (hasPermission) {
          hasAnyPermission = true;
          userPermissions.push(permName);
          break; // Short-circuit after first match
        }
      }

      if (!hasAnyPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions', 
          requiredPermissions: permissionNames,
          userId: req.user.id
        });
      }

      req.userPermissions = req.userPermissions || [];
      req.userPermissions = [...new Set([...req.userPermissions, ...userPermissions])];

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check if a user has all specified permissions
 */
export const requireAllPermissions = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const missingPermissions = [];
      const userPermissions = [];

      for (const permName of permissionNames) {
        const hasPermission = await RBACService.hasPermission(req.user.id, permName);
        if (hasPermission) {
          userPermissions.push(permName);
        } else {
          missingPermissions.push(permName);
        }
      }

      if (missingPermissions.length > 0) {
        return res.status(403).json({ 
          error: 'Missing required permissions', 
          missingPermissions,
          userId: req.user.id
        });
      }

      req.userPermissions = req.userPermissions || [];
      req.userPermissions = [...new Set([...req.userPermissions, ...userPermissions])];

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check resource-specific permissions
 */
export const requireResourcePermission = (permissionAction, resourceType, resourceIdParam = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get resource ID from parameter or use the one from the request
      const resourceId = resourceIdParam ? req.params[resourceIdParam] : req.params.id;

      const permissionName = `${resourceType}:${permissionAction}`;
      const hasPermission = await RBACService.hasPermission(req.user.id, permissionName, resourceId);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions for this resource', 
          requiredPermission: permissionName,
          resourceType,
          resourceId,
          userId: req.user.id
        });
      }

      req.userPermissions = req.userPermissions || [];
      if (!req.userPermissions.includes(permissionName)) {
        req.userPermissions.push(permissionName);
      }

      next();
    } catch (error) {
      console.error('Resource permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check if user can perform action on their own resources only
 */
export const requireOwnResourcePermission = (permissionAction, resourceType, ownerIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // If it's a resource that belongs to the user, allow based on ownership
      if (req.resourceOwnerId && req.resourceOwnerId === req.user.id) {
        // User owns this resource, proceed with ownership-based access
        req.isOwner = true;
        req.userPermissions = req.userPermissions || [];
        req.userPermissions.push(`${resourceType}:${permissionAction}:own`);
        return next();
      }

      // Check if user has the specific permission for any resource
      const permissionName = `${resourceType}:${permissionAction}`;
      const hasGlobalPermission = await RBACService.hasPermission(req.user.id, permissionName);

      if (!hasGlobalPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions. Access limited to own resources only.', 
          requiredPermission: permissionName,
          userId: req.user.id
        });
      }

      req.userPermissions = req.userPermissions || [];
      if (!req.userPermissions.includes(permissionName)) {
        req.userPermissions.push(permissionName);
      }

      next();
    } catch (error) {
      console.error('Own resource permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Middleware to check role-based access
 */
export const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check the user's basic role (admin/user from User model)
      if (req.user.role === roleName) {
        return next();
      }

      // For more complex role checking, we'd need to check through UserRole model
      const userPermissions = await RBACService.getUserPermissions(req.user.id);
      
      // Check if any of the user's roles match the required role
      const hasRequiredRole = userPermissions.some(perm => 
        perm.type === 'role' && perm.roleName === roleName
      );

      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Role access denied', 
          requiredRole: roleName,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role check failed' });
    }
  };
};

/**
 * Middleware to check multiple role possibilities
 */
export const requireAnyRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check the user's basic role
      if (roleNames.includes(req.user.role)) {
        return next();
      }

      // For more complex role checking
      const userPermissions = await RBACService.getUserPermissions(req.user.id);
      
      const hasAnyRole = userPermissions.some(perm => 
        perm.type === 'role' && roleNames.includes(perm.roleName)
      );

      if (!hasAnyRole) {
        return res.status(403).json({ 
          error: 'Role access denied', 
          requiredRoles: roleNames,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role check failed' });
    }
  };
};

/**
 * Enhanced middleware that checks both role and permission
 */
export const requireRoleAndPermission = (roleNames, permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user has required role
      const hasRole = roleNames.includes(req.user.role);
      if (!hasRole) {
        // Check through UserRole model as well
        const userPermissions = await RBACService.getUserPermissions(req.user.id);
        const hasAssignedRole = userPermissions.some(perm => 
          perm.type === 'role' && roleNames.includes(perm.roleName)
        );

        if (!hasAssignedRole) {
          return res.status(403).json({ 
            error: 'Role access denied', 
            requiredRoles: roleNames,
            userRole: req.user.role
          });
        }
      }

      // Check if user has required permission
      const hasPermission = await RBACService.hasPermission(req.user.id, permissionName);

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Permission access denied', 
          requiredPermission: permissionName,
          userId: req.user.id
        });
      }

      next();
    } catch (error) {
      console.error('Role and permission check error:', error);
      return res.status(500).json({ error: 'Access check failed' });
    }
  };
};

/**
 * Middleware to check and load user permissions into request
 */
export const loadUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      req.userPermissions = [];
      return next();
    }

    const permissions = await RBACService.getUserPermissions(req.user.id);
    req.userPermissions = permissions;

    // Create a map for easier permission checking
    req.hasPermission = (permissionName) => {
      return permissions.some(perm => perm.name === permissionName);
    };

    // Check for specific permission patterns
    req.can = (action, resourceType) => {
      const permissionName = `${resourceType}:${action}`;
      return req.hasPermission(permissionName);
    };

    next();
  } catch (error) {
    console.error('Error loading user permissions:', error);
    req.userPermissions = [];
    next();
  }
};

/**
 * Middleware to check if a user can perform an operation on a resource
 */
export const canUserPerform = (action, resourceType, resourceIdParam = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const resourceId = resourceIdParam ? req.params[resourceIdParam] : req.params.id;

      const canPerform = await RBACService.canUserPerformOnResource(
        req.user.id, 
        action, 
        resourceType, 
        resourceId
      );

      if (!canPerform) {
        return res.status(403).json({ 
          error: 'User cannot perform this action on this resource',
          action,
          resourceType,
          resourceId,
          userId: req.user.id
        });
      }

      next();
    } catch (error) {
      console.error('User action check error:', error);
      return res.status(500).json({ error: 'Action permission check failed' });
    }
  };
};