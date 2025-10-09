import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DeploymentLog = sequelize.define('DeploymentLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  deploymentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Deployments',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'success', 'build', 'deploy'),
    defaultValue: 'info',
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['deploymentId'] },
    { fields: ['timestamp'] },
  ],
});

export default DeploymentLog;
