import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { Deployment } from '../models/index.js';
import logger from '../utils/logger.js';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Optimized Deployment Worker Manager
 * Implements efficient job processing with resource management
 */
class DeploymentWorkerManager {
  constructor(options = {}) {
    this.workers = [];
    this.jobQueue = [];
    this.maxWorkers = options.maxWorkers || 3; // Optimal number for deployment operations
    this.activeJobs = new Map();
    this.isShuttingDown = false;
    this.workerLoad = new Map(); // Track load per worker
    this.jobPriorities = options.jobPriorities || {
      'restart': 2,    // High priority - fast operation
      'create': 1,     // Medium priority - standard operation  
      'rebuild': 0     // Low priority - resource intensive
    };
    this.maxQueueSize = options.maxQueueSize || 50; // Prevent memory issues
    this.workerRestartThreshold = options.workerRestartThreshold || 10; // Restart workers after N jobs
    this.workerJobCount = new Map(); // Track jobs per worker to restart as needed
  }

  /**
   * Initialize the worker manager
   */
  async initialize() {
    // Create initial worker pool
    for (let i = 0; i < this.maxWorkers; i++) {
      await this.createWorker(i);
    }
    
    logger.info(`DeploymentWorkerManager: Initialized with ${this.maxWorkers} workers`);
    
    // Start background maintenance
    this.startMaintenance();
  }

  /**
   * Create a new worker thread
   */
  async createWorker(workerId) {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, '..', 'worker.js');
      const worker = new Worker(workerPath, {
        workerData: { workerId }
      });
      
      // Set initial job count for this worker
      this.workerJobCount.set(worker, 0);
      
      // Handle messages from worker
      worker.on('message', (message) => {
        if (message.command === 'jobCompleted') {
          const { deploymentId, jobType } = message.data;
          
          // Remove from active jobs
          this.activeJobs.delete(deploymentId);
          
          // Update worker job count
          const currentCount = this.workerJobCount.get(worker) || 0;
          this.workerJobCount.set(worker, currentCount + 1);
          
          logger.success(`DeploymentWorkerManager: Job completed [${jobType}] for deployment ${deploymentId}`);
          
          // Check if worker needs restart (to prevent memory leaks)
          if (currentCount >= this.workerRestartThreshold) {
            this.restartWorker(worker, workerId);
          }
          
          // Process next job in queue
          setImmediate(() => this.processQueue());
        }
        // Handle deployment status updates from worker
        else if (message.command === 'deploymentStatus') {
          const { deploymentId, status } = message.data;
          if (this.deploymentUpdateCallback && typeof this.deploymentUpdateCallback === 'function') {
            this.deploymentUpdateCallback(deploymentId, status, null);
          }
        }
        // Handle deployment log updates from worker
        else if (message.command === 'deploymentLog') {
          const { deploymentId, log } = message.data;
          if (this.deploymentUpdateCallback && typeof this.deploymentUpdateCallback === 'function') {
            this.deploymentUpdateCallback(deploymentId, null, log);
          }
        }
      });
      
      // Handle worker errors
      worker.on('error', (error) => {
        logger.error(`DeploymentWorkerManager: Worker ${workerId} error:`, error);
        
        // Replace the failed worker if not shutting down
        if (!this.isShuttingDown) {
          setTimeout(() => {
            this.createWorker(workerId);
          }, 1000);
        }
      });
      
      // Handle worker exit
      worker.on('exit', (code) => {
        logger.info(`DeploymentWorkerManager: Worker ${workerId} exited with code ${code}`);
        
        if (!this.isShuttingDown && code !== 0) {
          // Replace the exited worker unless we're shutting down
          if (!this.isShuttingDown) {
            setTimeout(() => {
              this.createWorker(workerId);
            }, 1000);
          }
        }
      });
      
      this.workers[workerId] = worker;
      resolve(worker);
    });
  }

  /**
   * Restart a worker to prevent memory leaks
   */
  async restartWorker(oldWorker, workerId) {
    logger.info(`DeploymentWorkerManager: Restarting worker ${workerId} after ${this.workerRestartThreshold} jobs`);
    
    // Remove old worker and its references
    oldWorker.terminate();
    this.workerJobCount.delete(oldWorker);
    
    // Create a new worker
    await this.createWorker(workerId);
  }

  /**
   * Start background maintenance tasks
   */
  startMaintenance() {
    // Periodic cleanup and monitoring
    setInterval(() => {
      this.performMaintenance();
    }, 30000); // Run every 30 seconds
    
    // Queue monitoring
    setInterval(() => {
      const queueInfo = this.getQueueInfo();
      if (queueInfo.queueLength > this.maxQueueSize * 0.8) { // 80% of max
        logger.warn(`DeploymentWorkerManager: Queue is at ${queueInfo.queueLength}/${this.maxQueueSize} capacity`);
      }
    }, 60000); // Monitor every minute
  }

  /**
   * Perform maintenance tasks
   */
  performMaintenance() {
    // Clean up any stale job references
    const currentDeploymentIds = new Set();
    this.workers.forEach(worker => {
      if (worker) {
        // In a real implementation, you might ping workers to check their status
      }
    });
    
    // Log current status
    const info = this.getQueueInfo();
    logger.info(`DeploymentWorkerManager: Status - Queue: ${info.queueLength}, Active: ${info.activeJobs}, Workers: ${info.availableWorkers}/${info.maxWorkers}`);
  }

  /**
   * Add a deployment job to the queue with priority
   * @param {string} deploymentId - The ID of the deployment
   * @param {string} jobType - The type of job (create, restart, rebuild)
   * @param {number} priority - Optional priority override (higher = more priority)
   */
  async addJob(deploymentId, jobType = 'create', priority = null) {
    // Check if deployment exists
    const deployment = await Deployment.findByPk(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    // Check queue size to prevent memory issues
    if (this.jobQueue.length >= this.maxQueueSize) {
      throw new Error(`Job queue is full (${this.maxQueueSize} jobs). Please try again later.`);
    }

    // Calculate priority if not provided
    if (priority === null) {
      priority = this.jobPriorities[jobType] || 1;
    }

    // Add to queue with priority and timestamp
    const job = {
      deploymentId,
      jobType,
      priority,
      timestamp: Date.now(),
      addedAt: new Date()
    };

    // Insert job in priority order (higher priority jobs come first)
    this.insertJobInPriorityOrder(job);
    
    logger.info(`DeploymentWorkerManager: Added [${jobType}] job for deployment ${deploymentId} (priority: ${priority})`);
    
    // Process queue asynchronously to avoid blocking
    setImmediate(() => this.processQueue());
  }

  /**
   * Insert job in priority order (higher priority first)
   */
  insertJobInPriorityOrder(job) {
    // Find the correct position based on priority and age
    let insertIndex = 0;
    for (let i = 0; i < this.jobQueue.length; i++) {
      const queueJob = this.jobQueue[i];
      
      // Higher priority should come first
      if (job.priority > queueJob.priority) {
        insertIndex = i;
        break;
      } 
      // If same priority, older jobs (waiting longer) come first
      else if (job.priority === queueJob.priority && job.timestamp < queueJob.timestamp) {
        insertIndex = i;
        break;
      } 
      // If same priority and same age, maintain insertion order
      else {
        insertIndex = i + 1;
      }
    }
    
    this.jobQueue.splice(insertIndex, 0, job);
  }

  /**
   * Process jobs in the queue efficiently
   */
  processQueue() {
    // Don't process if shutting down or no workers available
    if (this.isShuttingDown || this.workers.length === 0) {
      return;
    }

    // Process all available workers and jobs
    let processedJobs = 0;
    const maxJobsPerCycle = Math.min(3, this.maxWorkers); // Process up to 3 jobs per cycle
    
    while (this.jobQueue.length > 0 && processedJobs < maxJobsPerCycle) {
      // Find an available worker (one not currently handling a job)
      const availableWorkerIndex = this.workers.findIndex((worker, index) => {
        return worker && !Array.from(this.activeJobs.values()).some(activeWorker => activeWorker === worker);
      });

      if (availableWorkerIndex === -1 || this.jobQueue.length === 0) {
        break; // No available workers or no jobs in queue
      }

      // Get the highest priority job
      const job = this.jobQueue.shift();
      const availableWorker = this.workers[availableWorkerIndex];

      // Mark this deployment as being processed by this worker
      this.activeJobs.set(job.deploymentId, availableWorker);

      // Send the job to the worker
      availableWorker.postMessage({
        command: 'processJob',
        data: { deploymentId: job.deploymentId, jobType: job.jobType }
      });

      logger.info(`DeploymentWorkerManager: Sent [${job.jobType}] job for deployment ${job.deploymentId} to worker ${availableWorkerIndex}`);
      processedJobs++;
    }
  }

  /**
   * Get the status of an active deployment job
   * @param {string} deploymentId - The ID of the deployment
   * @returns {Object|null} Job status information or null if not active
   */
  getJobStatus(deploymentId) {
    if (!this.activeJobs.has(deploymentId)) {
      return null;
    }

    // Find which worker is handling this job
    const worker = this.activeJobs.get(deploymentId);
    const workerIndex = this.workers.findIndex(w => w === worker);

    return {
      deploymentId,
      isActive: true,
      processing: true,
      workerId: workerIndex,
      queuePosition: -1 // Currently active, not in queue
    };
  }

  /**
   * Check if a deployment job is currently active
   */
  isJobActive(deploymentId) {
    return this.activeJobs.has(deploymentId);
  }

  /**
   * Get queue information
   */
  getQueueInfo() {
    // Calculate priority breakdown
    const priorityBreakdown = {
      high: 0, // restart
      medium: 0, // create
      low: 0 // rebuild
    };
    
    this.jobQueue.forEach(job => {
      if (job.jobType === 'restart') priorityBreakdown.high++;
      else if (job.jobType === 'create') priorityBreakdown.medium++;
      else if (job.jobType === 'rebuild') priorityBreakdown.low++;
    });

    return {
      queueLength: this.jobQueue.length,
      activeJobs: this.activeJobs.size,
      maxWorkers: this.maxWorkers,
      availableWorkers: this.workers.filter(w => w && !Array.from(this.activeJobs.values()).some(aw => aw === w)).length,
      priorityBreakdown,
      maxQueueSize: this.maxQueueSize,
      utilization: ((this.activeJobs.size / this.maxWorkers) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get detailed queue information including jobs
   */
  getDetailedQueueInfo() {
    const queueInfo = this.getQueueInfo();
    
    return {
      ...queueInfo,
      jobs: this.jobQueue.map((job, index) => ({
        index,
        deploymentId: job.deploymentId,
        jobType: job.jobType,
        priority: job.priority,
        waitingTime: Date.now() - job.timestamp
      }))
    };
  }

  /**
   * Cancel a deployment job if it's in the queue
   * @param {string} deploymentId - The ID of the deployment to cancel
   * @returns {boolean} True if job was cancelled, false if not found
   */
  cancelJob(deploymentId) {
    // Check if job is in queue and remove it
    const queueIndex = this.jobQueue.findIndex(job => job.deploymentId === deploymentId);
    if (queueIndex > -1) {
      const cancelledJob = this.jobQueue.splice(queueIndex, 1)[0];
      logger.info(`DeploymentWorkerManager: Cancelled [${cancelledJob.jobType}] job for deployment ${deploymentId} (was in queue at position ${queueIndex})`);
      return true;
    }
    
    // Check if job is active (running) - we can't cancel active jobs easily
    if (this.activeJobs.has(deploymentId)) {
      logger.warn(`DeploymentWorkerManager: Cannot cancel active job for deployment ${deploymentId}`);
      return false;
    }
    
    return false;
  }

  /**
   * Cancel all jobs in the queue
   */
  cancelAllJobs() {
    const cancelledCount = this.jobQueue.length;
    this.jobQueue = [];
    logger.info(`DeploymentWorkerManager: Cancelled all ${cancelledCount} queued jobs`);
    return cancelledCount;
  }

  /**
   * Register a callback function to handle deployment updates
   * @param {Function} callback - Function to call when deployment updates occur
   */
  registerDeploymentUpdateCallback(callback) {
    this.deploymentUpdateCallback = callback;
  }

  /**
   * Gracefully shut down the worker manager
   */
  async shutdown() {
    logger.info('DeploymentWorkerManager: Initiating graceful shutdown...');
    this.isShuttingDown = true;

    // Wait briefly for any in-progress jobs to complete
    const maxWaitTime = 10000; // 10 seconds max wait
    const startTime = Date.now();

    // Wait until all active jobs are done or timeout
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.activeJobs.size > 0) {
      logger.warn(`DeploymentWorkerManager: ${this.activeJobs.size} jobs still active after timeout, proceeding with shutdown`);
    }

    // Terminate all workers
    for (const worker of this.workers) {
      if (worker) {
        worker.terminate();
      }
    }

    logger.info('DeploymentWorkerManager: Shutdown complete');
  }
}

// Create a singleton instance with optimized settings
const deploymentWorkerManager = new DeploymentWorkerManager({
  maxWorkers: 3,              // Optimal for deployment operations
  maxQueueSize: 100,          // Prevent memory issues
  workerRestartThreshold: 20  // Restart workers after 20 jobs to prevent memory leaks
});
export default deploymentWorkerManager;