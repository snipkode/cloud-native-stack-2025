import { Deployment, DeploymentLog } from '../models/index.js';
import getPlatformService from './platformService.js';

export const simulateDeployment = async (deploymentId, io = null, callbacks = null) => {
  try {
    const deployment = await Deployment.findByPk(deploymentId);
    if (!deployment) return;

    const addLog = async (type, message) => {
      const log = await DeploymentLog.create({
        deploymentId,
        type,
        message,
        timestamp: new Date(),
      });

      if (io) {
        io.to(`deployment-${deploymentId}`).emit('deployment:log', {
          deploymentId,
          log,
        });
      } else if (callbacks && callbacks.onLogUpdate) {
        callbacks.onLogUpdate(deploymentId, log);
      }

      return log;
    };

    const updateStatus = async (status) => {
      await deployment.update({ status });
      if (io) {
        io.to(`deployment-${deploymentId}`).emit('deployment:status', {
          deploymentId,
          status,
        });
      } else if (callbacks && callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate(deploymentId, status);
      }
    };

    // Initiate application deployment through platform
    const platformService = getPlatformService();
    await platformService.createDeployment(deployment, addLog, updateStatus);
    
  } catch (error) {
    const deployment = await Deployment.findByPk(deploymentId);
    if (deployment) {
      await deployment.update({ status: 'failed' });
      await DeploymentLog.create({
        deploymentId,
        type: 'error',
        message: `Deployment failed: ${error.message}`,
        timestamp: new Date(),
      });
      // Emit error status through callback if io is not available
      if (io) {
        io.to(`deployment-${deploymentId}`).emit('deployment:status', {
          deploymentId,
          status: 'failed',
        });
      } else if (callbacks && callbacks.onStatusUpdate) {
        callbacks.onStatusUpdate(deploymentId, 'failed');
      }
    }
  }
};
