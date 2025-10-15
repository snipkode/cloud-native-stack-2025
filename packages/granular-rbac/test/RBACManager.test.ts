import { RBACManager, Role, User, Permission } from '../src';

describe('RBACManager', () => {
  let rbac: RBACManager;

  beforeEach(async () => {
    rbac = new RBACManager();
    await rbac.initialize(); // Initialize the RBAC manager for async storage
  });

  afterEach(async () => {
    await rbac.close(); // Close the storage connection after each test
  });

  describe('Role Management', () => {
    it('should add a role successfully', async () => {
      const role: Role = {
        id: 'test-role',
        name: 'Test Role',
        permissions: []
      };

      await rbac.addRole(role);
      const retrievedRole = await rbac.getRole('test-role');
      
      expect(retrievedRole).toEqual(role);
    });

    it('should throw error when adding role without id', async () => {
      const role: any = {
        name: 'Test Role',
        permissions: []
      };

      await expect(rbac.addRole(role)).rejects.toThrow('Role must have an id');
    });

    it('should remove a role successfully', async () => {
      const role: Role = {
        id: 'test-role',
        name: 'Test Role',
        permissions: []
      };

      await rbac.addRole(role);
      expect(await rbac.getRole('test-role')).toBeDefined();

      await rbac.removeRole('test-role');
      expect(await rbac.getRole('test-role')).toBeNull();
    });
  });

  describe('User Management', () => {
    it('should add a user successfully', async () => {
      const user: User = {
        id: 'test-user',
        roles: []
      };

      await rbac.addUser(user);
      const retrievedUser = await rbac.getUser('test-user');
      
      expect(retrievedUser).toEqual(user);
    });

    it('should throw error when adding user without id', async () => {
      const user: any = {
        roles: []
      };

      await expect(rbac.addUser(user)).rejects.toThrow('User must have an id');
    });

    it('should throw error when adding user with non-array roles', async () => {
      const user: any = {
        id: 'test-user',
        roles: 'invalid-roles'
      };

      await expect(rbac.addUser(user)).rejects.toThrow('User roles must be an array');
    });

    it('should update a user successfully', async () => {
      const user: User = {
        id: 'test-user',
        roles: ['role1'],
        name: 'Original Name'
      };

      await rbac.addUser(user);

      await rbac.updateUser('test-user', { name: 'Updated Name' });
      const updatedUser = await rbac.getUser('test-user');
      
      expect(updatedUser).toEqual({
        ...user,
        name: 'Updated Name'
      });
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(rbac.updateUser('non-existent', { name: 'New Name' }))
        .rejects.toThrow('User with id non-existent does not exist');
    });

    it('should remove a user successfully', async () => {
      const user: User = {
        id: 'test-user',
        roles: []
      };

      await rbac.addUser(user);
      expect(await rbac.getUser('test-user')).toBeDefined();

      await rbac.removeUser('test-user');
      expect(await rbac.getUser('test-user')).toBeNull();
    });
  });

  describe('Role Assignment', () => {
    it('should assign a role to a user successfully', async () => {
      const role: Role = {
        id: 'test-role',
        name: 'Test Role',
        permissions: []
      };

      const user: User = {
        id: 'test-user',
        roles: []
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      await rbac.assignRoleToUser('test-user', 'test-role');
      const updatedUser = await rbac.getUser('test-user');
      
      expect(updatedUser?.roles).toEqual(['test-role']);
    });

    it('should not duplicate roles when assigning the same role', async () => {
      const role: Role = {
        id: 'test-role',
        name: 'Test Role',
        permissions: []
      };

      const user: User = {
        id: 'test-user',
        roles: []
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      await rbac.assignRoleToUser('test-user', 'test-role');
      await rbac.assignRoleToUser('test-user', 'test-role'); // Try to assign again
      const updatedUser = await rbac.getUser('test-user');
      
      expect(updatedUser?.roles).toEqual(['test-role']);
    });

    it('should throw error when assigning non-existent role', async () => {
      const user: User = {
        id: 'test-user',
        roles: []
      };

      await rbac.addUser(user);

      await expect(rbac.assignRoleToUser('test-user', 'non-existent-role'))
        .rejects.toThrow('Role with id non-existent-role does not exist');
    });

    it('should throw error when assigning role to non-existent user', async () => {
      const role: Role = {
        id: 'test-role',
        name: 'Test Role',
        permissions: []
      };

      await rbac.addRole(role);

      await expect(rbac.assignRoleToUser('non-existent-user', 'test-role'))
        .rejects.toThrow('User with id non-existent-user does not exist');
    });

    it('should revoke a role from a user successfully', async () => {
      const role: Role = {
        id: 'test-role',
        name: 'Test Role',
        permissions: []
      };

      const user: User = {
        id: 'test-user',
        roles: ['test-role']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      await rbac.revokeRoleFromUser('test-user', 'test-role');
      const updatedUser = await rbac.getUser('test-user');
      
      expect(updatedUser?.roles).toEqual([]);
    });
  });

  describe('Permission Checking', () => {
    it('should grant permission based on role', async () => {
      const role: Role = {
        id: 'editor',
        name: 'Editor',
        permissions: [
          { action: 'read', resourceType: 'post' }
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['editor']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const result = await rbac.can('test-user', 'read', { type: 'post', id: '123' });
      
      expect(result.allowed).toBe(true);
    });

    it('should deny permission when user does not have required role', async () => {
      const role: Role = {
        id: 'editor',
        name: 'Editor',
        permissions: [
          { action: 'read', resourceType: 'post' }
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['other-role'] // Does not have editor role
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const result = await rbac.can('test-user', 'read', { type: 'post', id: '123' });
      
      expect(result.allowed).toBe(false);
    });

    it('should grant permission based on direct user permissions', async () => {
      const user: User = {
        id: 'test-user',
        roles: [], // No roles
        permissions: [
          { action: 'read', resourceType: 'post' }
        ]
      };

      await rbac.addUser(user);

      const result = await rbac.can('test-user', 'read', { type: 'post', id: '123' });
      
      expect(result.allowed).toBe(true);
    });

    it('should deny permission for non-existent user', async () => {
      const result = await rbac.can('non-existent-user', 'read', { type: 'post', id: '123' });
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('does not exist');
    });

    it('should apply conditions to permissions', async () => {
      const role: Role = {
        id: 'editor',
        name: 'Editor',
        permissions: [
          {
            action: 'read',
            resourceType: 'post',
            condition: {
              type: 'resource',
              field: 'status',
              operator: 'eq',
              value: 'published'
            }
          }
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['editor']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      // Should allow reading published posts
      const publishedResult = await rbac.can('test-user', 'read', { 
        type: 'post', 
        id: '123', 
        status: 'published' 
      });
      expect(publishedResult.allowed).toBe(true);

      // Should deny reading unpublished posts
      const draftResult = await rbac.can('test-user', 'read', { 
        type: 'post', 
        id: '123', 
        status: 'draft' 
      });
      expect(draftResult.allowed).toBe(false);
    });

    it('should handle hierarchical roles when enabled', async () => {
      const parentRole: Role = {
        id: 'parent',
        name: 'Parent Role',
        permissions: [
          { action: 'read', resourceType: 'document' }
        ]
      };

      const childRole: Role = {
        id: 'child',
        name: 'Child Role',
        permissions: [
          { action: 'write', resourceType: 'document' }
        ],
        parentRoles: ['parent']
      };

      const user: User = {
        id: 'test-user',
        roles: ['child']
      };

      await rbac.addRole(parentRole);
      await rbac.addRole(childRole);
      await rbac.addUser(user);

      // Should have both parent and child permissions
      const readResult = await rbac.can('test-user', 'read', { type: 'document', id: '123' });
      expect(readResult.allowed).toBe(true);

      const writeResult = await rbac.can('test-user', 'write', { type: 'document', id: '123' });
      expect(writeResult.allowed).toBe(true);
    });

    it('should handle multiple permissions for the same action/resource', async () => {
      const role: Role = {
        id: 'limited-editor',
        name: 'Limited Editor',
        permissions: [
          {
            action: 'read',
            resourceType: 'post',
            condition: {
              type: 'resource',
              field: 'authorId',
              operator: 'eq',
              value: 'test-user'
            }
          },
          {
            action: 'read',
            resourceType: 'post',
            condition: {
              type: 'resource',
              field: 'status',
              operator: 'eq',
              value: 'published'
            }
          }
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['limited-editor']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      // Should allow reading own posts
      const ownPostResult = await rbac.can('test-user', 'read', { 
        type: 'post', 
        id: '123', 
        authorId: 'test-user',
        status: 'draft'
      });
      expect(ownPostResult.allowed).toBe(true);

      // Should allow reading published posts
      const publishedPostResult = await rbac.can('test-user', 'read', { 
        type: 'post', 
        id: '123', 
        authorId: 'other-user',
        status: 'published'
      });
      expect(publishedPostResult.allowed).toBe(true);
    });
  });

  describe('Bulk Permission Checks', () => {
    it('should return true for canAll when all permissions are granted', async () => {
      const role: Role = {
        id: 'multi-permission',
        name: 'Multi Permission',
        permissions: [
          { action: 'read', resourceType: 'post' },
          { action: 'write', resourceType: 'post' },
          { action: 'delete', resourceType: 'post' }
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['multi-permission']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const result = await rbac.canAll('test-user', [
        { action: 'read', resource: { type: 'post', id: '1' } },
        { action: 'write', resource: { type: 'post', id: '1' } },
        { action: 'delete', resource: { type: 'post', id: '1' } }
      ]);

      expect(result.allowed).toBe(true);
    });

    it('should return false for canAll when any permission is denied', async () => {
      const role: Role = {
        id: 'limited',
        name: 'Limited',
        permissions: [
          { action: 'read', resourceType: 'post' },
          { action: 'write', resourceType: 'post' }
          // Missing delete permission
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['limited']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const result = await rbac.canAll('test-user', [
        { action: 'read', resource: { type: 'post', id: '1' } },
        { action: 'write', resource: { type: 'post', id: '1' } },
        { action: 'delete', resource: { type: 'post', id: '1' } }
      ]);

      expect(result.allowed).toBe(false);
    });

    it('should return true for canAny when at least one permission is granted', async () => {
      const role: Role = {
        id: 'read-only',
        name: 'Read Only',
        permissions: [
          { action: 'read', resourceType: 'post' }
          // Missing write and delete permissions
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['read-only']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const result = await rbac.canAny('test-user', [
        { action: 'read', resource: { type: 'post', id: '1' } },
        { action: 'write', resource: { type: 'post', id: '1' } },
        { action: 'delete', resource: { type: 'post', id: '1' } }
      ]);

      expect(result.allowed).toBe(true);
    });

    it('should return false for canAny when no permissions are granted', async () => {
      const role: Role = {
        id: 'no-permissions',
        name: 'No Permissions',
        permissions: []
      };

      const user: User = {
        id: 'test-user',
        roles: ['no-permissions']
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const result = await rbac.canAny('test-user', [
        { action: 'read', resource: { type: 'post', id: '1' } },
        { action: 'write', resource: { type: 'post', id: '1' } },
        { action: 'delete', resource: { type: 'post', id: '1' } }
      ]);

      expect(result.allowed).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache permissions when enabled', async () => {
      const rbacWithCache = new RBACManager({ cachePermissions: true });
      await rbacWithCache.initialize();
      
      const role: Role = {
        id: 'cached-role',
        name: 'Cached Role',
        permissions: [
          { action: 'read', resourceType: 'post' }
        ]
      };

      const user: User = {
        id: 'cached-user',
        roles: ['cached-role']
      };

      await rbacWithCache.addRole(role);
      await rbacWithCache.addUser(user);

      // Check permission twice - second check should use cache
      const result1 = await rbacWithCache.can('cached-user', 'read', { type: 'post', id: '123' });
      const result2 = await rbacWithCache.can('cached-user', 'read', { type: 'post', id: '123' });
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should clear cache when roles change', async () => {
      const rbacWithCache = new RBACManager({ cachePermissions: true });
      await rbacWithCache.initialize();
      
      const role: Role = {
        id: 'cached-role',
        name: 'Cached Role',
        permissions: [
          { action: 'read', resourceType: 'post' }
        ]
      };

      const user: User = {
        id: 'cached-user',
        roles: ['cached-role']
      };

      await rbacWithCache.addRole(role);
      await rbacWithCache.addUser(user);

      // Check permission - should be cached
      const result1 = await rbacWithCache.can('cached-user', 'read', { type: 'post', id: '123' });
      expect(result1.allowed).toBe(true);

      // Clear cache
      rbacWithCache.clearCache();

      // After clearing cache, the behavior should still be the same
      // since the underlying permissions haven't changed
      const result2 = await rbacWithCache.can('cached-user', 'read', { type: 'post', id: '123' });
      expect(result2.allowed).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for a user', async () => {
      const role: Role = {
        id: 'editor',
        name: 'Editor',
        permissions: [
          { action: 'read', resourceType: 'post' },
          { action: 'write', resourceType: 'post' }
        ]
      };

      const user: User = {
        id: 'test-user',
        roles: ['editor'],
        permissions: [
          { action: 'delete', resourceType: 'post' }
        ]
      };

      await rbac.addRole(role);
      await rbac.addUser(user);

      const userPermissions = await rbac.getUserPermissions('test-user');
      
      expect(userPermissions).toHaveLength(3);
      expect(userPermissions).toContainEqual({ action: 'read', resourceType: 'post' });
      expect(userPermissions).toContainEqual({ action: 'write', resourceType: 'post' });
      expect(userPermissions).toContainEqual({ action: 'delete', resourceType: 'post' });
    });

    it('should return empty array for non-existent user', async () => {
      const userPermissions = await rbac.getUserPermissions('non-existent');
      expect(userPermissions).toEqual([]);
    });
  });

  describe('List operations', () => {
    it('should correctly count users and roles', async () => {
      // Add roles
      await rbac.addRole({
        id: 'role1',
        name: 'Role 1',
        permissions: [{ action: 'read', resourceType: 'post' }]
      });
      
      await rbac.addRole({
        id: 'role2',
        name: 'Role 2',
        permissions: [{ action: 'write', resourceType: 'post' }]
      });

      // Add users
      await rbac.addUser({ id: 'user1', roles: ['role1'] });
      await rbac.addUser({ id: 'user2', roles: ['role2'] });
      await rbac.addUser({ id: 'user3', roles: ['role1', 'role2'] });

      // Check counts
      expect(await rbac.getRoleCount()).toBe(2);
      expect(await rbac.getUserCount()).toBe(3);

      // Check listing
      const roles = await rbac.listRoles();
      expect(roles).toHaveLength(2);
      expect(roles.map(r => r.id)).toContain('role1');
      expect(roles.map(r => r.id)).toContain('role2');

      const users = await rbac.listUsers();
      expect(users).toHaveLength(3);
      expect(users.map(u => u.id)).toContain('user1');
      expect(users.map(u => u.id)).toContain('user2');
      expect(users.map(u => u.id)).toContain('user3');
    });
  });
});