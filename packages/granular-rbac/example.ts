import { RBACManager, Role, User } from './src';

async function example() {
  // Initialize the RBAC manager
  const rbac = new RBACManager();

  // Initialize the RBAC manager (required for async storage)
  await rbac.initialize();

  console.log('Setting up roles and permissions...\n');

  // Define roles
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
    description: 'Can read and write posts',
    permissions: [
      { action: 'read', resourceType: 'post' },
      { action: 'write', resourceType: 'post' }
    ]
  };

  // Add roles to the RBAC system (async)
  await rbac.addRole(adminRole);
  await rbac.addRole(editorRole);

  // Define users
  const adminUser: User = {
    id: 'admin1',
    roles: ['admin'],
    name: 'Admin User'
  };

  const editorUser: User = {
    id: 'editor1',
    roles: ['editor'],
    name: 'Editor User'
  };

  // Add users to the RBAC system (async)
  await rbac.addUser(adminUser);
  await rbac.addUser(editorUser);

  console.log('Created roles and users\n');

  // Check permissions
  console.log('Checking permissions...\n');

  // Admin should be able to delete users
  const deleteResult = await rbac.can('admin1', 'delete', { type: 'user', id: 'some-user' });
  console.log(`Admin can delete user: ${deleteResult.allowed}`); // true

  // Editor should NOT be able to delete posts
  const editorDeleteResult = await rbac.can('editor1', 'delete', { type: 'post', id: 'some-post' });
  console.log(`Editor can delete post: ${editorDeleteResult.allowed}`); // false

  // Editor should be able to read posts
  const readResult = await rbac.can('editor1', 'read', { type: 'post', id: 'some-post' });
  console.log(`Editor can read post: ${readResult.allowed}`); // true

  // Add a user with direct permissions
  await rbac.addUser({
    id: 'special1',
    roles: ['editor'],
    name: 'Special Editor',
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
  });

  // Special editor should be able to delete draft posts
  const specialDeleteDraft = await rbac.can('special1', 'delete', { 
    type: 'post', 
    id: 'draft-post', 
    status: 'draft' 
  });
  console.log(`Special editor can delete draft post: ${specialDeleteDraft.allowed}`); // true

  // Special editor should NOT be able to delete published posts
  const specialDeletePublished = await rbac.can('special1', 'delete', { 
    type: 'post', 
    id: 'published-post', 
    status: 'published' 
  });
  console.log(`Special editor can delete published post: ${specialDeletePublished.allowed}`); // false

  // Bulk permission check - all permissions
  const allPermissionsResult = await rbac.canAll('admin1', [
    { action: 'read', resource: { type: 'post', id: '1' } },
    { action: 'write', resource: { type: 'post', id: '1' } },
    { action: 'delete', resource: { type: 'post', id: '1' } }
  ]);
  console.log(`Admin has all post permissions: ${allPermissionsResult.allowed}`); // true

  // Bulk permission check - any permissions
  const anyPermissionsResult = await rbac.canAny('editor1', [
    { action: 'read', resource: { type: 'post', id: '1' } },
    { action: 'delete', resource: { type: 'post', id: '1' } }
  ]);
  console.log(`Editor has any of the permissions: ${anyPermissionsResult.allowed}`); // true

  console.log('\nRBAC system example completed successfully!');
  
  // Close the storage connection
  await rbac.close();
}

// Run the example
example().catch(console.error);