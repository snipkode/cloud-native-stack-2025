import { Permission, Role, RolePermission, User } from '../../models/index.js';
import RBACService from '../../services/RBACService.js';

/**
 * Seed the RBAC system with default roles and permissions
 */
export const seedRBAC = async () => {
  try {
    console.log('Seeding RBAC system...');
    
    // Create system permissions
    const permissions = [
      // Deployment permissions
      { name: 'deployment:create', description: 'Can create new deployments', resourceType: 'deployment', action: 'create' },
      { name: 'deployment:read', description: 'Can read deployment information', resourceType: 'deployment', action: 'read' },
      { name: 'deployment:update', description: 'Can update deployments', resourceType: 'deployment', action: 'update' },
      { name: 'deployment:delete', description: 'Can delete deployments', resourceType: 'deployment', action: 'delete' },
      
      // Test Deployment permissions
      { name: 'test-deployment:create', description: 'Can create new test deployments', resourceType: 'test-deployment', action: 'create' },
      { name: 'test-deployment:read', description: 'Can read test deployment information', resourceType: 'test-deployment', action: 'read' },
      { name: 'test-deployment:update', description: 'Can update test deployments', resourceType: 'test-deployment', action: 'update' },
      { name: 'test-deployment:delete', description: 'Can delete test deployments', resourceType: 'test-deployment', action: 'delete' },
      
      // User permissions
      { name: 'user:read', description: 'Can read user information', resourceType: 'user', action: 'read' },
      { name: 'user:update', description: 'Can update user information', resourceType: 'user', action: 'update' },
      { name: 'user:delete', description: 'Can delete users', resourceType: 'user', action: 'delete' },
      
      // Billing permissions
      { name: 'billing:read', description: 'Can read billing information', resourceType: 'billing', action: 'read' },
      { name: 'billing:update', description: 'Can update billing information', resourceType: 'billing', action: 'update' },
      
      // RBAC management permissions
      { name: 'permission:create', description: 'Can create permissions', resourceType: 'permission', action: 'create' },
      { name: 'permission:read', description: 'Can read permissions', resourceType: 'permission', action: 'read' },
      { name: 'permission:update', description: 'Can update permissions', resourceType: 'permission', action: 'update' },
      { name: 'permission:delete', description: 'Can delete permissions', resourceType: 'permission', action: 'delete' },
      { name: 'permission:grant', description: 'Can grant permissions to users', resourceType: 'permission', action: 'grant' },
      { name: 'permission:revoke', description: 'Can revoke permissions from users', resourceType: 'permission', action: 'revoke' },
      { name: 'role:create', description: 'Can create roles', resourceType: 'role', action: 'create' },
      { name: 'role:read', description: 'Can read roles', resourceType: 'role', action: 'read' },
      { name: 'role:update', description: 'Can update roles', resourceType: 'role', action: 'update' },
      { name: 'role:delete', description: 'Can delete roles', resourceType: 'role', action: 'delete' },
      { name: 'role:assign', description: 'Can assign roles to users', resourceType: 'role', action: 'assign' },
      { name: 'role:remove', description: 'Can remove roles from users', resourceType: 'role', action: 'remove' },
      { name: 'role_permission:assign', description: 'Can assign permissions to roles', resourceType: 'role_permission', action: 'assign' },
      { name: 'role_permission:remove', description: 'Can remove permissions from roles', resourceType: 'role_permission', action: 'remove' },
    ];

    for (const permData of permissions) {
      await RBACService.createPermission(
        permData.name, 
        permData.description, 
        permData.resourceType, 
        permData.action, 
        true // systemDefined
      );
      console.log(`Created permission: ${permData.name}`);
    }

    // Create default roles
    const adminRole = await RBACService.createRole('admin', 'System administrator with all permissions', true);
    const userRole = await RBACService.createRole('user', 'Regular user with basic permissions', true);
    const deploymentManagerRole = await RBACService.createRole('deployment-manager', 'User who can manage deployments', true);

    console.log(`Created roles: admin, user, deployment-manager`);

    // Assign permissions to roles
    // Admin gets all permissions
    for (const permData of permissions) {
      const permission = await Permission.findOne({ where: { name: permData.name } });
      if (permission) {
        await RBACService.assignPermissionToRole(permission.id, adminRole.role.id);
      }
    }

    // Regular user can read and create their own deployments, read own user info, and work with test deployments
    const userPerms = [
      'deployment:read', 'deployment:create', 
      'test-deployment:read', 'test-deployment:create', 
      'user:read' // only for own user
    ];

    for (const permName of userPerms) {
      const permission = await Permission.findOne({ where: { name: permName } });
      if (permission) {
        await RBACService.assignPermissionToRole(permission.id, userRole.role.id);
      }
    }

    // Deployment manager can manage deployments
    const deploymentManagerPerms = [
      'deployment:read', 'deployment:create', 'deployment:update', 'deployment:delete'
    ]; 

    for (const permName of deploymentManagerPerms) {
      const permission = await Permission.findOne({ where: { name: permName } });
      if (permission) {
        await RBACService.assignPermissionToRole(permission.id, deploymentManagerRole.role.id);
      }
    }

    console.log('Assigned permissions to roles');

    // Find all existing admin users and assign the admin role
    const adminUsers = await User.findAll({ where: { role: 'admin' } });
    for (const adminUser of adminUsers) {
      await RBACService.assignRoleToUser(adminUser.id, adminRole.role.id);
    }

    // Find all existing regular users and assign the user role
    const regularUsers = await User.findAll({ where: { role: 'user' } });
    for (const regularUser of regularUsers) {
      await RBACService.assignRoleToUser(regularUser.id, userRole.role.id);
    }

    console.log('Assigned admin role to existing admin users');
    console.log('Assigned user role to existing regular users');
    console.log('RBAC seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding RBAC system:', error);
    throw error;
  }
};

// Run the seeding function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import('../../config/database.js').then(async ({ default: sequelize }) => {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully');
      
      await seedRBAC();
      
      console.log('Seeding completed. Exiting...');
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    }
  });
}