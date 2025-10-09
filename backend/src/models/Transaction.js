import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Transaction = sequelize.define('Transaction', {
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
  type: {
    type: DataTypes.ENUM('topup', 'deduction'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentGatewayId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  midtransTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Midtrans transaction ID for reference'
  },
  midtransOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Midtrans order ID'
  },
  paymentType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment method used (credit_card, bank_transfer, etc.)'
  },
  fraudStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Fraud status from Midtrans (accept, deny, challenge)'
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['paymentGatewayId'] },
  ],
});

export default Transaction;
