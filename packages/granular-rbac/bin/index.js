#!/usr/bin/env node

const { RBACManager } = require('./dist');

// Example usage
async function main() {
  console.log('Granular RBAC - Example');
  
  try {
    // Initialize the RBAC manager
    const rbac = new RBACManager();
    
    console.log('RBACManager instance created successfully!');
    console.log('You can now use methods like:');
    console.log('- rbac.addRole(role)');
    console.log('- rbac.addUser(user)');
    console.log('- rbac.can(userId, action, resource)');
    console.log('- rbac.canAll(userId, permissions)');
    console.log('- rbac.canAny(userId, permissions)');
    console.log('And many more...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();