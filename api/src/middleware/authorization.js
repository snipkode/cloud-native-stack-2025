import { AccessGrant } from '../models/index.js';
import RBACService from '../services/RBACService.js';

/**
 * Middleware that checks if a user has permission to perform an action on a resource
 * @deprecated Use the new RBAC middleware instead
 */
export const authorize = (resourceType, permission) => {
  return async (req, res, next) => {
    try {
      const { id: resourceId } = req.params; // Extract resource ID from URL params
      
      // Check if user is the owner of the resource
      if (req.user && req.resourceOwnerId) {
        if (req.user.id === req.resourceOwnerId) {
          return next(); // User is the owner, allow access
        }
      }

      // Check for explicit access grants
      const accessGrant = await AccessGrant.findOne({
        where: {
          userId: req.user.id,
          resourceType,
          resourceId: resourceId || null, // Use specific resource ID or null for general resource type
        },
      });

      if (!accessGrant) {
        return res.status(403).json({ error: 'Access denied: No access grant found' });
      }

      // Check if access grant has expired
      if (accessGrant.expiresAt && new Date(accessGrant.expiresAt) < new Date()) {
        return res.status(403).json({ error: 'Access denied: Access grant expired' });
      }

      // Check if the specific permission is granted
      const hasPermission = accessGrant.permissions.includes(permission);
      if (!hasPermission) {
        return res.status(403).json({ error: `Access denied: Missing permission '${permission}'` });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

/**
 * RBAC middleware for deployment resources
 * @deprecated Use the new RBAC middleware instead
 */
export const requireDeploymentAccess = (permission) => {
  return authorize('deployment', permission);
};

/**
 * Middleware to verify the user has access to a specific deployment
 * This also ensures the deployment exists
 * @deprecated Use the new RBAC middleware instead
 */
export const checkDeploymentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First, try to find the deployment associated with this request
    // Importing here to avoid circular dependencies
    const { Deployment } = await import('../models/index.js');
    
    const deployment = await Deployment.findByPk(id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    // Store the deployment owner ID in the request for later use
    req.resourceOwnerId = deployment.userId;
    
    // Check if user is the owner
    if (req.user.id === deployment.userId) {
      req.isOwner = true;
      return next();
    }
    
    // If not owner, check for granted access
    const accessGrant = await AccessGrant.findOne({
      where: {
        userId: req.user.id,
        resourceType: 'deployment',
        resourceId: id,
      },
    });
    
    if (!accessGrant) {
      // Check for general deployment access
      const generalAccess = await AccessGrant.findOne({
        where: {
          userId: req.user.id,
          resourceType: 'deployment',
          resourceId: null,
        },
      });
      
      if (!generalAccess) {
        return res.status(403).json({ error: 'Access denied to this deployment' });
      }
      
      // Check expiration for general access
      if (generalAccess.expiresAt && new Date(generalAccess.expiresAt) < new Date()) {
        return res.status(403).json({ error: 'Access denied: Access grant expired' });
      }
      
      req.accessGrant = generalAccess;
    } else {
      // Check expiration and permissions for specific access
      if (accessGrant.expiresAt && new Date(accessGrant.expiresAt) < new Date()) {
        return res.status(403).json({ error: 'Access denied: Access grant expired' });
      }
      
      req.accessGrant = accessGrant;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Access verification failed' });
  }
};

/**
 * Enhanced middleware that checks if a user has permission to perform an action on a resource
 * Uses the new fine-grained RBAC system
 */
export const rbacAuthorize = (permissionAction, resourceType, resourceIdParam = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get resource ID from parameter or use a default
      const resourceId = resourceIdParam ? req.params[resourceIdParam] : req.params.id;

      // Check using the new RBAC service
      const hasPermission = await RBACService.canUserPerformOnResource(
        req.user.id, 
        permissionAction, 
        resourceType, 
        resourceId
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Access denied', 
          requiredPermission: `${resourceType}:${permissionAction}`,
          resourceType,
          resourceId,
          userId: req.user.id
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

/**
 * Enhanced RBAC middleware for deployment resources using new system
 */
export const requireRBACDeploymentAccess = (permissionAction) => {
  return rbacAuthorize(permissionAction, 'deployment');
};