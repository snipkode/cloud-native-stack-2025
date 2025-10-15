import { Role, User, Permission } from './types';

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
export class InMemoryStorage implements StorageBackend {
  private roles: Map<string, Role> = new Map();
  private users: Map<string, User> = new Map();

  async initialize(): Promise<void> {
    // Nothing needed for in-memory storage
  }

  async storeRole(role: Role): Promise<void> {
    this.roles.set(role.id, role);
  }

  async getRole(roleId: string): Promise<Role | null> {
    return this.roles.get(roleId) || null;
  }

  async deleteRole(roleId: string): Promise<void> {
    this.roles.delete(roleId);
  }

  async listRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async storeUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async close(): Promise<void> {
    // Nothing needed for in-memory storage
  }
}