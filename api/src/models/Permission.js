import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Permission model - Defines available permissions in the system
 */
const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      // Validate format like: resource:action (e.g., deployment:create) or resource_action:action (e.g., role_permission:assign)
      is: /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  systemDefined: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['resourceType'] },
    { fields: ['name'] },
  ],
});

export default Permission;