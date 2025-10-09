import express from 'express';
import { createServer } from 'http';
import { initializeSocket, getIO } from './config/socket.js';
import deploymentJobService from './services/deploymentJobService.js';
import logger from './utils/logger.js';
import { config } from './config/app.js';
import { setupMiddleware } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
import './models/index.js'; // Import all models to register them
import './models/index.js'; // Import all models to register them
import sequelize from './config/database.js';

const app = express();
const server = createServer(app);

// Setup middleware
setupMiddleware(app, config);

// Setup routes
setupRoutes(app);

initializeSocket(server);

export const startServer = async () => {
  try {

    await sequelize.sync({ alter: 'true' }); // Sync database schema
    logger.dbSynced()

    // Initialize the deployment job service
    await deploymentJobService.initialize();
    logger.info('Deployment job service initialized');

    // Set up deployment status update handler to emit socket events
    deploymentJobService.onDeploymentUpdate = (deploymentId, status, logData) => {
      try {
        const io = getIO(); // This should be available since we're in the main thread
        if (status) {
          io.to(`deployment-${deploymentId}`).emit('deployment:status', {
            deploymentId,
            status,
          });
        }
        if (logData) {
          io.to(`deployment-${deploymentId}`).emit('deployment:log', {
            deploymentId,
            log: logData,
          });
        }
      } catch (error) {
        logger.error(`Error emitting socket event for deployment ${deploymentId}:`, error.message);
      }
    };
    
    // Register the callback with the worker manager to receive deployment updates
    deploymentJobService.workerManager.registerDeploymentUpdateCallback(deploymentJobService.onDeploymentUpdate);

    server.listen(config.port, () => {
      logger.serverStart(config.port, `http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

export default app;