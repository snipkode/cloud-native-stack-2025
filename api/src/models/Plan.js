import { DataTypes } from 'sequelize';

export const PlanModel = (sequelize) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    maxApps: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Maximum number of applications allowed'
    },
    maxRAM: {
      type: DataTypes.INTEGER,
      defaultValue: 512, // in MB
      comment: 'Maximum RAM allocation in MB'
    },
    maxCPU: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // number of vCPUs
      comment: 'Maximum vCPU allocation'
    },
    maxStorage: {
      type: DataTypes.INTEGER,
      defaultValue: 10, // in GB
      comment: 'Maximum storage in GB'
    },
    maxTeamMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Maximum number of team members'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'List of features included in the plan'
    }
  }, {
    tableName: 'plans',
    timestamps: true,
  });

  return Plan;
};