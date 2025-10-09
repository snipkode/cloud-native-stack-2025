import { jest } from '@jest/globals';
import axios from 'axios';
import { Transaction, User } from '../models/index.js';
import midtransService from '../services/midtransService.js';
import paymentService from '../services/paymentService.js';

// Mock the midtrans client
jest.mock('midtrans-client', () => {
  return jest.fn().mockImplementation(() => {
    return {
      transaction: {
        charge: jest.fn().mockResolvedValue({
          transaction_id: '54321',
          order_id: 'TOPUP-test-transaction',
          redirect_url: 'https://midtrans.example.com/pay',
          token: 'sample-token',
          transaction_status: 'pending',
          gross_amount: '100000',
          currency: 'IDR'
        }),
        status: jest.fn().mockResolvedValue({
          transaction_id: '54321',
          order_id: 'TOPUP-test-transaction',
          transaction_status: 'settlement',
          fraud_status: 'accept',
          payment_type: 'bank_transfer',
          status_code: '200',
          gross_amount: '100000'
        })
      }
    };
  });
});

// Mock the database
jest.mock('../models/index.js', () => {
  return {
    Transaction: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
    User: {
      findByPk: jest.fn(),
    }
  };
});

// Mock the database transaction
jest.mock('../config/database.js', () => {
  return {
    __esModule: true,
    default: {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
        LOCK: { UPDATE: 'UPDATE' }
      })
    }
  };
});

describe('Midtrans Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Service', () => {
    test('should process topup successfully', async () => {
      // Mock user data
      const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      
      // Mock transaction creation
      const mockTransaction = {
        id: 'transaction-123',
        userId: 'user-123',
        type: 'topup',
        amount: 50,
        status: 'pending',
        paymentMethod: 'midtrans',
        paymentGatewayId: 'INV-12345-abcde',
        description: 'Top-up of 50 credits',
        update: jest.fn().mockResolvedValue({
          id: 'transaction-123',
          userId: 'user-123',
          type: 'topup',
          amount: 50,
          status: 'pending',
          paymentMethod: 'midtrans',
          paymentGatewayId: '54321',
          midtransTransactionId: '54321',
          midtransOrderId: 'TOPUP-test-transaction',
          description: 'Top-up of 50 credits',
        }),
      };

      Transaction.create.mockResolvedValue(mockTransaction);
      User.findByPk.mockResolvedValue({
        id: 'user-123',
        credits: 100,
        update: jest.fn(),
      });

      const result = await paymentService.processTopup({
        userId: 'user-123',
        amount: 50,
        email: 'test@example.com',
        firstName: 'Test'
      });

      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          type: 'topup',
          amount: 50,
          status: 'pending',
          paymentMethod: 'midtrans',
          description: 'Top-up of 50 credits',
        }),
        expect.anything()
      );

      expect(result).toEqual(
        expect.objectContaining({
          paymentUrl: 'https://midtrans.example.com/pay',
          token: 'sample-token',
        })
      );
    });

    test('should process Midtrans webhook for successful payment', async () => {
      const webhookPayload = {
        transaction_id: '54321',
        order_id: 'TOPUP-test-transaction',
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'bank_transfer',
        status_code: '200',
        gross_amount: '50000',
      };

      const mockTransaction = {
        id: 'transaction-123',
        userId: 'user-123',
        amount: 50,
        status: 'pending',
        update: jest.fn(),
      };

      Transaction.findOne.mockResolvedValue(mockTransaction);
      User.findByPk.mockResolvedValue({
        id: 'user-123',
        credits: 100,
        update: jest.fn(),
      });

      const result = await paymentService.processWebhook(webhookPayload);

      expect(result).toEqual(
        expect.objectContaining({
          status: 'completed',
        })
      );

      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          paymentType: 'bank_transfer',
          fraudStatus: 'accept',
        }),
        expect.anything()
      );
    });

    test('should handle Midtrans webhook for failed payment', async () => {
      const webhookPayload = {
        transaction_id: '54321',
        order_id: 'TOPUP-test-transaction',
        transaction_status: 'cancel',
        fraud_status: 'accept',
        payment_type: 'bank_transfer',
        status_code: '200',
        gross_amount: '50000',
      };

      const mockTransaction = {
        id: 'transaction-123',
        userId: 'user-123',
        amount: 50,
        status: 'pending',
        update: jest.fn(),
      };

      Transaction.findOne.mockResolvedValue(mockTransaction);

      const result = await paymentService.processWebhook(webhookPayload);

      expect(result).toEqual(
        expect.objectContaining({
          status: 'failed',
        })
      );
    });

    test('should sync transaction status with Midtrans', async () => {
      const mockTransaction = {
        id: 'transaction-123',
        paymentGatewayId: '54321',
        userId: 'user-123',
        amount: 50,
        status: 'pending',
        update: jest.fn(),
      };

      Transaction.findOne.mockResolvedValue(mockTransaction);

      const result = await paymentService.syncTransactionStatus('transaction-123');

      expect(result).toEqual(
        expect.objectContaining({
          internalStatus: 'completed', // Based on settlement status
        })
      );
    });
  });

  describe('Midtrans Service', () => {
    test('should create payment successfully', async () => {
      const result = await midtransService.createPayment({
        userId: 'user-123',
        amount: 50,
        email: 'test@example.com',
        firstName: 'Test',
        transactionId: 'transaction-123'
      });

      expect(result).toEqual(
        expect.objectContaining({
          transactionId: '54321',
          paymentUrl: 'https://midtrans.example.com/pay',
          token: 'sample-token',
          status: 'pending',
          amount: '50',
        })
      );
    });

    test('should get transaction status', async () => {
      const result = await midtransService.getTransactionStatus('54321');

      expect(result).toEqual(
        expect.objectContaining({
          transaction_id: '54321',
          transaction_status: 'settlement',
        })
      );
    });

    test('should process webhook notification correctly', async () => {
      const notification = {
        transaction_id: '54321',
        order_id: 'TOPUP-test-transaction',
        transaction_status: 'capture',
        fraud_status: 'accept',
        payment_type: 'credit_card',
        status_code: '200',
        gross_amount: '50000',
      };

      const result = await midtransService.processWebhook(notification);

      expect(result).toEqual(
        expect.objectContaining({
          paymentGatewayId: '54321',
          status: 'completed', // Should be completed based on capture + accept
          paymentType: 'credit_card',
          amount: 50000,
        })
      );
    });
  });
});