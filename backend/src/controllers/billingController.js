import { Transaction, User, Plan } from '../models/index.js';
import paymentService from '../services/paymentService.js';

export const createTopup = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const { id: userId, email, name } = req.user;

    // Validate that amount is a positive number
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Process top-up with Midtrans
    const result = await paymentService.processTopup({
      userId,
      amount,
      email,
      firstName: name || email.split('@')[0], // Use name or part of email as first name
    });

    res.status(201).json({
      message: 'Topup transaction created successfully',
      transaction: result.transaction,
      paymentUrl: result.paymentUrl,
      token: result.token, // Include token for frontend integration if needed
    });
  } catch (error) {
    // Handle specific validation errors
    if (error.message.includes('Minimum topup amount')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOne({
      where: { id, userId: req.user.id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    // Process the webhook notification
    const result = await paymentService.processWebhook(req.body);

    res.status(200).json(result);
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Return 200 to acknowledge receipt (Midtrans will retry on non-200)
    res.status(200).json({ 
      message: 'Webhook received but processing failed',
      error: error.message 
    });
  }
};

// Additional endpoint to manually sync transaction status
export const syncTransactionStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    
    const result = await paymentService.syncTransactionStatus(transactionId);
    
    res.json(result);
  } catch (error) {
    console.error('Transaction sync error:', error);
    next(error);
  }
};

// Function to update user's plan and all associated deployments after successful payment
export const updateUserPlan = async (userId, newPlanId) => {
  try {
    const { User, Plan, Deployment } = await import('../models/index.js');
    const { default: getPlatformService } = await import('../services/platformService.js');
    
    // Get the new plan information
    const newPlan = await Plan.findByPk(newPlanId);
    if (!newPlan) {
      throw new Error('Plan not found');
    }
    
    // Get the user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update user's plan
    await user.update({ planId: newPlanId });
    
    // Get all deployments for this user
    const deployments = await Deployment.findAll({
      where: { userId: userId }
    });
    
    // Update resource allocation for all deployments based on the new plan
    const platformService = getPlatformService();
    
    for (const deployment of deployments) {
      // Calculate new resource allocation based on plan
      // For now, allocate half of plan's max resources per app (as we did in createDeployment)
      const newRAM = Math.round(newPlan.maxRAM / 2);
      const newCPU = Math.max(1, Math.round(newPlan.maxCPU / 2));
      const newStorage = Math.max(1, Math.round(newPlan.maxStorage / 5));
      
      // Update deployment resource allocation
      await deployment.update({
        allocatedRAM: newRAM,
        allocatedCPU: newCPU,
        allocatedStorage: newStorage
      });
      
      // Update container resources if deployment is active
      if (deployment.status === 'deployed' || deployment.status === 'deploying' || deployment.status === 'building') {
        await platformService.updateContainerResources(deployment.name, {
          ram: newRAM,
          cpu: newCPU,
          storage: newStorage
        });
      }
    }
    
    return { user, newPlan, updatedDeploymentsCount: deployments.length };
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
};

export const createPlanSubscription = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const { id: userId, email, name } = req.user;

    // Get the plan details
    const { Plan } = await import('../models/index.js');
    const plan = await Plan.findByPk(planId);
    
    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: 'Plan not found or not available' });
    }

    // Process plan subscription payment with Midtrans
    const result = await paymentService.processTopup({
      userId,
      amount: plan.price,
      email,
      firstName: name || email.split('@')[0],
      description: `Plan subscription: ${plan.name}`,
    });

    // Store the pending subscription in a temporary record
    // The actual plan change will happen after payment confirmation via webhook
    await User.update(
      { pendingPlanId: planId }, // Assuming we add a pendingPlanId field to User model
      { where: { id: userId } }
    );

    res.status(201).json({
      message: 'Plan subscription created successfully',
      plan,
      transaction: result.transaction,
      paymentUrl: result.paymentUrl,
      token: result.token,
    });
  } catch (error) {
    // Handle specific validation errors
    if (error.message.includes('Minimum topup amount')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
