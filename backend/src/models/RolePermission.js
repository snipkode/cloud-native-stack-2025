import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * RolePermission model - Junction table between roles and permissions
 */
const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Roles',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  permissionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Permissions',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['roleId'] },
    { fields: ['permissionId'] },
    { fields: ['roleId', 'permissionId'] }, // Unique constraint
  ],
});

export default RolePermission;