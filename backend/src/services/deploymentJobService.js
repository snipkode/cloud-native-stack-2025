import deploymentWorkerManager from './deploymentWorkerManager.js';

/**
 * Deployment Job Service (Worker-based)
 * Handles background deployment jobs and status monitoring using worker threads
 */
class DeploymentJobService {
  constructor() {
    // Initialize the worker manager
    this.workerManager = deploymentWorkerManager;
    // Placeholder for deployment update handler - to be set by server.js
    this.onDeploymentUpdate = null;
  }

  /**
   * Initialize the deployment job service
   */
  async initialize() {
    await this.workerManager.initialize();
  }

  /**
   * Add a deployment to the job queue (handled by worker threads)
   * @param {string} deploymentId - The ID of the deployment
   * @param {string} jobType - Type of job (create, restart, rebuild)
   * @returns {Promise} Promise that resolves when the job is added
   */
  async addDeploymentJob(deploymentId, jobType = 'create') {
    return await this.workerManager.addJob(deploymentId, jobType);
  }

  /**
   * Get status of an active deployment job
   * @param {string} deploymentId - The ID of the deployment
   * @returns {Object|null} Job status information or null if not active
   */
  getJobStatus(deploymentId) {
    return this.workerManager.getJobStatus(deploymentId);
  }

  /**
   * Cancel an active deployment job
   * @param {string} deploymentId - The ID of the deployment to cancel
   * @returns {boolean} True if job was cancelled, false if not found
   */
  cancelJob(deploymentId) {
    return this.workerManager.cancelJob(deploymentId);
  }

  /**
   * Get queue information
   * @returns {Object} Queue information
   */
  getQueueInfo() {
    return this.workerManager.getQueueInfo();
  }
  
  /**
   * Get detailed queue information
   * @returns {Object} Detailed queue information
   */
  getDetailedQueueInfo() {
    return this.workerManager.getDetailedQueueInfo();
  }

  /**
   * Cancel all jobs in the queue
   * @returns {number} Number of cancelled jobs
   */
  cancelAllJobs() {
    return this.workerManager.cancelAllJobs();
  }

  /**
   * Check if a job is currently active
   * @param {string} deploymentId - The ID of the deployment
   * @returns {boolean} True if the job is active, false otherwise
   */
  isJobActive(deploymentId) {
    return this.workerManager.isJobActive(deploymentId);
  }

  /**
   * Gracefully shut down the service
   */
  async shutdown() {
    await this.workerManager.shutdown();
  }
}

// Create a singleton instance
const deploymentJobService = new DeploymentJobService();
export default deploymentJobService;