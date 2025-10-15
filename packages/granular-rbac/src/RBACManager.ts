import { Role, User, Permission, Action, Resource, EvaluationContext, PermissionCheckResult } from './types';
import { evaluateCondition, permissionMatches } from './utils';
import { StorageBackend, InMemoryStorage } from './storage';

export interface RBACConfig {
  enforceHierarchicalRoles?: boolean;
  cachePermissions?: boolean;
  storage?: StorageBackend; // Optional custom storage backend
}

export class RBACManager {
  private storage: StorageBackend;
  private config: RBACConfig;
  private permissionCache: Map<string, boolean> = new Map(); // Only if caching is enabled
  private initialized: boolean = false;

  constructor(config: RBACConfig = {}) {
    this.config = {
      enforceHierarchicalRoles: config.enforceHierarchicalRoles ?? true,
      cachePermissions: config.cachePermissions ?? false,
      storage: config.storage || new InMemoryStorage(), // Use provided storage or default to in-memory
    };
    
    this.storage = this.config.storage!;
  }

  /**
   * Initializes the RBAC manager and storage backend
   */
  public async initialize(): Promise<void> {
    await this.storage.initialize();
    this.initialized = true;
  }

  /**
   * Adds a role to the RBAC system
   */
  public async addRole(role: Role): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Validate role structure
    if (!role.id) {
      throw new Error('Role must have an id');
    }
    if (!role.name) {
      throw new Error('Role must have a name');
    }
    if (!Array.isArray(role.permissions)) {
      throw new Error('Role permissions must be an array');
    }

    await this.storage.storeRole(role);
    
    // Clear cache when roles change
    if (this.config.cachePermissions) {
      this.permissionCache.clear();
    }
  }

  /**
   * Removes a role from the RBAC system
   */
  public async removeRole(roleId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    await this.storage.deleteRole(roleId);
    
    // Clear cache when roles change
    if (this.config.cachePermissions) {
      this.permissionCache.clear();
    }
  }

  /**
   * Gets a role by its ID
   */
  public async getRole(roleId: string): Promise<Role | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return await this.storage.getRole(roleId);
  }

  /**
   * Adds a user to the RBAC system
   */
  public async addUser(user: User): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!user.id) {
      throw new Error('User must have an id');
    }
    if (!Array.isArray(user.roles)) {
      throw new Error('User roles must be an array');
    }

    await this.storage.storeUser(user);
    
    // Clear cache when users change
    if (this.config.cachePermissions) {
      this.permissionCache.clear();
    }
  }

  /**
   * Updates a user in the RBAC system
   */
  public async updateUser(userId: string, user: Partial<User>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const existingUser = await this.storage.getUser(userId);
    if (!existingUser) {
      throw new Error(`User with id ${userId} does not exist`);
    }

    // Merge the existing user with the update
    const updatedUser = { ...existingUser, ...user } as User;
    await this.storage.storeUser(updatedUser);
    
    // Clear cache when users change
    if (this.config.cachePermissions) {
      this.permissionCache.clear();
    }
  }

  /**
   * Removes a user from the RBAC system
   */
  public async removeUser(userId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    await this.storage.deleteUser(userId);
    
    // Clear cache when users change
    if (this.config.cachePermissions) {
      this.permissionCache.clear();
    }
  }

  /**
   * Gets a user by their ID
   */
  public async getUser(userId: string): Promise<User | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return await this.storage.getUser(userId);
  }

  /**
   * Assigns a role to a user
   */
  public async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} does not exist`);
    }

    const role = await this.storage.getRole(roleId);
    if (!role) {
      throw new Error(`Role with id ${roleId} does not exist`);
    }

    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
      await this.storage.storeUser(user);
      
      // Clear cache when user roles change
      if (this.config.cachePermissions) {
        this.permissionCache.clear();
      }
    }
  }

  /**
   * Revokes a role from a user
   */
  public async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const user = await this.storage.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} does not exist`);
    }

    const roleIndex = user.roles.indexOf(roleId);
    if (roleIndex > -1) {
      user.roles.splice(roleIndex, 1);
      await this.storage.storeUser(user);
      
      // Clear cache when user roles change
      if (this.config.cachePermissions) {
        this.permissionCache.clear();
      }
    }
  }

  /**
   * Checks if a user has permission to perform an action on a resource
   */
  public async can(
    userId: string,
    action: string | Action,
    resource: string | Resource
  ): Promise<PermissionCheckResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Convert string parameters to objects if needed
    const actionObj = typeof action === 'string' 
      ? { type: action, resource: typeof resource === 'string' ? resource : resource.type } 
      : action;
      
    const resourceObj = typeof resource === 'string' 
      ? { type: resource, id: 'any' } 
      : resource;

    const user = await this.storage.getUser(userId);
    if (!user) {
      return {
        allowed: false,
        reason: `User with id ${userId} does not exist`
      };
    }

    // Create evaluation context
    const context: EvaluationContext = {
      user,
      action: actionObj,
      resource: resourceObj
    };

    // Create cache key if caching is enabled
    let cacheKey: string | undefined;
    if (this.config.cachePermissions) {
      cacheKey = `${userId}:${actionObj.type}:${resourceObj.type}:${resourceObj.id}`;
      const cachedResult = this.permissionCache.get(cacheKey);
      if (cachedResult !== undefined) {
        return { allowed: cachedResult };
      }
    }

    // Check permissions directly assigned to the user
    const directPermissionsResult = this.checkUserPermissions(user, actionObj.type, resourceObj, context);
    if (directPermissionsResult.allowed) {
      if (this.config.cachePermissions && cacheKey) {
        this.permissionCache.set(cacheKey, true);
      }
      return directPermissionsResult;
    }

    // Check permissions from user's roles
    const rolePermissionsResult = await this.checkRolePermissions(user, actionObj.type, resourceObj, context);
    if (rolePermissionsResult.allowed) {
      if (this.config.cachePermissions && cacheKey) {
        this.permissionCache.set(cacheKey, true);
      }
      return rolePermissionsResult;
    }

    // No permission found
    const result = {
      allowed: false,
      reason: `User does not have permission to perform action '${actionObj.type}' on resource type '${resourceObj.type}'`
    };

    if (this.config.cachePermissions && cacheKey) {
      this.permissionCache.set(cacheKey, false);
    }

    return result;
  }

  /**
   * Checks permissions directly assigned to a user
   */
  private checkUserPermissions(
    user: User,
    action: string,
    resource: Resource,
    context: EvaluationContext
  ): PermissionCheckResult {
    if (!user.permissions) {
      return { allowed: false };
    }

    for (const permission of user.permissions) {
      if (permissionMatches(permission, action, resource.type)) {
        // Check if condition applies (if any)
        if (permission.condition) {
          if (evaluateCondition(permission.condition, context)) {
            return {
              allowed: true,
              applicablePermissions: [permission]
            };
          }
        } else {
          // Permission without condition is always applicable
          return {
            allowed: true,
            applicablePermissions: [permission]
          };
        }
      }
    }

    return { allowed: false };
  }

  /**
   * Checks permissions from user's roles
   */
  private async checkRolePermissions(
    user: User,
    action: string,
    resource: Resource,
    context: EvaluationContext
  ): Promise<PermissionCheckResult> {
    const allPermissions: Permission[] = [];
    
    // Collect permissions from all roles (direct and inherited)
    for (const roleId of user.roles) {
      const rolePermissions = await this.getRolePermissions(roleId);
      allPermissions.push(...rolePermissions);
    }

    // Check each permission
    for (const permission of allPermissions) {
      if (permissionMatches(permission, action, resource.type)) {
        // Check if condition applies (if any)
        if (permission.condition) {
          if (evaluateCondition(permission.condition, context)) {
            return {
              allowed: true,
              applicablePermissions: [permission]
            };
          }
        } else {
          // Permission without condition is always applicable
          return {
            allowed: true,
            applicablePermissions: [permission]
          };
        }
      }
    }

    return { allowed: false };
  }

  /**
   * Gets all permissions for a role including inherited permissions
   */
  private async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.storage.getRole(roleId);
    if (!role) {
      return [];
    }

    let permissions = [...role.permissions];

    // Include permissions from parent roles if hierarchical roles are enforced
    if (this.config.enforceHierarchicalRoles && role.parentRoles) {
      for (const parentRoleId of role.parentRoles) {
        const parentPermissions = await this.getRolePermissions(parentRoleId);
        permissions = [...permissions, ...parentPermissions];
      }
    }

    return permissions;
  }

  /**
   * Gets all permissions for a user (from roles and direct permissions)
   */
  public async getUserPermissions(userId: string): Promise<Permission[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const user = await this.storage.getUser(userId);
    if (!user) {
      return [];
    }

    // Get permissions from roles
    let allPermissions: Permission[] = [];
    for (const roleId of user.roles) {
      const rolePermissions = await this.getRolePermissions(roleId);
      allPermissions = [...allPermissions, ...rolePermissions];
    }

    // Add direct user permissions if they exist
    if (user.permissions) {
      allPermissions = [...allPermissions, ...user.permissions];
    }

    return allPermissions;
  }

  /**
   * Checks multiple permissions at once
   */
  public async canAll(
    userId: string,
    permissions: Array<{ action: string | Action, resource: string | Resource }>
  ): Promise<PermissionCheckResult> {
    for (const perm of permissions) {
      const result = await this.can(userId, perm.action, perm.resource);
      if (!result.allowed) {
        return result; // Return the first failure
      }
    }
    
    return { allowed: true, reason: 'All permissions granted' };
  }

  /**
   * Checks if any of the permissions are granted
   */
  public async canAny(
    userId: string,
    permissions: Array<{ action: string | Action, resource: string | Resource }>
  ): Promise<PermissionCheckResult> {
    if (permissions.length === 0) {
      return { allowed: false, reason: 'No permissions to check' };
    }

    for (const perm of permissions) {
      const result = await this.can(userId, perm.action, perm.resource);
      if (result.allowed) {
        return result; // Return the first success
      }
    }
    
    return { allowed: false, reason: 'No permissions granted' };
  }

  /**
   * Resets the permission cache
   */
  public clearCache(): void {
    if (this.config.cachePermissions) {
      this.permissionCache.clear();
    }
  }

  /**
   * Gets the number of users in the system
   */
  public async getUserCount(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    const users = await this.storage.listUsers();
    return users.length;
  }

  /**
   * Gets the number of roles in the system
   */
  public async getRoleCount(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    const roles = await this.storage.listRoles();
    return roles.length;
  }

  /**
   * Gets all users in the system
   */
  public async listUsers(): Promise<User[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.storage.listUsers();
  }

  /**
   * Gets all roles in the system
   */
  public async listRoles(): Promise<Role[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return await this.storage.listRoles();
  }

  /**
   * Closes the storage backend connection
   */
  public async close(): Promise<void> {
    await this.storage.close();
  }
}