import * as shell from 'shelljs';
import { DokkuError, AppNotFoundError } from './errors';

export interface DokkuConfig {
  dokkuPath?: string;
  sshHost?: string;
  sshPort?: string;
  dryRun?: boolean;
}

export interface AppInfo {
  name: string;
  status: string;
  ports: string;
}

export interface AppConfig {
  [key: string]: string;
}

/**
 * A wrapper class for Dokku CLI commands
 */
export class DokkuCLI {
  private config: DokkuConfig;
  private dokkuCommand: string;

  constructor(config: DokkuConfig = {}) {
    this.validateConfig(config);
    
    this.config = {
      dokkuPath: config.dokkuPath || 'dokku',
      sshHost: config.sshHost,
      sshPort: config.sshPort,
      dryRun: config.dryRun || false,
    };

    // Set the dokku command based on configuration
    if (this.config.sshHost) {
      this.dokkuCommand = `ssh ${this.config.sshHost}${this.config.sshPort ? ` -p ${this.config.sshPort}` : ''} -t '${this.config.dokkuPath}'`;
    } else {
      this.dokkuCommand = this.config.dokkuPath!;
    }
    
    // Check if Dokku is available (only if not using SSH)
    if (!this.config.sshHost && !config.dryRun) {
      this.checkDokkuAvailability();
    }
  }

  /**
   * Validates the provided configuration
   */
  private validateConfig(config: DokkuConfig): void {
    if (config.sshPort && isNaN(Number(config.sshPort))) {
      throw new DokkuError('SSH port must be a number');
    }
  }

  /**
   * Checks if Dokku is available in the system
   */
  private checkDokkuAvailability(): void {
    const result = shell.exec(`${this.config.dokkuPath} version`, { silent: true });
    if (result.code !== 0) {
      throw new DokkuError(
        `Dokku CLI not found. Please ensure Dokku is installed and accessible via '${this.config.dokkuPath}'.`,
        'version',
        result.code,
        result.stderr
      );
    }
  }

  /**
   * Sanitizes app names to prevent command injection
   */
  private sanitizeAppName(appName: string): string {
    if (!appName || typeof appName !== 'string') {
      throw new DokkuError('App name must be a non-empty string');
    }
    
    // Only allow alphanumeric characters, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(appName)) {
      throw new DokkuError('App name contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.');
    }
    
    return appName;
  }

  /**
   * Sanitizes config keys to prevent command injection
   */
  private sanitizeConfigKey(key: string): string {
    if (!key || typeof key !== 'string') {
      throw new DokkuError('Config key must be a non-empty string');
    }
    
    // Only allow alphanumeric characters, hyphens, underscores, and colons
    if (!/^[a-zA-Z0-9_:.-]+$/.test(key)) {
      throw new DokkuError('Config key contains invalid characters. Only alphanumeric characters, hyphens, underscores, and colons are allowed.');
    }
    
    return key;
  }

  /**
   * Executes a dokku command
   * @param command The dokku command to execute (e.g., 'apps', 'config:get APP_NAME KEY')
   * @returns Promise containing the command output
   */
  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    const fullCommand = `${this.dokkuCommand} ${command}`;
    
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would execute: ${fullCommand}`);
      return { stdout: '', stderr: '', code: 0 };
    }

    console.log(`Executing: ${fullCommand}`);
    const result = shell.exec(fullCommand, { silent: true });
    
    if (result.code !== 0) {
      throw new DokkuError(
        `Command failed: ${fullCommand}`,
        command,
        result.code,
        result.stderr
      );
    }
    
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code
    };
  }

  /**
   * Lists all Dokku apps
   * @returns Promise containing array of app information
   */
  public async listApps(): Promise<AppInfo[]> {
    const result = await this.executeCommand('apps');
    
    // Parse the output - dokku apps returns a list like:
    // =====> My Apps
    // app1
    // app2
    const lines = result.stdout.trim().split('\n');
    const apps: AppInfo[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('=====')) {
        apps.push({
          name: trimmedLine,
          status: 'unknown', // Dokku doesn't provide status directly with 'apps' command
          ports: 'unknown'   // Ports would need to be retrieved separately
        });
      }
    }

    return apps;
  }

  /**
   * Creates a new Dokku app
   * @param appName Name of the app to create
   * @returns Promise indicating success or failure
   */
  public async createApp(appName: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    await this.executeCommand(`apps:create ${sanitizedAppName}`);
    
    return true;
  }

  /**
   * Deletes a Dokku app
   * @param appName Name of the app to delete
   * @returns Promise indicating success or failure
   */
  public async deleteApp(appName: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    await this.executeCommand(`apps:destroy ${sanitizedAppName} --force`);
    
    return true;
  }

  /**
   * Gets all configuration for an app
   * @param appName Name of the app
   * @returns Promise containing app configuration
   */
  public async getAppConfig(appName: string): Promise<AppConfig> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    const result = await this.executeCommand(`config ${sanitizedAppName}`);
    
    // Parse the config output
    const config: AppConfig = {};
    const lines = result.stdout.trim().split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('=====')) {
        const separatorIndex = trimmedLine.indexOf(':');
        if (separatorIndex > 0) {
          const key = trimmedLine.substring(0, separatorIndex).trim();
          const value = trimmedLine.substring(separatorIndex + 1).trim();
          config[key] = value;
        }
      }
    }

    return config;
  }

  /**
   * Gets a specific configuration value for an app
   * @param appName Name of the app
   * @param key Configuration key to retrieve
   * @returns Promise containing the configuration value
   */
  public async getConfigValue(appName: string, key: string): Promise<string> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    const sanitizedKey = this.sanitizeConfigKey(key);
    
    try {
      const result = await this.executeCommand(`config:get ${sanitizedAppName} ${sanitizedKey}`);
      return result.stdout.trim();
    } catch (error) {
      if (error instanceof DokkuError && error.stderr && error.stderr.includes('not found')) {
        throw new AppNotFoundError(appName);
      }
      throw error;
    }
  }

  /**
   * Sets a configuration value for an app
   * @param appName Name of the app
   * @param key Configuration key to set
   * @param value Configuration value to set
   * @returns Promise indicating success or failure
   */
  public async setConfigValue(appName: string, key: string, value: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    const sanitizedKey = this.sanitizeConfigKey(key);
    
    // Escape the value to prevent command injection
    const escapedValue = `"${value.replace(/"/g, '\\"')}"`;
    
    await this.executeCommand(`config:set ${sanitizedAppName} ${sanitizedKey}=${escapedValue}`);
    
    return true;
  }

  /**
   * Unsets a configuration value for an app
   * @param appName Name of the app
   * @param key Configuration key to unset
   * @returns Promise indicating success or failure
   */
  public async unsetConfigValue(appName: string, key: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    const sanitizedKey = this.sanitizeConfigKey(key);
    
    await this.executeCommand(`config:unset ${sanitizedAppName} ${sanitizedKey}`);
    
    return true;
  }

  /**
   * Checks if an app exists
   * @param appName Name of the app to check
   * @returns Promise containing boolean indicating if app exists
   */
  public async appExists(appName: string): Promise<boolean> {
    try {
      await this.getAppConfig(appName);
      return true;
    } catch (error) {
      if (error instanceof AppNotFoundError) {
        return false;
      }
      // If it's a different error, rethrow it
      throw error;
    }
  }

  /**
   * Restarts an app
   * @param appName Name of the app to restart
   * @returns Promise indicating success or failure
   */
  public async restartApp(appName: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    await this.executeCommand(`ps:restart ${sanitizedAppName}`);
    
    return true;
  }

  /**
   * Stops an app
   * @param appName Name of the app to stop
   * @returns Promise indicating success or failure
   */
  public async stopApp(appName: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    await this.executeCommand(`ps:stop ${sanitizedAppName}`);
    
    return true;
  }

  /**
   * Starts an app
   * @param appName Name of the app to start
   * @returns Promise indicating success or failure
   */
  public async startApp(appName: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    await this.executeCommand(`ps:start ${sanitizedAppName}`);
    
    return true;
  }

  /**
   * Gets logs for an app
   * @param appName Name of the app
   * @param tail Number of lines to tail (optional)
   * @returns Promise containing app logs
   */
  public async getLogs(appName: string, tail?: number): Promise<string> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    const tailParam = tail ? ` --tail ${tail}` : '';
    const result = await this.executeCommand(`logs ${sanitizedAppName}${tailParam}`);
    
    return result.stdout;
  }

  /**
   * Deploys an app from a Git repository
   * @param appName Name of the app to deploy
   * @param gitUrl Git repository URL
   * @returns Promise indicating success or failure
   */
  public async deployApp(appName: string, gitUrl: string): Promise<boolean> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    
    // This is a simplified deployment - in practice, you might want to implement
    // a more sophisticated deployment flow
    await this.executeCommand(`git:from-image ${sanitizedAppName} "${gitUrl}"`);
    
    return true;
  }

  /**
   * Runs a command in the app environment
   * @param appName Name of the app
   * @param command Command to run
   * @returns Promise containing command output
   */
  public async runCommand(appName: string, command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    
    // Escape the command to prevent injection
    const escapedCommand = `"${command.replace(/"/g, '\\"')}"`;
    
    return await this.executeCommand(`run ${sanitizedAppName} ${escapedCommand}`);
  }

  /**
   * Gets information about running processes for an app
   * @param appName Name of the app
   * @returns Promise containing process information
   */
  public async getAppProcesses(appName: string): Promise<string> {
    const sanitizedAppName = this.sanitizeAppName(appName);
    const result = await this.executeCommand(`ps ${sanitizedAppName}`);
    
    return result.stdout;
  }
}