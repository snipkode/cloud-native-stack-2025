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
export declare class DokkuCLI {
    private config;
    private dokkuCommand;
    constructor(config?: DokkuConfig);
    /**
     * Validates the provided configuration
     */
    private validateConfig;
    /**
     * Checks if Dokku is available in the system
     */
    private checkDokkuAvailability;
    /**
     * Sanitizes app names to prevent command injection
     */
    private sanitizeAppName;
    /**
     * Sanitizes config keys to prevent command injection
     */
    private sanitizeConfigKey;
    /**
     * Executes a dokku command
     * @param command The dokku command to execute (e.g., 'apps', 'config:get APP_NAME KEY')
     * @returns Promise containing the command output
     */
    private executeCommand;
    /**
     * Lists all Dokku apps
     * @returns Promise containing array of app information
     */
    listApps(): Promise<AppInfo[]>;
    /**
     * Creates a new Dokku app
     * @param appName Name of the app to create
     * @returns Promise indicating success or failure
     */
    createApp(appName: string): Promise<boolean>;
    /**
     * Deletes a Dokku app
     * @param appName Name of the app to delete
     * @returns Promise indicating success or failure
     */
    deleteApp(appName: string): Promise<boolean>;
    /**
     * Gets all configuration for an app
     * @param appName Name of the app
     * @returns Promise containing app configuration
     */
    getAppConfig(appName: string): Promise<AppConfig>;
    /**
     * Gets a specific configuration value for an app
     * @param appName Name of the app
     * @param key Configuration key to retrieve
     * @returns Promise containing the configuration value
     */
    getConfigValue(appName: string, key: string): Promise<string>;
    /**
     * Sets a configuration value for an app
     * @param appName Name of the app
     * @param key Configuration key to set
     * @param value Configuration value to set
     * @returns Promise indicating success or failure
     */
    setConfigValue(appName: string, key: string, value: string): Promise<boolean>;
    /**
     * Unsets a configuration value for an app
     * @param appName Name of the app
     * @param key Configuration key to unset
     * @returns Promise indicating success or failure
     */
    unsetConfigValue(appName: string, key: string): Promise<boolean>;
    /**
     * Checks if an app exists
     * @param appName Name of the app to check
     * @returns Promise containing boolean indicating if app exists
     */
    appExists(appName: string): Promise<boolean>;
    /**
     * Restarts an app
     * @param appName Name of the app to restart
     * @returns Promise indicating success or failure
     */
    restartApp(appName: string): Promise<boolean>;
    /**
     * Stops an app
     * @param appName Name of the app to stop
     * @returns Promise indicating success or failure
     */
    stopApp(appName: string): Promise<boolean>;
    /**
     * Starts an app
     * @param appName Name of the app to start
     * @returns Promise indicating success or failure
     */
    startApp(appName: string): Promise<boolean>;
    /**
     * Gets logs for an app
     * @param appName Name of the app
     * @param tail Number of lines to tail (optional)
     * @returns Promise containing app logs
     */
    getLogs(appName: string, tail?: number): Promise<string>;
    /**
     * Deploys an app from a Git repository
     * @param appName Name of the app to deploy
     * @param gitUrl Git repository URL
     * @returns Promise indicating success or failure
     */
    deployApp(appName: string, gitUrl: string): Promise<boolean>;
    /**
     * Runs a command in the app environment
     * @param appName Name of the app
     * @param command Command to run
     * @returns Promise containing command output
     */
    runCommand(appName: string, command: string): Promise<{
        stdout: string;
        stderr: string;
        code: number;
    }>;
    /**
     * Gets information about running processes for an app
     * @param appName Name of the app
     * @returns Promise containing process information
     */
    getAppProcesses(appName: string): Promise<string>;
}
//# sourceMappingURL=DokkuCLI.d.ts.map