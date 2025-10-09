import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Deployment = sequelize.define('Deployment', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  repositoryUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  branch: {
    type: DataTypes.STRING,
    defaultValue: 'main',
  },
  status: {
    type: DataTypes.ENUM('pending', 'building', 'deploying', 'deployed', 'failed', 'stopped'),
    defaultValue: 'pending',
  },
  appUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dokkuAppName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  envVars: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  lastDeployedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  allocatedRAM: {
    type: DataTypes.INTEGER,
    defaultValue: 512, // Default 512MB
    comment: 'Allocated RAM in MB',
  },
  allocatedCPU: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // Default 1 vCPU
    comment: 'Allocated vCPU count',
  },
  allocatedStorage: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // Default 1GB
    comment: 'Allocated storage in GB',
  },
}, {
  timestamps: true,
  paranoid: true, // Enable soft deletion - adds deletedAt field and filters out soft-deleted records
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
  ],
});

export default Deployment;
