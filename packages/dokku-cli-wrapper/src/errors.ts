/**
 * Custom error class for Dokku CLI wrapper
 */
export class DokkuError extends Error {
  public readonly command?: string;
  public readonly exitCode?: number;
  public readonly stderr?: string;

  constructor(
    message: string,
    command?: string,
    exitCode?: number,
    stderr?: string
  ) {
    super(message);
    this.name = 'DokkuError';
    this.command = command;
    this.exitCode = exitCode;
    this.stderr = stderr;

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, DokkuError.prototype);
  }
}

/**
 * Error thrown when Dokku CLI is not found
 */
export class DokkuNotFoundError extends DokkuError {
  constructor() {
    super('Dokku CLI not found. Please ensure Dokku is installed and in your PATH.');
    this.name = 'DokkuNotFoundError';
    
    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, DokkuNotFoundError.prototype);
  }
}

/**
 * Error thrown when an app doesn't exist
 */
export class AppNotFoundError extends DokkuError {
  public readonly appName: string;

  constructor(appName: string) {
    super(`App "${appName}" does not exist.`);
    this.name = 'AppNotFoundError';
    this.appName = appName;
    
    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppNotFoundError.prototype);
  }
}