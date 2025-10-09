import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * UserPermission model - Direct permissions granted to specific users
 */
const UserPermission = sequelize.define('UserPermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
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
  grantedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  grantedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['permissionId'] },
    { fields: ['userId', 'permissionId'] }, // Unique constraint
  ],
});

export default UserPermission;