import { Role, User } from './types';
/**
 * Interface for storage backends
 */
export interface StorageBackend {
    /**
     * Initialize the storage backend
     */
    initialize(): Promise<void>;
    /**
     * Store a role
     */
    storeRole(role: Role): Promise<void>;
    /**
     * Retrieve a role by ID
     */
    getRole(roleId: string): Promise<Role | null>;
    /**
     * Delete a role
     */
    deleteRole(roleId: string): Promise<void>;
    /**
     * List all roles
     */
    listRoles(): Promise<Role[]>;
    /**
     * Store a user
     */
    storeUser(user: User): Promise<void>;
    /**
     * Retrieve a user by ID
     */
    getUser(userId: string): Promise<User | null>;
    /**
     * Delete a user
     */
    deleteUser(userId: string): Promise<void>;
    /**
     * List all users
     */
    listUsers(): Promise<User[]>;
    /**
     * Close the storage backend connection
     */
    close(): Promise<void>;
}
/**
 * In-memory storage implementation for backward compatibility
 */
export declare class InMemoryStorage implements StorageBackend {
    private roles;
    private users;
    initialize(): Promise<void>;
    storeRole(role: Role): Promise<void>;
    getRole(roleId: string): Promise<Role | null>;
    deleteRole(roleId: string): Promise<void>;
    listRoles(): Promise<Role[]>;
    storeUser(user: User): Promise<void>;
    getUser(userId: string): Promise<User | null>;
    deleteUser(userId: string): Promise<void>;
    listUsers(): Promise<User[]>;
    close(): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map