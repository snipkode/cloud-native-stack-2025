import sequelize from '../config/database.js';
import User from './User.js';
import Deployment from './Deployment.js';
import Transaction from './Transaction.js';
import DeploymentLog from './DeploymentLog.js';
import AccessGrant from './AccessGrant.js';
import Permission from './Permission.js';
import Role from './Role.js';
import RolePermission from './RolePermission.js';
import UserPermission from './UserPermission.js';
import UserRole from './UserRole.js';
import { PlanModel } from './Plan.js';

// Define Plan first
const Plan = PlanModel(sequelize);

// Define all relationships
User.hasMany(Deployment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Deployment.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Deployment.hasMany(DeploymentLog, { foreignKey: 'deploymentId', onDelete: 'CASCADE' });
DeploymentLog.belongsTo(Deployment, { foreignKey: 'deploymentId' });

User.hasMany(AccessGrant, { foreignKey: 'userId', onDelete: 'CASCADE' });
AccessGrant.belongsTo(User, { foreignKey: 'userId' });

// User-Plan relationship
User.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Plan.hasMany(User, { foreignKey: 'planId', as: 'users' });

// User-Roles relationship
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId', as: 'users' });

// Role-Permissions relationship  
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles' });

// User-Permissions relationship (direct permissions)
User.belongsToMany(Permission, { through: UserPermission, foreignKey: 'userId', otherKey: 'permissionId', as: 'directPermissions' });

const models = {
  User,
  Deployment,
  Transaction,
  DeploymentLog,
  AccessGrant,
  Permission,
  Role,
  RolePermission,
  UserPermission,
  UserRole,
  Plan,
};

export {
  User,
  Deployment,
  Transaction,
  DeploymentLog,
  AccessGrant,
  Permission,
  Role,
  RolePermission,
  UserPermission,
  UserRole,
  Plan,
};

// Also export as default for compatibility
export default models;
