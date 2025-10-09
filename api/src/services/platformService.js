import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Deployment, DeploymentLog } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Platform Deployment Service
 * Abstracts the underlying deployment infrastructure (Dokku, Heroku, Vercel, etc.) 
 * and provides user-friendly application lifecycle management
 */
class PlatformService {
  constructor() {
    // Get platform from environment variable, default to 'dokku'
    this.platform = process.env.PLATFORM_PROVIDER || 'dokku';
    this.isMockMode = process.env.NODE_ENV === 'development' && process.env.MOCK_MODE === 'true';
  }
  
  getSocketIO() {
    // We'll pass the io from deploymentService instead
    // This is a temporary solution; we need to pass the io from deploymentService
    return null;
  }

  /**
   * Execute a platform command (internally maps to Dokku, Heroku, Vercel, etc.)
   * @param {string} command - The platform command to run
   * @param {string} app - The app name (optional)
   * @returns {Promise<Object>} Result of the command execution
   */
  async executePlatformCommand(command, app = null, additionalArgs = []) {
    if (this.isMockMode) {
      // Mock mode implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            stdout: `MOCK: Platform command executed: ${command}${app ? ` ${app}` : ''}${additionalArgs.length ? ` ${additionalArgs.join(' ')}` : ''}`,
            stderr: '',
            exitCode: 0,
          });
        }, 50); // Fast response in mock mode
      });
    } else {
      // Real mode implementation
      return new Promise((resolve, reject) => {
        let cmdArgs = [];
        let platformCmd = this.platform; // Use the selected platform
        
        // Handle custom SSH port for Dokku (default is 22, but Dokku commonly uses 2222)
        const dokkuHost = process.env.DOKKU_HOST || 'localhost';
        const dokkuPort = process.env.DOKKU_SSH_PORT || '2222'; // Dokku default SSH port
        
        if (app) {
          cmdArgs = [command, app, ...additionalArgs];
        } else {
          cmdArgs = [command, ...additionalArgs];
        }

        // Handle different platform commands
        switch (this.platform) {
          case 'heroku':
            // Heroku CLI commands
            platformCmd = 'heroku';
            break;
          case 'vercel':
            // Vercel CLI commands (would need different command structure)
            platformCmd = 'vercel';
            // For Vercel, we'd need a different command structure
            logger.warn('Vercel platform support is basic in this implementation');
            break;
          case 'kubernetes':
            // Kubernetes commands
            platformCmd = 'kubectl';
            logger.warn('Kubernetes platform support requires additional configuration');
            break;
          case 'dokku':
          default:
            // For Dokku, we need to use SSH with proper arguments
            // Split the SSH command and its arguments
            const sshKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa');
            cmdArgs = ['-p', dokkuPort, '-i', sshKeyPath, `dokku@${dokkuHost}`, ...cmdArgs];
            platformCmd = 'ssh';
            break;
        }

        const platformProcess = spawn(platformCmd, cmdArgs);
        
        let stdout = '';
        let stderr = '';
        
        platformProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        platformProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        platformProcess.on('close', (code) => {
          resolve({
            stdout,
            stderr,
            exitCode: code,
          });
        });
        
        platformProcess.on('error', (error) => {
          reject(error);
        });
      });
    }
  }

  /**
   * Create a new platform application
   * @param {string} appName - The name of the app to create
   */
  async createApp(appName) {
    try {
      const result = await this.executePlatformCommand('apps:create', appName);
      
      if (result.exitCode !== 0) {
        // Check if the error is because the app already exists
        if (result.stderr && result.stderr.includes('Name is already taken')) {
          logger.info(`App ${appName} already exists, continuing with deployment...`);
          return {
            stdout: `App ${appName} already exists`,
            stderr: '',
            exitCode: 0
          };
        } else {
          throw new Error(`Failed to create app: ${result.stderr}`);
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Error creating platform app ${appName}: ${error.message || error}`);
      // Check if the error message indicates the app already exists
      if (error.message && error.message.includes('Name is already taken')) {
        logger.info(`App ${appName} already exists, continuing with deployment...`);
        return {
          stdout: `App ${appName} already exists`,
          stderr: '',
          exitCode: 0
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Deploy an application from a Git repository using git push to Dokku
   * @param {string} appName - The name of the app
   * @param {string} gitUrl - The Git repository URL
   * @param {string} branch - The branch to deploy
   */
  async deployApp(appName, gitUrl, branch = 'main') {
    const isMockMode = process.env.NODE_ENV === 'development' && process.env.MOCK_MODE === 'true';
    
    if (isMockMode) {
      // In mock mode, just return a success response
      return {
        stdout: `MOCK: Deployed ${gitUrl}#${branch} to ${appName}`,
        stderr: '',
        exitCode: 0,
      };
    } else {
      try {
        // Check if git is available
        const gitCheck = await this.executeGitCommand('--version');
        if (gitCheck.exitCode !== 0) {
          throw new Error('Git is not available in the system. Please install git to proceed with deployment.');
        }
        
        // Validate required environment variables
        if (!process.env.DOKKU_HOST) {
          logger.warn('DOKKU_HOST environment variable not set, defaulting to localhost');
        }
        
        // Clone the repository to a temporary directory
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `dokku-deploy-${appName}-`));
        const repoDir = path.join(tempDir, 'repo');
        
        // Clone the repository
        const cloneArgs = ['--branch', branch, '--single-branch', gitUrl, repoDir];
        const cloneResult = await this.executeGitCommand('clone', cloneArgs);
        
        if (cloneResult.exitCode !== 0) {
          throw new Error(`Failed to clone repository: ${cloneResult.stderr}`);
        }
        
        // Change to the repository directory and add Dokku remote
        // Handle custom SSH port for Dokku (default is 22, but Dokku commonly uses 2222)
        const dokkuHost = process.env.DOKKU_HOST || 'localhost';
        const dokkuPort = process.env.DOKKU_SSH_PORT || '2222'; // Dokku default SSH port
        
        // Use SSH URL format with custom port - git supports this format
        const dokkuUrl = `ssh://dokku@${dokkuHost}:${dokkuPort}/${appName}`;
        const remoteAddArgs = ['add', 'dokku', dokkuUrl];
        const remoteResult = await this.executeGitCommand('remote', remoteAddArgs, repoDir);
        
        if (remoteResult.exitCode !== 0) {
          throw new Error(`Failed to add Dokku remote: ${remoteResult.stderr}`);
        }
        
        // Push to Dokku remote - push the specified branch to the same branch name on Dokku
        // If the branch is 'main' or 'master', push to main on Dokku; otherwise push to the same branch name
        const targetBranch = branch === 'main' || branch === 'master' ? 'main' : branch;
        const pushArgs = ['dokku', `${branch}:${targetBranch}`];
        const pushResult = await this.executeGitCommand('push', pushArgs, repoDir);
        
        if (pushResult.exitCode !== 0) {
          throw new Error(`Failed to push to Dokku: ${pushResult.stderr}`);
        }
        
        // Clean up temporary directory
        await fs.rm(tempDir, { recursive: true, force: true });
        
        return pushResult;
      } catch (error) {
        logger.error(`Error deploying app ${appName}: ${error.message || error}`);
        throw error;
      }
    }
  }

  /**
   * Execute a git command
   * @param {string} command - The git command to run
   * @param {Array} args - Arguments for the git command
   * @param {string} cwd - Working directory (optional)
   * @returns {Promise<Object>} Result of the command execution
   */
  async executeGitCommand(command, args = [], cwd = null) {
    return new Promise((resolve, reject) => {
      // Ensure args is an array before spreading
      const argsArray = Array.isArray(args) ? args : [args].filter(arg => arg !== undefined);
      const gitArgs = [command, ...argsArray];
      // Include environment variables if needed
      const options = {
        ...(cwd && { cwd }),
        env: { ...process.env } // Pass current environment
      };
      
      const gitProcess = spawn('git', gitArgs, options);
      
      let stdout = '';
      let stderr = '';
      
      gitProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      gitProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      gitProcess.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code,
        });
      });
      
      gitProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Delete a platform application
   * @param {string} appName - The name of the app to delete
   */
  async deleteApp(appName) {
    try {
      const result = await this.executePlatformCommand('apps:destroy', appName, ['--force']);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to delete app: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error deleting platform app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get application information
   * @param {string} appName - The name of the app
   */
  async getAppInfo(appName) {
    try {
      // According to Dokku documentation, there's no 'apps:info' command
      // We can check app info using ps:report command
      const result = await this.executePlatformCommand('ps:report', appName);
      
      if (result.exitCode !== 0) {
        // If ps:report doesn't work, check if the app exists by listing all apps
        const appsResult = await this.executePlatformCommand('apps');
        if (appsResult.exitCode === 0 && appsResult.stdout.includes(appName)) {
          return { 
            stdout: `App ${appName} exists`, 
            stderr: '', 
            exitCode: 0 
          };
        } else {
          // Just return that the app exists to allow deployment to continue
          return { 
            stdout: `App ${appName} status check completed`, 
            stderr: '', 
            exitCode: 0 
          };
        }
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting app info for ${appName}: ${error.message || error}`);
      // If all commands fail, just return a success to allow deployment to continue
      return {
        stdout: `App ${appName} status check completed`,
        stderr: '',
        exitCode: 0
      };
    }
  }

  /**
   * Configure application environment variables
   * @param {string} appName - The name of the app
   * @param {Object} envVars - Environment variables object
   */
  async setEnvVars(appName, envVars) {
    if (!envVars || Object.keys(envVars).length === 0) return;

    try {
      const envVarArgs = [];
      for (const [key, value] of Object.entries(envVars)) {
        envVarArgs.push(`${key}=${value}`);
      }

      const result = await this.executePlatformCommand('config:set', appName, envVarArgs);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to configure environment: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error configuring environment for ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Install platform extensions
   * @param {string} pluginName - The name of the extension to install
   */
  async installPlugin(pluginName) {
    try {
      const result = await this.executePlatformCommand('plugin:install', null, [pluginName]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to install extension: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error installing platform extension ${pluginName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Create a deployment with platform operations (masked internal processes)
   * @param {Deployment} deployment - The deployment object
   * @param {Function} addLog - Function to add logs
   * @param {Function} updateStatus - Function to update status
   */
  async createDeployment(deployment, addLog, updateStatus) {
    try {
      // Initialize platform application
      await addLog('info', 'Initializing application environment...');
      const createResult = await this.createApp(deployment.name);
      await addLog('info', `Application ${deployment.name} initialized successfully`);
      
      // Configure application settings
      if (deployment.envVars && Object.keys(deployment.envVars).length > 0) {
        await addLog('info', 'Configuring application settings...');
        await this.setEnvVars(deployment.name, deployment.envVars);
        await addLog('info', 'Application settings configured');
      }
      
      // Deploy the application (internal process is masked)
      await addLog('deploy', 'Deploying application...');
      await addLog('info', `Cloning repository from ${deployment.repositoryUrl} branch ${deployment.branch || 'main'}...`);
      await this.deployApp(deployment.name, deployment.repositoryUrl, deployment.branch || 'main');
      await addLog('success', 'Application deployment completed');

      // Get the app URL based on the platform
      const appInfo = await this.getAppInfo(deployment.name);
      
      let appDomain = process.env.PLATFORM_DOMAIN || 'your-platform-domain.com';
      
      // Determine the app URL based on the platform
      switch (this.platform) {
        case 'heroku':
          appDomain = process.env.HEROKU_DOMAIN || 'herokuapp.com';
          break;
        case 'vercel':
          appDomain = process.env.VERCEL_DOMAIN || 'vercel.app';
          break;
        case 'dokku':
        default:
          appDomain = process.env.DOKKU_DOMAIN || process.env.PLATFORM_DOMAIN || 'your-platform-domain.com';
          break;
      }
      
      const appUrl = `https://${deployment.name}.${appDomain}`;
      
      // Update deployment with app URL and platform app name
      await deployment.update({
        status: 'deployed',
        appUrl,
        dokkuAppName: deployment.name, // Kept for internal tracking but not exposed in logs
        lastDeployedAt: new Date(),
      });
      
      // Configure container resource limits based on deployment allocation
      try {
        await this.configureContainerResources(deployment.name, {
          ram: deployment.allocatedRAM,
          cpu: deployment.allocatedCPU,
          storage: deployment.allocatedStorage
        });
        
        await addLog('info', `Container resources configured: ${deployment.allocatedRAM}MB RAM, ${deployment.allocatedCPU} CPU core(s), ${deployment.allocatedStorage}GB storage`);
      } catch (resourceError) {
        // Log resource configuration error but don't fail the entire deployment
        await addLog('warning', `Failed to configure container resources: ${resourceError.message}`);
      }
      
      await addLog('success', `Application is now live! Access your app at ${appUrl}`);
      await updateStatus('deployed');
      
      return deployment;
    } catch (error) {
      await addLog('error', `Application deployment failed: ${error.message}`);
      await updateStatus('failed');
      await deployment.update({ status: 'failed' });
      
      throw error;
    }
  }

  /**
   * Restart an application
   * @param {string} appName - The name of the app to restart
   */
  async restartApp(appName) {
    try {
      const result = await this.executePlatformCommand('ps:restart', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to restart app: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error restarting app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Stop an application
   * @param {string} appName - The name of the app to stop
   */
  async stopApp(appName) {
    try {
      const result = await this.executePlatformCommand('ps:stop', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to stop app: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error stopping app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Rebuild an application
   * @param {string} appName - The name of the app to rebuild
   */
  async rebuildApp(appName) {
    try {
      const result = await this.executePlatformCommand('ps:rebuild', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to rebuild app: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error rebuilding app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Scale application processes
   * @param {string} appName - The name of the app to scale
   * @param {Object} scaleConfig - Scale configuration (e.g., {\"web\": 2, \"worker\": 1})
   */
  async scaleApp(appName, scaleConfig) {
    try {
      const scaleCommands = [];
      for (const [processType, count] of Object.entries(scaleConfig)) {
        scaleCommands.push(`${processType}=${count}`);
      }
      
      const result = await this.executePlatformCommand('ps:scale', appName, scaleCommands);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to scale app: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error scaling app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Configure container resource limits (RAM, CPU)
   * @param {string} appName - The name of the app
   * @param {Object} resources - Resource limits configuration
   * @param {number} resources.ram - RAM limit in MB (e.g., 512 for 512MB)
   * @param {number} resources.cpu - CPU limit (e.g., 1 for 1 core)
   * @param {number} resources.storage - Storage limit in GB (e.g., 10 for 10GB)
   */
  async configureContainerResources(appName, resources) {
    try {
      // Note: Dokku uses various plugins for resource management
      // For RAM limits, some use docker-options plugin
      const { ram, cpu, storage } = resources;

      // Configure RAM limits using dokku docker-options if available
      if (ram) {
        // Remove any existing RAM limits for deploy phase
        await this.executePlatformCommand('docker-options:remove', appName, ['deploy', '--memory', `${ram}m`]).catch(() => {});
        // Add new RAM limits for deploy phase
        await this.executePlatformCommand('docker-options:add', appName, ['deploy', '--memory', `${ram}m`]);
        
        // Remove any existing RAM limits for run phase
        await this.executePlatformCommand('docker-options:remove', appName, ['run', '--memory', `${ram}m`]).catch(() => {});
        // Add new RAM limits for run phase
        await this.executePlatformCommand('docker-options:add', appName, ['run', '--memory', `${ram}m`]);
      }

      // Configure CPU limits if specified
      if (cpu) {
        // CPU limits typically use --cpus flag (e.g., --cpus="1.0" for 1 core)
        const cpuLimit = cpu.toString();
        
        // Remove any existing CPU limits for deploy phase
        await this.executePlatformCommand('docker-options:remove', appName, ['deploy', '--cpus', cpuLimit]).catch(() => {});
        // Add new CPU limits for deploy phase
        await this.executePlatformCommand('docker-options:add', appName, ['deploy', '--cpus', cpuLimit]);
        
        // Remove any existing CPU limits for run phase
        await this.executePlatformCommand('docker-options:remove', appName, ['run', '--cpus', cpuLimit]).catch(() => {});
        // Add new CPU limits for run phase
        await this.executePlatformCommand('docker-options:add', appName, ['run', '--cpus', cpuLimit]);
      }

      // Log resource configuration for debugging
      logger.info(`Container resources configured for ${appName}: RAM=${ram}MB, CPU=${cpu} core(s), Storage=${storage}GB`);
      
      // Note: Storage limits are more complex to implement with Dokku
      // Storage limits in Dokku typically require custom volume management or 
      // plugin installations like dokku-storage
    } catch (error) {
      logger.error(`Error configuring container resources for ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get current container resource configuration
   * @param {string} appName - The name of the app
   */
  async getContainerResources(appName) {
    try {
      // Get docker options for the app to see current resource limits
      const result = await this.executePlatformCommand('docker-options', [appName]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to get container resources: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting container resources for ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Update container resource allocation for a running application
   * @param {string} appName - The name of the app
   * @param {Object} resources - Resource limits configuration
   * @param {number} resources.ram - New RAM limit in MB
   * @param {number} resources.cpu - New CPU limit
   * @param {number} resources.storage - New Storage limit in GB
   */
  async updateContainerResources(appName, resources) {
    try {
      // This function is used to update resources for running applications
      // This is typically called when a user upgrades/downgrades their plan
      const { ram, cpu, storage } = resources;

      logger.info(`Updating container resources for ${appName}: RAM=${ram}MB, CPU=${cpu} core(s), Storage=${storage}GB`);
      
      // Configure new resource limits using dokku docker-options
      if (ram) {
        // Remove existing RAM limits
        await this.executePlatformCommand('docker-options:remove', appName, ['deploy', '--memory', `${ram}m`]).catch(() => {});
        await this.executePlatformCommand('docker-options:remove', appName, ['run', '--memory', `${ram}m`]).catch(() => {});
        
        // Add new RAM limits
        await this.executePlatformCommand('docker-options:add', appName, ['deploy', '--memory', `${ram}m`]);
        await this.executePlatformCommand('docker-options:add', appName, ['run', '--memory', `${ram}m`]);
      }

      if (cpu) {
        // Remove existing CPU limits
        const cpuLimit = cpu.toString();
        await this.executePlatformCommand('docker-options:remove', appName, ['deploy', '--cpus', cpuLimit]).catch(() => {});
        await this.executePlatformCommand('docker-options:remove', appName, ['run', '--cpus', cpuLimit]).catch(() => {});
        
        // Add new CPU limits
        await this.executePlatformCommand('docker-options:add', appName, ['deploy', '--cpus', cpuLimit]);
        await this.executePlatformCommand('docker-options:add', appName, ['run', '--cpus', cpuLimit]);
      }

      // Restart app to apply new resource limits
      await this.restartApp(appName);
      
      logger.info(`Container resources updated successfully for ${appName}`);
    } catch (error) {
      logger.error(`Error updating container resources for ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get environment variables for an app
   * @param {string} appName - The name of the app
   * @param {string} key - Specific environment variable key (optional)
   */
  async getEnvVars(appName, key = null) {
    try {
      let result;
      if (key) {
        result = await this.executePlatformCommand('config:get', appName, [key]);
      } else {
        result = await this.executePlatformCommand('config', [appName]);
      }
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to get environment variables: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting environment variables for ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Unset environment variables for an app
   * @param {string} appName - The name of the app
   * @param {Array} keys - Array of environment variable keys to unset
   */
  async unsetEnvVars(appName, keys) {
    try {
      if (!keys || !Array.isArray(keys) || keys.length === 0) return;

      const result = await this.executePlatformCommand('config:unset', appName, keys);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to unset environment variables: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error unsetting environment variables for ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Add domain to application
   * @param {string} appName - The name of the app
   * @param {string} domain - The domain to add
   */
  async addDomain(appName, domain) {
    try {
      const result = await this.executePlatformCommand('domains:add', appName, [domain]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to add domain: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error adding domain to app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Remove domain from application
   * @param {string} appName - The name of the app
   * @param {string} domain - The domain to remove
   */
  async removeDomain(appName, domain) {
    try {
      const result = await this.executePlatformCommand('domains:remove', appName, [domain]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to remove domain: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error removing domain from app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get application domains
   * @param {string} appName - The name of the app
   */
  async getAppDomains(appName) {
    try {
      const result = await this.executePlatformCommand('domains:report', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to get app domains: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting domains for app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Add port mapping to application
   * @param {string} appName - The name of the app
   * @param {string} portMapping - Port mapping in format 'protocol:external:internal' (e.g., 'http:80:5000')
   */
  async addPortMapping(appName, portMapping) {
    try {
      const result = await this.executePlatformCommand('proxy:ports-add', appName, [portMapping]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to add port mapping: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error adding port mapping to app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Remove port mapping from application
   * @param {string} appName - The name of the app
   * @param {string} portMapping - Port mapping in format 'protocol:external:internal'
   */
  async removePortMapping(appName, portMapping) {
    try {
      const result = await this.executePlatformCommand('proxy:ports-remove', appName, [portMapping]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to remove port mapping: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error removing port mapping from app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get application port mappings
   * @param {string} appName - The name of the app
   */
  async getAppPortMappings(appName) {
    try {
      const result = await this.executePlatformCommand('proxy:report', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to get app port mappings: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting port mappings for app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get application logs
   * @param {string} appName - The name of the app
   * @param {number} lines - Number of log lines to retrieve (default: 100)
   */
  async getAppLogs(appName, lines = 100) {
    try {
      const result = await this.executePlatformCommand('logs', appName, [`-n`, lines.toString()]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to get app logs: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting logs for app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Run command in application container
   * @param {string} appName - The name of the app
   * @param {string} command - The command to run
   */
  async runCommand(appName, command) {
    try {
      // Split the command string into an array
      const commandParts = command.split(' ');
      const result = await this.executePlatformCommand('run', appName, commandParts);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to run command: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error running command in app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Sync application directly from git repository
   * @param {string} appName - The name of the app
   * @param {string} gitRepoUrl - Git repository URL
   * @param {string} branch - Branch to sync (default: main)
   */
  async syncAppFromGit(appName, gitRepoUrl, branch = 'main') {
    try {
      const result = await this.executePlatformCommand('git:sync', appName, [gitRepoUrl, branch]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to sync app from git: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error syncing app ${appName} from git: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Purge application build cache
   * @param {string} appName - The name of the app
   */
  async purgeAppCache(appName) {
    try {
      const result = await this.executePlatformCommand('repo:purge-cache', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to purge app cache: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error purging cache for app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Get application network information
   * @param {string} appName - The name of the app
   */
  async getAppNetworkInfo(appName) {
    try {
      const result = await this.executePlatformCommand('network:report', appName);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to get app network info: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error getting network info for app ${appName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * List all applications
   */
  async listApps() {
    try {
      const result = await this.executePlatformCommand('apps');
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to list apps: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error listing apps: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * List all installed plugins
   */
  async listPlugins() {
    try {
      const result = await this.executePlatformCommand('plugin:list');
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to list plugins: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error listing plugins: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Install a plugin
   * @param {string} pluginRepo - Plugin repository URL
   * @param {string} pluginName - Plugin name
   */
  async installPlugin(pluginRepo, pluginName) {
    try {
      const result = await this.executePlatformCommand('plugin:install', null, [pluginRepo, pluginName]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to install plugin: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error installing plugin ${pluginName}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Disable a plugin
   * @param {string} pluginName - Plugin name to disable
   */
  async disablePlugin(pluginName) {
    try {
      const result = await this.executePlatformCommand('plugin:disable', null, [pluginName]);
      
      if (result.exitCode !== 0) {
        throw new Error(`Failed to disable plugin: ${result.stderr}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error disabling plugin ${pluginName}: ${error.message || error}`);
      throw error;
    }
  }
}

// Export a function that creates the service when needed
export default () => new PlatformService();