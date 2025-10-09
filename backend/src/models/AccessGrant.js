import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AccessGrant = sequelize.define('AccessGrant', {
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
  },
  resourceType: {
    type: DataTypes.ENUM('deployment', 'billing', 'user', 'system'),
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  grantedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['resourceType', 'resourceId'] },
  ],
});

export default AccessGrant;
