"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACManager = void 0;
const utils_1 = require("./utils");
const storage_1 = require("./storage");
class RBACManager {
    constructor(config = {}) {
        this.permissionCache = new Map(); // Only if caching is enabled
        this.initialized = false;
        this.config = {
            enforceHierarchicalRoles: config.enforceHierarchicalRoles ?? true,
            cachePermissions: config.cachePermissions ?? false,
            storage: config.storage || new storage_1.InMemoryStorage(), // Use provided storage or default to in-memory
        };
        this.storage = this.config.storage;
    }
    /**
     * Initializes the RBAC manager and storage backend
     */
    async initialize() {
        await this.storage.initialize();
        this.initialized = true;
    }
    /**
     * Adds a role to the RBAC system
     */
    async addRole(role) {
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
    async removeRole(roleId) {
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
    async getRole(roleId) {
        if (!this.initialized) {
            await this.initialize();
        }
        return await this.storage.getRole(roleId);
    }
    /**
     * Adds a user to the RBAC system
     */
    async addUser(user) {
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
    async updateUser(userId, user) {
        if (!this.initialized) {
            await this.initialize();
        }
        const existingUser = await this.storage.getUser(userId);
        if (!existingUser) {
            throw new Error(`User with id ${userId} does not exist`);
        }
        // Merge the existing user with the update
        const updatedUser = { ...existingUser, ...user };
        await this.storage.storeUser(updatedUser);
        // Clear cache when users change
        if (this.config.cachePermissions) {
            this.permissionCache.clear();
        }
    }
    /**
     * Removes a user from the RBAC system
     */
    async removeUser(userId) {
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
    async getUser(userId) {
        if (!this.initialized) {
            await this.initialize();
        }
        return await this.storage.getUser(userId);
    }
    /**
     * Assigns a role to a user
     */
    async assignRoleToUser(userId, roleId) {
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
    async revokeRoleFromUser(userId, roleId) {
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
    async can(userId, action, resource) {
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
        const context = {
            user,
            action: actionObj,
            resource: resourceObj
        };
        // Create cache key if caching is enabled
        let cacheKey;
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
    checkUserPermissions(user, action, resource, context) {
        if (!user.permissions) {
            return { allowed: false };
        }
        for (const permission of user.permissions) {
            if ((0, utils_1.permissionMatches)(permission, action, resource.type)) {
                // Check if condition applies (if any)
                if (permission.condition) {
                    if ((0, utils_1.evaluateCondition)(permission.condition, context)) {
                        return {
                            allowed: true,
                            applicablePermissions: [permission]
                        };
                    }
                }
                else {
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
    async checkRolePermissions(user, action, resource, context) {
        const allPermissions = [];
        // Collect permissions from all roles (direct and inherited)
        for (const roleId of user.roles) {
            const rolePermissions = await this.getRolePermissions(roleId);
            allPermissions.push(...rolePermissions);
        }
        // Check each permission
        for (const permission of allPermissions) {
            if ((0, utils_1.permissionMatches)(permission, action, resource.type)) {
                // Check if condition applies (if any)
                if (permission.condition) {
                    if ((0, utils_1.evaluateCondition)(permission.condition, context)) {
                        return {
                            allowed: true,
                            applicablePermissions: [permission]
                        };
                    }
                }
                else {
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
    async getRolePermissions(roleId) {
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
    async getUserPermissions(userId) {
        if (!this.initialized) {
            await this.initialize();
        }
        const user = await this.storage.getUser(userId);
        if (!user) {
            return [];
        }
        // Get permissions from roles
        let allPermissions = [];
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
    async canAll(userId, permissions) {
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
    async canAny(userId, permissions) {
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
    clearCache() {
        if (this.config.cachePermissions) {
            this.permissionCache.clear();
        }
    }
    /**
     * Gets the number of users in the system
     */
    async getUserCount() {
        if (!this.initialized) {
            await this.initialize();
        }
        const users = await this.storage.listUsers();
        return users.length;
    }
    /**
     * Gets the number of roles in the system
     */
    async getRoleCount() {
        if (!this.initialized) {
            await this.initialize();
        }
        const roles = await this.storage.listRoles();
        return roles.length;
    }
    /**
     * Gets all users in the system
     */
    async listUsers() {
        if (!this.initialized) {
            await this.initialize();
        }
        return await this.storage.listUsers();
    }
    /**
     * Gets all roles in the system
     */
    async listRoles() {
        if (!this.initialized) {
            await this.initialize();
        }
        return await this.storage.listRoles();
    }
    /**
     * Closes the storage backend connection
     */
    async close() {
        await this.storage.close();
    }
}
exports.RBACManager = RBACManager;
//# sourceMappingURL=RBACManager.js.map