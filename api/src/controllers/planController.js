import { Plan } from '../models/index.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Get all available plans
 */
export const getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.findAll({
      where: { isActive: true },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    res.json({
      plans
    });
  } catch (error) {
    logger.error('Error getting plans:', error.message);
    next(error);
  }
};

/**
 * Get plan by ID
 */
export const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const plan = await Plan.findByPk(id, {
      where: { isActive: true },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    res.json({
      plan
    });
  } catch (error) {
    logger.error('Error getting plan by ID:', error.message);
    next(error);
  }
};

/**
 * Subscribe user to a plan
 */
export const subscribeToPlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id; // Assuming user is authenticated and user info is available in req.user
    
    // Validate plan exists and is active
    const plan = await Plan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or not available' });
    }
    
    // Update user's plan
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // In a real implementation, you would charge the user here before updating the plan
    // For now, we'll just update the plan directly
    
    await user.update({ planId });
    
    res.json({
      message: 'Successfully subscribed to plan',
      plan
    });
  } catch (error) {
    logger.error('Error subscribing to plan:', error.message);
    next(error);
  }
};

/**
 * Get user's current plan
 */
export const getCurrentPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      include: [{
        model: Plan,
        as: 'plan',
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If user doesn't have a plan, assign the default 'Starter' plan
    if (!user.plan) {
      const defaultPlan = await Plan.findOne({ where: { name: 'Starter' } });
      if (defaultPlan) {
        await user.update({ planId: defaultPlan.id });
        user.plan = defaultPlan; // Add the default plan to the user object
      } else {
        return res.status(404).json({ error: 'No default plan available' });
      }
    }
    
    res.json({
      plan: user.plan
    });
  } catch (error) {
    logger.error('Error getting current plan:', error.message);
    next(error);
  }
};