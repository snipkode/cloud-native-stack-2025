import { Role, User, Permission, Action, Resource, PermissionCheckResult } from './types';
import { StorageBackend } from './storage';
export interface RBACConfig {
    enforceHierarchicalRoles?: boolean;
    cachePermissions?: boolean;
    storage?: StorageBackend;
}
export declare class RBACManager {
    private storage;
    private config;
    private permissionCache;
    private initialized;
    constructor(config?: RBACConfig);
    /**
     * Initializes the RBAC manager and storage backend
     */
    initialize(): Promise<void>;
    /**
     * Adds a role to the RBAC system
     */
    addRole(role: Role): Promise<void>;
    /**
     * Removes a role from the RBAC system
     */
    removeRole(roleId: string): Promise<void>;
    /**
     * Gets a role by its ID
     */
    getRole(roleId: string): Promise<Role | null>;
    /**
     * Adds a user to the RBAC system
     */
    addUser(user: User): Promise<void>;
    /**
     * Updates a user in the RBAC system
     */
    updateUser(userId: string, user: Partial<User>): Promise<void>;
    /**
     * Removes a user from the RBAC system
     */
    removeUser(userId: string): Promise<void>;
    /**
     * Gets a user by their ID
     */
    getUser(userId: string): Promise<User | null>;
    /**
     * Assigns a role to a user
     */
    assignRoleToUser(userId: string, roleId: string): Promise<void>;
    /**
     * Revokes a role from a user
     */
    revokeRoleFromUser(userId: string, roleId: string): Promise<void>;
    /**
     * Checks if a user has permission to perform an action on a resource
     */
    can(userId: string, action: string | Action, resource: string | Resource): Promise<PermissionCheckResult>;
    /**
     * Checks permissions directly assigned to a user
     */
    private checkUserPermissions;
    /**
     * Checks permissions from user's roles
     */
    private checkRolePermissions;
    /**
     * Gets all permissions for a role including inherited permissions
     */
    private getRolePermissions;
    /**
     * Gets all permissions for a user (from roles and direct permissions)
     */
    getUserPermissions(userId: string): Promise<Permission[]>;
    /**
     * Checks multiple permissions at once
     */
    canAll(userId: string, permissions: Array<{
        action: string | Action;
        resource: string | Resource;
    }>): Promise<PermissionCheckResult>;
    /**
     * Checks if any of the permissions are granted
     */
    canAny(userId: string, permissions: Array<{
        action: string | Action;
        resource: string | Resource;
    }>): Promise<PermissionCheckResult>;
    /**
     * Resets the permission cache
     */
    clearCache(): void;
    /**
     * Gets the number of users in the system
     */
    getUserCount(): Promise<number>;
    /**
     * Gets the number of roles in the system
     */
    getRoleCount(): Promise<number>;
    /**
     * Gets all users in the system
     */
    listUsers(): Promise<User[]>;
    /**
     * Gets all roles in the system
     */
    listRoles(): Promise<Role[]>;
    /**
     * Closes the storage backend connection
     */
    close(): Promise<void>;
}
//# sourceMappingURL=RBACManager.d.ts.map