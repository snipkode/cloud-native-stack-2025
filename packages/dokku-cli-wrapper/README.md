# Dokku CLI Wrapper

A Node.js wrapper for Dokku CLI commands that makes it easy to manage Dokku applications programmatically.

## Installation

```bash
npm install dokku-cli-wrapper
```

## Usage

### Basic Usage

```typescript
import { DokkuCLI } from 'dokku-cli-wrapper';

// Initialize the wrapper
const dokku = new DokkuCLI();

// List all apps
const apps = await dokku.listApps();
console.log(apps);

// Create a new app
await dokku.createApp('my-new-app');

// Get app configuration
const config = await dokku.getAppConfig('my-app');
console.log(config);

// Set a configuration value
await dokku.setConfigValue('my-app', 'NODE_ENV', 'production');

// Restart an app
await dokku.restartApp('my-app');
```

### Using with SSH (for remote Dokku server)

```typescript
import { DokkuCLI } from 'dokku-cli-wrapper';

// Initialize the wrapper with SSH configuration
const dokku = new DokkuCLI({
  sshHost: 'your-dokku-server.com',
  sshPort: '22',
  dokkuPath: 'dokku' // Path to dokku on the remote server
});

// Now all commands will be executed on the remote server
const apps = await dokku.listApps();
console.log(apps);
```

### Dry Run Mode

```typescript
import { DokkuCLI } from 'dokku-cli-wrapper';

// Initialize in dry-run mode to see what commands would be executed
const dokku = new DokkuCLI({
  dryRun: true
});

// This will only log what would be executed, without actually running the command
await dokku.createApp('test-app'); // Logs: [DRY RUN] Would execute: dokku apps:create test-app
```

## API Reference

### `new DokkuCLI(config?: DokkuConfig)`

Initializes a new instance of the Dokku CLI wrapper.

**Parameters:**
- `config` (optional): Configuration object
  - `dokkuPath`: Path to the dokku executable (default: 'dokku')
  - `sshHost`: SSH host for remote dokku server (optional)
  - `sshPort`: SSH port (default: 22 if sshHost is provided)
  - `dryRun`: Whether to run in dry-run mode (default: false)

### `listApps(): Promise<AppInfo[]>`

Lists all Dokku apps.

**Returns:** Promise resolving to an array of AppInfo objects.

### `createApp(appName: string): Promise<boolean>`

Creates a new Dokku app.

**Parameters:**
- `appName`: Name of the app to create

**Returns:** Promise resolving to true on success.

### `deleteApp(appName: string): Promise<boolean>`

Deletes a Dokku app.

**Parameters:**
- `appName`: Name of the app to delete

**Returns:** Promise resolving to true on success.

### `getAppConfig(appName: string): Promise<AppConfig>`

Gets all configuration for an app.

**Parameters:**
- `appName`: Name of the app

**Returns:** Promise resolving to a config object.

### `getConfigValue(appName: string, key: string): Promise<string>`

Gets a specific configuration value for an app.

**Parameters:**
- `appName`: Name of the app
- `key`: Configuration key to retrieve

**Returns:** Promise resolving to the configuration value.

### `setConfigValue(appName: string, key: string, value: string): Promise<boolean>`

Sets a configuration value for an app.

**Parameters:**
- `appName`: Name of the app
- `key`: Configuration key to set
- `value`: Configuration value to set

**Returns:** Promise resolving to true on success.

### `unsetConfigValue(appName: string, key: string): Promise<boolean>`

Unsets a configuration value for an app.

**Parameters:**
- `appName`: Name of the app
- `key`: Configuration key to unset

**Returns:** Promise resolving to true on success.

### `appExists(appName: string): Promise<boolean>`

Checks if an app exists.

**Parameters:**
- `appName`: Name of the app to check

**Returns:** Promise resolving to a boolean indicating if the app exists.

### `restartApp(appName: string): Promise<boolean>`

Restarts an app.

**Parameters:**
- `appName`: Name of the app to restart

**Returns:** Promise resolving to true on success.

### `stopApp(appName: string): Promise<boolean>`

Stops an app.

**Parameters:**
- `appName`: Name of the app to stop

**Returns:** Promise resolving to true on success.

### `startApp(appName: string): Promise<boolean>`

Starts an app.

**Parameters:**
- `appName`: Name of the app to start

**Returns:** Promise resolving to true on success.

### `getLogs(appName: string, tail?: number): Promise<string>`

Gets logs for an app.

**Parameters:**
- `appName`: Name of the app
- `tail` (optional): Number of lines to tail

**Returns:** Promise resolving to the log output as a string.

### `deployApp(appName: string, gitUrl: string): Promise<boolean>`

Deploys an app from a Git repository (simplified deployment).

**Parameters:**
- `appName`: Name of the app to deploy
- `gitUrl`: Git repository URL

**Returns:** Promise resolving to true on success.

### `runCommand(appName: string, command: string): Promise<{ stdout: string; stderr: string; code: number }>`

Runs a command in the app environment.

**Parameters:**
- `appName`: Name of the app
- `command`: Command to run

**Returns:** Promise resolving to an object with stdout, stderr, and exit code.

### `getAppProcesses(appName: string): Promise<string>`

Gets information about running processes for an app.

**Parameters:**
- `appName`: Name of the app

**Returns:** Promise resolving to process information as a string.

## Error Handling

The library provides custom error classes:

- `DokkuError`: Base error class for all Dokku-related errors
- `DokkuNotFoundError`: Thrown when the Dokku CLI is not found
- `AppNotFoundError`: Thrown when an app doesn't exist

Example error handling:

```typescript
import { DokkuCLI, AppNotFoundError } from 'dokku-cli-wrapper';

const dokku = new DokkuCLI();

try {
  const config = await dokku.getConfigValue('nonexistent-app', 'KEY');
} catch (error) {
  if (error instanceof AppNotFoundError) {
    console.log('App does not exist');
  } else if (error instanceof DokkuError) {
    console.error('Dokku error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```