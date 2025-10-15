"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppNotFoundError = exports.DokkuNotFoundError = exports.DokkuError = void 0;
/**
 * Custom error class for Dokku CLI wrapper
 */
class DokkuError extends Error {
    constructor(message, command, exitCode, stderr) {
        super(message);
        this.name = 'DokkuError';
        this.command = command;
        this.exitCode = exitCode;
        this.stderr = stderr;
        // Set prototype explicitly for proper instanceof checks
        Object.setPrototypeOf(this, DokkuError.prototype);
    }
}
exports.DokkuError = DokkuError;
/**
 * Error thrown when Dokku CLI is not found
 */
class DokkuNotFoundError extends DokkuError {
    constructor() {
        super('Dokku CLI not found. Please ensure Dokku is installed and in your PATH.');
        this.name = 'DokkuNotFoundError';
        // Set prototype explicitly for proper instanceof checks
        Object.setPrototypeOf(this, DokkuNotFoundError.prototype);
    }
}
exports.DokkuNotFoundError = DokkuNotFoundError;
/**
 * Error thrown when an app doesn't exist
 */
class AppNotFoundError extends DokkuError {
    constructor(appName) {
        super(`App "${appName}" does not exist.`);
        this.name = 'AppNotFoundError';
        this.appName = appName;
        // Set prototype explicitly for proper instanceof checks
        Object.setPrototypeOf(this, AppNotFoundError.prototype);
    }
}
exports.AppNotFoundError = AppNotFoundError;
//# sourceMappingURL=errors.js.map