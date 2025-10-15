# Granular RBAC

A granular Role-Based Access Control system for Node.js applications that provides fine-grained permission management with support for conditions and context-based authorization. The system includes persistent storage capabilities for production environments.

## Installation

```bash
npm install granular-rbac
```

## Basic Usage

### Setting Up Roles and Permissions

```typescript
import { RBACManager, Role, User } from 'granular-rbac';

// Initialize the RBAC manager
const rbac = new RBACManager();

// Initialize the manager (required for async storage)
await rbac.initialize();

// Define roles with permissions
const adminRole: Role = {
  id: 'admin',
  name: 'Administrator',
  description: 'Full access to all resources',
  permissions: [
    { action: 'read', resourceType: 'user' },
    { action: 'write', resourceType: 'user' },
    { action: 'delete', resourceType: 'user' },
    { action: 'read', resourceType: 'post' },
    { action: 'write', resourceType: 'post' },
    { action: 'delete', resourceType: 'post' }
  ]
};

const editorRole: Role = {
  id: 'editor',
  name: 'Editor',
  description: 'Can read and write posts, but not delete them',
  permissions: [
    { action: 'read', resourceType: 'post' },
    { action: 'write', resourceType: 'post' }
  ]
};

// Add roles to the RBAC system (async operations)
await rbac.addRole(adminRole);
await rbac.addRole(editorRole);
```

### Adding Users

```typescript
// Define users
const adminUser: User = {
  id: 'user1',
  roles: ['admin'],
  name: 'Admin User'
};

const editorUser: User = {
  id: 'user2',
  roles: ['editor'],
  name: 'Editor User'
};

// Add users to the RBAC system (async operations)
await rbac.addUser(adminUser);
await rbac.addUser(editorUser);
```

### Checking Permissions

```typescript
// Check if admin user can delete a user resource
const result1 = await rbac.can('user1', 'delete', { type: 'user', id: 'some-user-id' });
console.log(result1.allowed); // true

// Check if editor user can delete a post
const result2 = await rbac.can('user2', 'delete', { type: 'post', id: 'some-post-id' });
console.log(result2.allowed); // false
```

## Persistent Storage

The RBAC system supports persistent storage through a pluggable storage backend interface. By default, it uses in-memory storage, but you can implement custom storage for databases, file systems, etc.

### Custom Storage Backend

```typescript
import { StorageBackend, Role, User } from 'granular-rbac';

class CustomStorage implements StorageBackend {
  async initialize(): Promise<void> {
    // Initialize your storage connection
  }

  async storeRole(role: Role): Promise<void> {
    // Store the role in your storage system
  }

  async getRole(roleId: string): Promise<Role | null> {
    // Retrieve the role from your storage system
    return null;
  }

  async deleteRole(roleId: string): Promise<void> {
    // Delete the role from your storage system
  }

  async listRoles(): Promise<Role[]> {
    // List all roles from your storage system
    return [];
  }

  async storeUser(user: User): Promise<void> {
    // Store the user in your storage system
  }

  async getUser(userId: string): Promise<User | null> {
    // Retrieve the user from your storage system
    return null;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete the user from your storage system
  }

  async listUsers(): Promise<User[]> {
    // List all users from your storage system
    return [];
  }

  async close(): Promise<void> {
    // Close your storage connection
  }
}

// Use your custom storage
const customStorage = new CustomStorage();
const rbac = new RBACManager({ storage: customStorage });
```

## Advanced Usage

### Conditional Permissions

You can define permissions with conditions that determine when they apply:

```typescript
// Allow users to edit their own posts
const authorRole: Role = {
  id: 'author',
  name: 'Author',
  permissions: [
    {
      action: 'write',
      resourceType: 'post',
      condition: {
        type: 'resource',
        field: 'authorId',
        operator: 'eq',
        value: '{userId}' // This would be resolved dynamically
      }
    }
  ]
};

await rbac.addRole(authorRole);
```

### Context-Based Authorization

Permissions can be evaluated based on additional context:

```typescript
// Allow access only during business hours
const businessHoursPermission = {
  action: 'read',
  resourceType: 'report',
  condition: {
    type: 'context',
    field: 'hour',
    operator: 'gte',
    value: 9
  }
};

// Check permission with context
const contextResult = await rbac.can(
  'user1',
  'read',
  { type: 'report', id: 'report1' },
  { hour: 14 } // Context with current hour
);
```

### Custom Condition Functions

You can also use custom functions for complex conditions:

```typescript
const customRole: Role = {
  id: 'vip',
  name: 'VIP User',
  permissions: [
    {
      action: 'premium-access',
      resourceType: 'feature',
      condition: {
        type: 'function',
        customFunction: (context, user, resource) => {
          // Custom logic here
          return user.membership === 'vip' && context.currentDate < user.subscriptionExpiry;
        }
      }
    }
  ]
};

await rbac.addRole(customRole);
```

### Hierarchical Roles

Roles can inherit permissions from parent roles:

```typescript
const managerRole: Role = {
  id: 'manager',
  name: 'Manager',
  permissions: [
    { action: 'read', resourceType: 'report' },
    { action: 'write', resourceType: 'report' }
  ],
  parentRoles: ['editor'] // Inherits permissions from editor
};

await rbac.addRole(managerRole);
```

### Direct User Permissions

Users can have permissions assigned directly to them, beyond their roles:

```typescript
const specialUser: User = {
  id: 'user3',
  roles: ['editor'],
  permissions: [
    { 
      action: 'delete', 
      resourceType: 'post',
      condition: {
        type: 'resource',
        field: 'status',
        operator: 'eq',
        value: 'draft'
      }
    }
  ]
};

await rbac.addUser(specialUser);
```

### Bulk Permission Checks

Check multiple permissions at once:

```typescript
// Check if user has ALL of the specified permissions
const allResult = await rbac.canAll('user1', [
  { action: 'read', resource: { type: 'post', id: '1' } },
  { action: 'write', resource: { type: 'post', id: '1' } },
  { action: 'delete', resource: { type: 'post', id: '1' } }
]);

// Check if user has ANY of the specified permissions
const anyResult = await rbac.canAny('user2', [
  { action: 'read', resource: { type: 'post', id: '1' } },
  { action: 'write', resource: { type: 'post', id: '1' } },
  { action: 'delete', resource: { type: 'post', id: '1' } }
]);
```

## API Reference

### `RBACManager`

The main class for managing roles, users, and permissions.

#### `constructor(config?: RBACConfig)`

Initializes a new RBAC manager.

**Parameters:**
- `config` (optional): Configuration object
  - `enforceHierarchicalRoles`: Whether role inheritance should be enforced (default: true)
  - `cachePermissions`: Whether to cache permission results for performance (default: false)
  - `storage`: Custom storage backend implementation (default: in-memory storage)

#### `initialize()`

Initializes the RBAC manager and storage backend (required for async operations).

#### `addRole(role: Role)`

Adds a role to the RBAC system (async).

#### `removeRole(roleId: string)`

Removes a role from the RBAC system (async).

#### `getRole(roleId: string)`

Gets a role by its ID (async).

#### `addUser(user: User)`

Adds a user to the RBAC system (async).

#### `updateUser(userId: string, user: Partial<User>)`

Updates a user in the RBAC system (async).

#### `removeUser(userId: string)`

Removes a user from the RBAC system (async).

#### `getUser(userId: string)`

Gets a user by their ID (async).

#### `assignRoleToUser(userId: string, roleId: string)`

Assigns a role to a user (async).

#### `revokeRoleFromUser(userId: string, roleId: string)`

Revokes a role from a user (async).

#### `can(userId: string, action: string | Action, resource: string | Resource)`

Checks if a user has permission to perform an action on a resource (async).

#### `canAll(userId: string, permissions: Array<{ action: string | Action, resource: string | Resource }>)`

Checks if a user has ALL of the specified permissions (async).

#### `canAny(userId: string, permissions: Array<{ action: string | Action, resource: string | Resource }>)`

Checks if a user has ANY of the specified permissions (async).

#### `getUserPermissions(userId: string)`

Gets all permissions for a user (from roles and direct permissions) (async).

#### `listUsers()`

Gets all users in the system (async).

#### `listRoles()`

Gets all roles in the system (async).

#### `getUserCount()`

Gets the number of users in the system (async).

#### `getRoleCount()`

Gets the number of roles in the system (async).

#### `clearCache()`

Clears the permission cache (if caching is enabled).

#### `close()`

Closes the storage backend connection (async).

### Types

#### `StorageBackend`

Interface for implementing custom storage backends:

```typescript
interface StorageBackend {
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
```

#### `Role`

```typescript
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description?: string;
  parentRoles?: string[];
}
```

#### `User`

```typescript
interface User {
  id: string;
  roles: string[];
  permissions?: Permission[];
  [key: string]: any; // Allow additional user properties
}
```

#### `Permission`

```typescript
interface Permission {
  action: string;           // Action type (read, write, delete, etc.)
  resourceType: string;     // Resource type (user, post, etc.)
  condition?: PermissionCondition; // Optional condition for when the permission applies
  attributes?: string[];    // Optional list of attributes user can access
}
```

#### `PermissionCondition`

```typescript
interface PermissionCondition {
  type: 'user' | 'resource' | 'context' | 'function';
  field?: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
  customFunction?: (context: any, user: any, resource: any) => boolean;
}
```

## Caching

For improved performance in high-throughput applications, you can enable permission caching:

```typescript
const rbac = new RBACManager({ cachePermissions: true });

// Remember to clear the cache when roles or users change:
await rbac.addRole(newRole);
rbac.clearCache(); // Manually clear cache
```

## Error Handling

The RBAC system throws standard JavaScript errors when invalid parameters are provided:

- `Error` when trying to add a user without required fields
- `Error` when trying to assign a role that doesn't exist
- `Error` when trying to access a user that doesn't exist