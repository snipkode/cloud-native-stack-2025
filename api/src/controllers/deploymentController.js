import { Deployment, DeploymentLog, User, Permission, Plan } from '../models/index.js';
import { simulateDeployment } from '../services/deploymentService.js';
import sequelize from '../config/database.js';
import RBACService from '../services/RBACService.js';
import getPlatformService from '../services/platformService.js';
import { getIO } from '../config/socket.js';
import { validateCommand, sanitizeCommand, isAllowedCommand } from '../utils/commandValidator.js';
import { validateDomain, sanitizeDomain } from '../utils/domainValidator.js';
import { validatePortMapping, sanitizePortMapping } from '../utils/portValidator.js';
import { validateEnvVars, validateEnvVarName, validateEnvVarValue } from '../utils/envVarValidator.js';
import { encryptValue, decryptValue, isEncryptionEnabled, isSensitiveEnvVar, processEnvVarsForStorage as encryptEnvVars, processEnvVarsForRetrieval as decryptEnvVars } from '../utils/envVarEncryption.js';

export const createDeployment = async (req, res, next) => {
  try {
    const { name, repositoryUrl, branch = 'main', envVars = {} } = req.body;
    const cost = 10;

    // Validate environment variables
    if (envVars && typeof envVars === 'object') {
      const envValidation = validateEnvVars(envVars);
      if (!envValidation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid environment variables', 
          details: envValidation.reasons 
        });
      }
      
      // Use only validated environment variables
      req.body.envVars = envValidation.validEnvVars;
    }

    // Use a database transaction to prevent race conditions
    const transaction = await sequelize.transaction();

    // Lock the user record to prevent concurrent modifications
    const user = await User.findByPk(req.user.id, { 
      lock: transaction.LOCK.UPDATE,
      include: [{
        model: Plan,
        as: 'plan',
        attributes: ['id', 'name', 'maxApps', 'maxRAM', 'maxCPU', 'maxStorage']
      }],
      transaction 
    });

    if (user.credits < cost) {
      await transaction.rollback();
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Validate user's plan limits
    if (user.plan) {
      // Check if user has reached maximum number of apps
      if (user.plan.maxApps > 0) { // If maxApps is -1, it means unlimited
        const userDeploymentsCount = await Deployment.count({
          where: { userId: user.id }
        });
        
        if (userDeploymentsCount >= user.plan.maxApps) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: 'Maximum number of applications reached for your plan', 
            details: `Your plan allows maximum ${user.plan.maxApps} applications` 
          });
        }
      }
    } else {
      // If user doesn't have a plan, assign the default 'Starter' plan
      const defaultPlan = await Plan.findOne({ where: { name: 'Starter' } });
      if (defaultPlan) {
        await user.update({ planId: defaultPlan.id }, { transaction });
        user.plan = defaultPlan; // Add the default plan to the user object
        
        // Check if user has reached maximum number of apps for the default plan
        const userDeploymentsCount = await Deployment.count({
          where: { userId: user.id }
        });
        
        if (userDeploymentsCount >= defaultPlan.maxApps) {
          await transaction.rollback();
          return res.status(400).json({ 
            error: 'Maximum number of applications reached for your plan', 
            details: `Your plan allows maximum ${defaultPlan.maxApps} applications` 
          });
        }
      }
    }

    // Process environment variables for storage (encrypt sensitive ones)
    const processedEnvVars = encryptEnvVars(req.body.envVars || {});

    // Create deployment with default resource allocation based on user's plan
    const defaultRAM = user.plan ? user.plan.maxRAM / 2 : 512; // Default to half of plan's max RAM
    const defaultCPU = user.plan ? Math.max(1, user.plan.maxCPU / 2) : 1; // Default to half of plan's max CPU
    const defaultStorage = user.plan ? Math.max(1, user.plan.maxStorage / 5) : 1; // Default to 1/5 of plan's max storage
    
    const deployment = await Deployment.create({
      userId: user.id,
      name,
      repositoryUrl,
      branch,
      envVars: processedEnvVars,
      cost,
      status: 'pending',
      allocatedRAM: defaultRAM,
      allocatedCPU: defaultCPU,
      allocatedStorage: defaultStorage,
    }, { transaction });

    await user.update({ 
      credits: parseFloat(user.credits) - cost 
    }, { transaction });

    await transaction.commit();

    // Grant specific permissions to the user for their own deployment
    try {
      // Get or create the necessary permissions
      const readPerm = await Permission.findOne({ where: { name: 'deployment:read' } });
      const updatePerm = await Permission.findOne({ where: { name: 'deployment:update' } });
      const deletePerm = await Permission.findOne({ where: { name: 'deployment:delete' } });

      // Grant read, update, and delete permissions for this specific deployment
      if (readPerm) {
        await RBACService.grantPermissionToUser(req.user.id, readPerm.id, null, null, `Owner access to deployment ${deployment.id}`);
      }
      if (updatePerm) {
        await RBACService.grantPermissionToUser(req.user.id, updatePerm.id, null, null, `Owner access to deployment ${deployment.id}`);
      }
      if (deletePerm) {
        await RBACService.grantPermissionToUser(req.user.id, deletePerm.id, null, null, `Owner access to deployment ${deployment.id}`);
      }
    } catch (permError) {
      // If permission granting fails, log the error but don't block the deployment creation
      console.error('Error granting specific deployment permissions to owner:', permError);
    }

    // Add deployment to job queue for processing
    const deploymentJobService = await import('../services/deploymentJobService.js');
    await deploymentJobService.default.addDeploymentJob(deployment.id, 'create');

    res.status(201).json({
      message: 'Deployment created successfully',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeployments = async (req, res, next) => {
  try {
    const deployments = await Deployment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    // Filter out soft-deleted deployments (sequelize does this automatically with paranoid: true)
    res.json({ deployments });
  } catch (error) {
    next(error);
  }
};

export const getDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
      include: [
        {
          model: DeploymentLog,
          order: [['timestamp', 'ASC']],
        },
      ],
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Decrypt environment variables before sending to client
    if (deployment.envVars && typeof deployment.envVars === 'object') {
      deployment.envVars = decryptEnvVars(deployment.envVars);
    }

    res.json({ deployment });
  } catch (error) {
    next(error);
  }
};

export const restartDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    await deployment.update({ status: 'pending' });
    
    // Add deployment to job queue for processing
    const deploymentJobService = await import('../services/deploymentJobService.js');
    await deploymentJobService.default.addDeploymentJob(deployment.id, 'restart');

    res.json({
      message: 'Deployment restart initiated',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const stopDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Only attempt to stop the app if it's currently deployed/running
    if (deployment.status === 'deployed' || deployment.status === 'deploying' || deployment.status === 'building') {
      try {
        // Initialize platform service
        const platformService = getPlatformService();
        
        // Stop the application using platform service
        await platformService.stopApp(deployment.name);
        
        // Add deployment log to track this action
        await DeploymentLog.create({
          deploymentId: deployment.id,
          type: 'info',
          message: 'Application stopped via stop API call',
          timestamp: new Date(),
        });
      } catch (stopError) {
        // If stopping the app fails, log the error but still update the status
        await DeploymentLog.create({
          deploymentId: deployment.id,
          type: 'warning',
          message: `Failed to stop application: ${stopError.message}`,
          timestamp: new Date(),
        });
        
        // Continue with status update even if platform stop action failed
      }
    }

    await deployment.update({ status: 'stopped' });
    
    // Emit status update via Socket.IO
    const io = getIO();
    io.to(`deployment-${deployment.id}`).emit('deployment:status', {
      deploymentId: deployment.id,
      status: 'stopped',
    });

    res.json({
      message: 'Deployment stopped successfully',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Use soft delete - updates the deletedAt timestamp instead of physically removing
    await deployment.destroy();

    res.json({ message: 'Deployment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDeploymentLogs = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const logs = await DeploymentLog.findAll({
      where: { deploymentId: id },
      order: [['timestamp', 'ASC']],
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
};

export const rebuildDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Update status to pending for rebuild
    await deployment.update({ status: 'pending' });
    
    // Add deployment to job queue for processing
    const deploymentJobService = await import('../services/deploymentJobService.js');
    await deploymentJobService.default.addDeploymentJob(deployment.id, 'rebuild');

    res.json({
      message: 'Deployment rebuild initiated',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const scaleDeployment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scaleConfig } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    await platformService.scaleApp(deployment.name, scaleConfig);

    res.json({
      message: 'Deployment scaled successfully',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnvVars = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { key } = req.query;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // If the deployment has been soft-deleted, return a 404
    if (deployment.deletedAt) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    const result = await platformService.getEnvVars(deployment.name, key || null);

    res.json({
      envVars: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const unsetEnvVars = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { keys } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Validate environment variable keys to prevent unsetting restricted variables
    if (!Array.isArray(keys)) {
      return res.status(400).json({ error: 'Keys must be an array' });
    }

    const invalidKeys = [];
    for (const key of keys) {
      const validation = validateEnvVarName(key);
      if (!validation.isValid) {
        invalidKeys.push({ key, reason: validation.reason });
      }
    }

    if (invalidKeys.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid environment variable keys', 
        invalidKeys 
      });
    }

    const platformService = getPlatformService();
    await platformService.unsetEnvVars(deployment.name, keys);

    res.json({
      message: 'Environment variables unset successfully',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const addDomain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Validate domain to prevent malicious domain registration
    const domainValidation = validateDomain(domain);
    if (!domainValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid domain', 
        reason: domainValidation.reason 
      });
    }

    // Sanitize domain as an additional safety measure
    const sanitizedDomain = sanitizeDomain(domain);
    if (!sanitizedDomain) {
      return res.status(400).json({ 
        error: 'Invalid domain', 
        reason: 'Domain sanitization failed' 
      });
    }

    const platformService = getPlatformService();
    await platformService.addDomain(deployment.name, sanitizedDomain);

    res.json({
      message: `Domain ${sanitizedDomain} added to deployment successfully`,
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const removeDomain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Validate domain to prevent issues with domain removal
    const domainValidation = validateDomain(domain);
    if (!domainValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid domain', 
        reason: domainValidation.reason 
      });
    }

    // Sanitize domain as an additional safety measure
    const sanitizedDomain = sanitizeDomain(domain);
    if (!sanitizedDomain) {
      return res.status(400).json({ 
        error: 'Invalid domain', 
        reason: 'Domain sanitization failed' 
      });
    }

    const platformService = getPlatformService();
    await platformService.removeDomain(deployment.name, sanitizedDomain);

    res.json({
      message: `Domain ${sanitizedDomain} removed from deployment successfully`,
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const getDomains = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    const result = await platformService.getAppDomains(deployment.name);

    res.json({
      domains: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const addPortMapping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { portMapping } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Validate port mapping to prevent dangerous port configurations
    const portValidation = validatePortMapping(portMapping);
    if (!portValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid port mapping', 
        reason: portValidation.reason 
      });
    }

    // Sanitize port mapping as an additional safety measure
    const sanitizedPortMapping = sanitizePortMapping(portMapping);
    if (!sanitizedPortMapping) {
      return res.status(400).json({ 
        error: 'Invalid port mapping', 
        reason: 'Port mapping sanitization failed' 
      });
    }

    const platformService = getPlatformService();
    await platformService.addPortMapping(deployment.name, sanitizedPortMapping);

    res.json({
      message: `Port mapping ${sanitizedPortMapping} added to deployment successfully`,
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const removePortMapping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { portMapping } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Validate port mapping to prevent issues with port removal
    const portValidation = validatePortMapping(portMapping);
    if (!portValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid port mapping', 
        reason: portValidation.reason 
      });
    }

    // Sanitize port mapping as an additional safety measure
    const sanitizedPortMapping = sanitizePortMapping(portMapping);
    if (!sanitizedPortMapping) {
      return res.status(400).json({ 
        error: 'Invalid port mapping', 
        reason: 'Port mapping sanitization failed' 
      });
    }

    const platformService = getPlatformService();
    await platformService.removePortMapping(deployment.name, sanitizedPortMapping);

    res.json({
      message: `Port mapping ${sanitizedPortMapping} removed from deployment successfully`,
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPortMappings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    const result = await platformService.getAppPortMappings(deployment.name);

    res.json({
      portMappings: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lines = 100 } = req.query;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    const result = await platformService.getAppLogs(deployment.name, parseInt(lines));

    res.json({
      logs: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const runCommand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { command } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Validate command to prevent dangerous execution
    const commandValidation = validateCommand(command);
    if (!commandValidation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid command', 
        reason: commandValidation.reason 
      });
    }

    // For additional security, you can implement a whitelist approach
    // Uncomment the following lines if you want to only allow specific commands
    /*
    if (!isAllowedCommand(command)) {
      return res.status(400).json({ 
        error: 'Command not in allowed list',
        reason: 'This command is not permitted for security reasons'
      });
    }
    */

    // Sanitize command as an additional safety measure
    const sanitizedCommand = sanitizeCommand(command);

    const platformService = getPlatformService();
    const result = await platformService.runCommand(deployment.name, sanitizedCommand);

    res.json({
      output: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const purgeCache = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    await platformService.purgeAppCache(deployment.name);

    res.json({
      message: 'Build cache purged successfully',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};

export const getNetworkInfo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const platformService = getPlatformService();
    const result = await platformService.getAppNetworkInfo(deployment.name);

    res.json({
      networkInfo: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const listApps = async (req, res, next) => {
  try {
    const platformService = getPlatformService();
    const result = await platformService.listApps();

    res.json({
      apps: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

export const listPlugins = async (req, res, next) => {
  try {
    const platformService = getPlatformService();
    const result = await platformService.listPlugins();

    res.json({
      plugins: result.stdout,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's resource usage and plan information
 */
export const getResourceUsage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user with plan information
    const user = await User.findByPk(userId, {
      include: [{
        model: Plan,
        as: 'plan',
        attributes: ['id', 'name', 'maxApps', 'maxRAM', 'maxCPU', 'maxStorage', 'maxTeamMembers']
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
    
    // Calculate resource usage
    const deployments = await Deployment.findAll({
      where: { userId: user.id },
      attributes: ['allocatedRAM', 'allocatedCPU', 'allocatedStorage']
    });
    
    const totalRAM = deployments.reduce((sum, deployment) => sum + deployment.allocatedRAM, 0);
    const totalCPU = deployments.reduce((sum, deployment) => sum + deployment.allocatedCPU, 0);
    const totalStorage = deployments.reduce((sum, deployment) => sum + deployment.allocatedStorage, 0);
    const totalApps = deployments.length;
    
    const resourceUsage = {
      plan: {
        id: user.plan.id,
        name: user.plan.name,
        maxApps: user.plan.maxApps,
        maxRAM: user.plan.maxRAM,
        maxCPU: user.plan.maxCPU,
        maxStorage: user.plan.maxStorage,
        maxTeamMembers: user.plan.maxTeamMembers,
        features: user.plan.features
      },
      usage: {
        apps: totalApps,
        ram: totalRAM,
        cpu: totalCPU,
        storage: totalStorage
      },
      available: {
        apps: user.plan.maxApps === -1 ? 'unlimited' : user.plan.maxApps - totalApps,
        ram: user.plan.maxRAM - totalRAM,
        cpu: user.plan.maxCPU - totalCPU,
        storage: user.plan.maxStorage - totalStorage
      }
    };
    
    res.json(resourceUsage);
  } catch (error) {
    next(error);
  }
};

/**
 * Update resource allocation for a deployment
 */
export const updateResourceAllocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { allocatedRAM, allocatedCPU, allocatedStorage } = req.body;

    const deployment = await Deployment.findOne({
      where: { id, userId: req.user.id },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    // Get user's plan to validate resource limits
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Plan,
        as: 'plan',
        attributes: ['id', 'name', 'maxRAM', 'maxCPU', 'maxStorage']
      }]
    });

    if (!user.plan) {
      return res.status(400).json({ error: 'User does not have an active plan' });
    }

    // Validate that requested resources don't exceed plan limits
    if (allocatedRAM > user.plan.maxRAM) {
      return res.status(400).json({ 
        error: `Requested RAM (${allocatedRAM}MB) exceeds plan limit (${user.plan.maxRAM}MB)` 
      });
    }
    
    if (allocatedCPU > user.plan.maxCPU) {
      return res.status(400).json({ 
        error: `Requested CPU (${allocatedCPU} cores) exceeds plan limit (${user.plan.maxCPU} cores)` 
      });
    }
    
    if (allocatedStorage > user.plan.maxStorage) {
      return res.status(400).json({ 
        error: `Requested storage (${allocatedStorage}GB) exceeds plan limit (${user.plan.maxStorage}GB)` 
      });
    }

    // Update resource allocation in database
    await deployment.update({
      allocatedRAM,
      allocatedCPU,
      allocatedStorage
    });

    // Update container resources if deployment is active
    const platformService = getPlatformService();
    if (deployment.status === 'deployed' || deployment.status === 'deploying' || deployment.status === 'building') {
      await platformService.updateContainerResources(deployment.name, {
        ram: allocatedRAM,
        cpu: allocatedCPU,
        storage: allocatedStorage
      });
    }

    res.json({
      message: 'Resource allocation updated successfully',
      deployment,
    });
  } catch (error) {
    next(error);
  }
};
