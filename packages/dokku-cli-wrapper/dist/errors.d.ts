/**
 * Custom error class for Dokku CLI wrapper
 */
export declare class DokkuError extends Error {
    readonly command?: string;
    readonly exitCode?: number;
    readonly stderr?: string;
    constructor(message: string, command?: string, exitCode?: number, stderr?: string);
}
/**
 * Error thrown when Dokku CLI is not found
 */
export declare class DokkuNotFoundError extends DokkuError {
    constructor();
}
/**
 * Error thrown when an app doesn't exist
 */
export declare class AppNotFoundError extends DokkuError {
    readonly appName: string;
    constructor(appName: string);
}
//# sourceMappingURL=errors.d.ts.map