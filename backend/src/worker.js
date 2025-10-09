#!/usr/bin/env node

import { isMainThread, parentPort, workerData } from 'worker_threads';
import logger from './utils/logger.js';

// Get worker ID from environment or assign a default
let WORKER_ID = process.env.WORKER_ID || 'unknown';
if (!isMainThread && workerData && workerData.workerId !== undefined) {
  WORKER_ID = workerData.workerId;
}

// Create a unique name for this worker
const WORKER_NAME = `DeployWorker-${WORKER_ID}`;

// Global variables for this worker
let shouldContinue = true;
let dbConnection = null;

// Function to handle shutdown gracefully
const handleShutdown = () => {
  logger.info(`${WORKER_NAME}: Received shutdown signal`);
  shouldContinue = false;
  
  // Close database connection if available
  if (dbConnection && dbConnection.close) {
    dbConnection.close();
  }
};

// Set up signal handlers
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

/**
 * Load database connection
 */
async function loadDatabase() {
  if (dbConnection) {
    return dbConnection;
  }
  
  // Load database using dynamic import
  const dbModule = await import('./config/database.js');
  dbConnection = dbModule.default;
  
  // Authenticate connection
  try {
    await dbConnection.authenticate();
    logger.success(`${WORKER_NAME}: Database connection established`);
  } catch (error) {
    logger.error(`${WORKER_NAME}: Database connection error: ${error.message || error}`);
    throw error;
  }
  
  return dbConnection;
}

/**
 * Process a single deployment job
 * @param {string} deploymentId - The ID of the deployment to process
 * @param {string} jobType - The type of job (create, restart, rebuild)
 */
async function processDeploymentJob(deploymentId, jobType) {
  try {
    // Load database connection
    const sequelize = await loadDatabase();
    
    // Load models
    const modelsModule = await import('./models/index.js');
    const { Deployment, DeploymentLog } = modelsModule;
    
    // Find the deployment
    const deployment = await Deployment.findByPk(deploymentId);
    if (!deployment) {
      logger.warn(`${WORKER_NAME}: Deployment ${deploymentId} not found`);
      return;
    }

    // Update status based on job type
    let initialStatus = 'building';
    switch (jobType) {
      case 'restart':
        initialStatus = 'deploying';
        break;
      case 'rebuild':
        initialStatus = 'building';
        break;
      case 'create':
      default:
        initialStatus = 'building';
        break;
    }

    await deployment.update({ status: initialStatus });
    logger.info(`${WORKER_NAME}: Updated deployment ${deploymentId} status to ${initialStatus}`);

    // Execute job based on type
    switch (jobType) {
      case 'create':
        // Load deployment service
        const deploymentServiceModule = await import('./services/deploymentService.js');
        const { simulateDeployment } = deploymentServiceModule;
        // Pass callbacks to communicate deployment updates to main thread
        await simulateDeployment(deploymentId, null, {
          onLogUpdate: (deploymentId, log) => {
            if (parentPort) {
              parentPort.postMessage({
                command: 'deploymentLog',
                data: {
                  deploymentId,
                  log,
                }
              });
            }
          },
          onStatusUpdate: (deploymentId, status) => {
            if (parentPort) {
              parentPort.postMessage({
                command: 'deploymentStatus',
                data: {
                  deploymentId,
                  status,
                }
              });
            }
          }
        });
        break;
      case 'restart':
        await handleRestart(deploymentId, modelsModule);
        break;
      case 'rebuild':
        await handleRebuild(deploymentId, modelsModule);
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }

    logger.success(`${WORKER_NAME}: Completed ${jobType} job for deployment ${deploymentId}`);
  } catch (error) {
    logger.error(`${WORKER_NAME}: Error processing deployment job ${deploymentId}: ${error.message || error}`);
    
    try {
      // Load models to update status
      const modelsModule = await import('./models/index.js');
      const { Deployment } = modelsModule;
      
      // Update deployment status to failed
      const deployment = await Deployment.findByPk(deploymentId);
      if (deployment) {
        await deployment.update({ status: 'failed' });
        logger.info(`${WORKER_NAME}: Updated deployment ${deploymentId} status to failed`);
      }
    } catch (updateError) {
      logger.error(`${WORKER_NAME}: Error updating deployment status to failed: ${updateError.message || updateError}`);
    }
  }
}

/**
 * Handle a restart job
 * @param {string} deploymentId - The ID of the deployment to restart
 * @param {Object} modelsModule - The models module with all required models
 */
async function handleRestart(deploymentId, modelsModule) {
  const { Deployment, DeploymentLog } = modelsModule;
  
  const deployment = await Deployment.findByPk(deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  try {
    // Add log indicating restart process
    await DeploymentLog.create({
      deploymentId,
      type: 'info',
      message: 'Restart process initiated',
      timestamp: new Date(),
    });

    // Load platform service
    const platformServiceModule = await import('./services/platformService.js');
    const getPlatformService = platformServiceModule.default;
    
    // Initiate restart through platform
    const platformService = getPlatformService();
    await platformService.restartApp(deployment.name);
    
    // Update deployment status to deployed after restart
    await deployment.update({ 
      status: 'deployed',
      lastDeployedAt: new Date()
    });
    
    // Add success log
    await DeploymentLog.create({
      deploymentId,
      type: 'success',
      message: 'Application restarted successfully',
      timestamp: new Date(),
    });
    
    logger.success(`${WORKER_NAME}: Successfully restarted deployment ${deploymentId}`);
  } catch (error) {
    // Add error log
    await DeploymentLog.create({
      deploymentId,
      type: 'error',
      message: `Application restart failed: ${error.message}`,
      timestamp: new Date(),
    });
    
    // Update status to failed
    await deployment.update({ status: 'failed' });
    
    logger.error(`${WORKER_NAME}: Restart job failed for deployment ${deploymentId}: ${error.message || error}`);
    throw error;
  }
}

/**
 * Handle a rebuild job
 * @param {string} deploymentId - The ID of the deployment to rebuild
 * @param {Object} modelsModule - The models module with all required models
 */
async function handleRebuild(deploymentId, modelsModule) {
  const { Deployment, DeploymentLog } = modelsModule;
  
  const deployment = await Deployment.findByPk(deploymentId);
  if (!deployment) {
    throw new Error(`Deployment ${deploymentId} not found`);
  }

  try {
    // Add log indicating rebuild process
    await DeploymentLog.create({
      deploymentId,
      type: 'info',
      message: 'Rebuild process initiated',
      timestamp: new Date(),
    });

    // Load platform service
    const platformServiceModule = await import('./services/platformService.js');
    const getPlatformService = platformServiceModule.default;
    
    // Initiate rebuild through platform
    const platformService = getPlatformService();
    await platformService.rebuildApp(deployment.name);
    
    // Update deployment status to deployed after rebuild
    await deployment.update({ 
      status: 'deployed',
      lastDeployedAt: new Date()
    });
    
    // Add success log
    await DeploymentLog.create({
      deploymentId,
      type: 'success',
      message: 'Application rebuilt successfully',
      timestamp: new Date(),
    });
    
    logger.success(`${WORKER_NAME}: Successfully rebuilt deployment ${deploymentId}`);
  } catch (error) {
    // Add error log
    await DeploymentLog.create({
      deploymentId,
      type: 'error',
      message: `Application rebuild failed: ${error.message}`,
      timestamp: new Date(),
    });
    
    // Update status to failed
    await deployment.update({ status: 'failed' });
    
    logger.error(`${WORKER_NAME}: Rebuild job failed for deployment ${deploymentId}: ${error.message || error}`);
    throw error;
  }
}

/**
 * Main worker loop
 */
async function main() {
  logger.info(`${WORKER_NAME}: Starting deployment job processor...`);
  
  // Wait for jobs from the main thread
  if (!isMainThread) {
    parentPort.on('message', async (message) => {
      if (message.command === 'processJob' && shouldContinue) {
        const { deploymentId, jobType } = message.data;
        logger.info(`${WORKER_NAME}: Received job to ${jobType} deployment ${deploymentId}`);
        
        await processDeploymentJob(deploymentId, jobType);
        
        // Send completion message back to main thread
        parentPort.postMessage({
          command: 'jobCompleted',
          data: { deploymentId, jobType }
        });
      } else if (message.command === 'shutdown') {
        logger.info(`${WORKER_NAME}: Shutdown command received`);
        shouldContinue = false;
      }
    });
  } else {
    logger.warn(`${WORKER_NAME}: This should be run as a worker thread`);
  }
}

// Run the main function
main().catch(error => logger.error(`Worker error: ${error.message || error}`));