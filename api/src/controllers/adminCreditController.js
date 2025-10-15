import { User, Transaction } from '../models/index.js';
import { authenticateAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { body, param, validationResult } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';

/**
 * Admin Credit Manipulation Controller
 * Provides endpoints for admin to manually manipulate user credits
 */

export const updateCredit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { amount, type, description } = req.body;

    // Validate input
    if (!['add', 'subtract', 'set'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be add, subtract, or set' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current credits and parse to float
    const currentCredits = parseFloat(user.credits || 0);
    let newCredits = currentCredits;

    // Perform credit manipulation based on type
    switch (type) {
      case 'add':
        newCredits = currentCredits + amount;
        break;
      case 'subtract':
        newCredits = Math.max(0, currentCredits - amount); // Prevent negative credits
        break;
      case 'set':
        newCredits = amount;
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation type' });
    }

    // Update user credits
    await user.update({ credits: newCredits });

    // Create a transaction record for audit trail
    await Transaction.create({
      userId: user.id,
      type: 'admin_adjustment', // Special type for admin adjustments
      amount: amount,
      status: 'completed',
      paymentMethod: 'admin_manual',
      description: description || `Admin ${type} credit: ${amount}`,
      metadata: {
        adminId: req.user.id,
        adminName: req.user.name,
        originalCredits: currentCredits,
        newCredits: newCredits,
        operationType: type
      }
    });

    logger.info(`Admin ${req.user.email} ${type} ${amount} credits for user ${user.email}. Previous: ${currentCredits}, New: ${newCredits}`);

    res.json({
      message: `Credit successfully ${type === 'add' ? 'added' : type === 'subtract' ? 'subtracted' : 'set'}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: newCredits
      },
      operation: {
        type,
        amount,
        previousCredits: currentCredits,
        newCredits,
        description
      }
    });
  } catch (error) {
    logger.error(`Error updating credit for user ${req.params.userId}:`, error.message);
    next(error);
  }
};

export const getCreditHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transaction history for this user
    const transactions = await Transaction.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit to recent transactions
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        paymentMethod: t.paymentMethod,
        createdAt: t.createdAt,
        metadata: t.metadata
      }))
    });
  } catch (error) {
    logger.error(`Error getting credit history for user ${req.params.userId}:`, error.message);
    next(error);
  }
};

export const resetUserCredits = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newCreditAmount, reason } = req.body;

    // Validate input
    if (typeof newCreditAmount !== 'number' || newCreditAmount < 0) {
      return res.status(400).json({ error: 'New credit amount must be a non-negative number' });
    }

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousCredits = parseFloat(user.credits || 0);

    // Update user credits
    await user.update({ credits: newCreditAmount });

    // Create a transaction record for audit trail
    await Transaction.create({
      userId: user.id,
      type: 'admin_adjustment',
      amount: newCreditAmount,
      status: 'completed',
      paymentMethod: 'admin_reset',
      description: reason || `Admin reset to: ${newCreditAmount}`,
      metadata: {
        adminId: req.user.id,
        adminName: req.user.name,
        previousCredits: previousCredits,
        resetTo: newCreditAmount,
        operationType: 'reset'
      }
    });

    logger.info(`Admin ${req.user.email} reset credits for user ${user.email}. From: ${previousCredits}, To: ${newCreditAmount}`);

    res.json({
      message: 'User credits successfully reset',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: newCreditAmount
      },
      operation: {
        type: 'reset',
        previousCredits,
        newCredits: newCreditAmount,
        reason
      }
    });
  } catch (error) {
    logger.error(`Error resetting credits for user ${req.params.userId}:`, error.message);
    next(error);
  }
};