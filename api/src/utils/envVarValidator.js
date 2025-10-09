/**
 * Environment variable validation utility to prevent setting dangerous variables
 */

// List of restricted environment variable names that could be dangerous
const RESTRICTED_ENV_VARS = [
  // System environment variables that should not be modified
  'PATH',
  'HOME',
  'USER',
  'USERNAME',
  'SHELL',
  'SUDO_USER',
  'SUDO_UID',
  'SUDO_GID',
  'PWD',
  'OLDPWD',
  'TERM',
  'LANG',
  'LC_*',  // All LC_* variables
  'TZ',
  'HOSTNAME',
  'HOSTTYPE',
  'OSTYPE',
  'MACHTYPE',
  
  // Process and system variables
  'NODE_ENV',
  'NODE_OPTIONS',
  'NPM_CONFIG_*',
  'YARN_*',
  'DEBUG',
  'VERBOSE',
  
  // Platform-specific variables
  'DOKKU_*',
  'HEROKU_*',
  'VERCEL_*',
  'KUBERNETES_*',
  'K8S_*',
  
  // Security-sensitive variables
  'SSH_*',
  'GPG_*',
  'GNUPG_*',
  'PGP_*',
  
  // Credential-related variable patterns
  'PASSWORD',
  'PASS',
  'SECRET',
  'TOKEN',
  'KEY',
  'ACCESS_KEY',
  'SECRET_KEY',
  'API_KEY',
  'API_TOKEN',
  'ACCESS_TOKEN',
  'SECRET_TOKEN',
  'SESSION_SECRET',
  'JWT_SECRET',
  'DATABASE_URL',
  'DB_URL',
  'REDIS_URL',
  'MONGO_URL',
  'MONGODB_URI',
  'POSTGRES_URL',
  
  // Database credentials
  'DB_*',
  'DATABASE_*',
  'MONGO_*',
  'REDIS_*',
  'MYSQL_*',
  'POSTGRES_*',
  'PG_*',
  
  // Common API key patterns
  '_KEY',
  '_TOKEN',
  '_SECRET',
  '_PASSWORD',
  '_PASS',
  '_CREDENTIAL',
  '_CREDS',
  '_AUTH',
  '_ACCESS',
  '_SECRET_ACCESS',
  
  // Application frameworks and libraries
  'APP_KEY',
  'APP_SECRET',
  'APP_ID',
  'CLIENT_ID',
  'CLIENT_SECRET',
  'CONSUMER_KEY',
  'CONSUMER_SECRET',
  'OAUTH_*',
  'TWITTER_*',
  'FACEBOOK_*',
  'GOOGLE_*',
  'GITHUB_*',
  'GITLAB_*',
  'SLACK_*',
  'DISCORD_*',
  'TWILIO_*',
  'STRIPE_*',
  'AWS_*',
  'AZURE_*',
  'GOOGLE_APPLICATION_CREDENTIALS',
  
  // Container/Docker variables
  'DOCKER_*',
  'CONTAINER_*',
  
  // Process management
  'PM2_*',
  'FOREVER_*',
  
  // Configuration
  'CONFIG_*',
  'SETTING_*',
  'SETTING'
];

// Additional patterns for restricted environment variables
const RESTRICTED_PATTERNS = [
  /^PATH$/i,           // Path variable (case insensitive)
  /^HOME$/i,
  /^USER$/i,
  /^NODE_ENV$/i,
  /^DEBUG$/i,
  /^VERBOSE$/i,
  /^HOSTNAME$/i,
  /^HOSTTYPE$/i,
  /^OSTYPE$/i,
  /^MACHTYPE$/i,
  /^LANG$/i,
  /^LC_/i,             // All LC_* variables
  /^TZ$/i,
  /^SUDO_/i,           // All SUDO_* variables
  /.*PASSWORD.*/i,     // Any variable containing "password"
  /.*PASS.*/i,         // Any variable containing "pass"
  /.*SECRET.*/i,       // Any variable containing "secret"
  /.*TOKEN.*/i,        // Any variable containing "token"
  /.*KEY.*/i,          // Any variable containing "key"
  /.*CREDENTIAL.*/i,   // Any variable containing "credential"
  /.*AUTH.*/i,         // Any variable containing "auth"
  /.*ACCESS.*/i,       // Any variable containing "access"
  /.*API.*/i,          // Any variable containing "api"
  /^SSH/i,             // SSH related variables
  /^GPG/i,             // GPG related variables
];

/**
 * Validates an environment variable name to ensure it's not restricted
 * @param {string} envName - The environment variable name to validate
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validateEnvVarName = (envName) => {
  if (!envName || typeof envName !== 'string') {
    return {
      isValid: false,
      reason: 'Environment variable name must be a non-empty string'
    };
  }

  const trimmedName = envName.trim();
  
  if (trimmedName === '') {
    return {
      isValid: false,
      reason: 'Environment variable name cannot be empty'
    };
  }

  // Check against restricted names list
  for (const restricted of RESTRICTED_ENV_VARS) {
    // Handle wildcard patterns (e.g., 'LC_*')
    if (restricted.endsWith('*')) {
      const prefix = restricted.slice(0, -1);  // Remove the '*'
      if (trimmedName.toUpperCase().startsWith(prefix.toUpperCase())) {
        return {
          isValid: false,
          reason: `Environment variable name '${trimmedName}' matches restricted pattern '${restricted}'`
        };
      }
    } else {
      // Exact match check (case-insensitive)
      if (trimmedName.toLowerCase() === restricted.toLowerCase()) {
        return {
          isValid: false,
          reason: `Environment variable name '${trimmedName}' is restricted`
        };
      }
    }
  }

  // Check against regex patterns
  for (const pattern of RESTRICTED_PATTERNS) {
    if (pattern.test(trimmedName)) {
      return {
        isValid: false,
        reason: `Environment variable name '${trimmedName}' matches a restricted pattern`
      };
    }
  }

  // Additional validation: check if name is a valid environment variable name
  // Environment variable names should typically be alphanumeric + underscore, starting with letter
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmedName)) {
    return {
      isValid: false,
      reason: `Environment variable name '${trimmedName}' contains invalid characters`
    };
  }

  return {
    isValid: true,
    reason: 'Environment variable name appears to be valid'
  };
};

/**
 * Validates an environment variable value
 * @param {string} envValue - The environment variable value to validate
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validateEnvVarValue = (envValue) => {
  if (envValue === undefined || envValue === null) {
    return {
      isValid: true,  // Null/undefined values are acceptable
      reason: 'Value is null or undefined, which is acceptable'
    };
  }

  if (typeof envValue !== 'string') {
    return {
      isValid: false,
      reason: 'Environment variable value must be a string'
    };
  }

  // Check for potentially dangerous patterns in values
  const dangerousPatterns = [
    /[\r\n]\s*;/,        // Semicolon after newline (command chaining)
    /[\r\n]\s*&/,        // Ampersand after newline (background process)
    /[\r\n]\s*\|/,       // Pipe after newline
    /[\r\n]\s*`/,        // Backtick after newline
    /[\r\n]\s*\$\([^)]*\)/,  // Command substitution after newline
    /[\r\n]\s*\$[^{]/,   // Dollar followed by non-brace after newline
    /rm\s+-rf/,          // rm -rf pattern
    /chmod\s+\d{3,4}/,   // chmod command pattern
    /chown\s+\S+:\S+/,   // chown command pattern
    /kill\s+/,           // kill command pattern
    /reboot/,            // reboot command
    /shutdown/,          // shutdown command
    /passwd/,            // passwd command
    /useradd/,           // useradd command
    /userdel/,           // userdel command
    /usermod/,           // usermod command
    /sudo\s+/,           // sudo command
    /su\s+/,             // su command
    /eval\s*\(/,         // eval function
    /exec\s*\(/,         // exec function
    /system\s*\(/,       // system function
    /popen\s*\(/,        // popen function
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(envValue)) {
      return {
        isValid: false,
        reason: `Environment variable value contains potentially dangerous pattern: ${pattern}`
      };
    }
  }

  return {
    isValid: true,
    reason: 'Environment variable value appears to be safe'
  };
};

/**
 * Validates a complete environment variable object (name and value)
 * @param {Object} envVar - The environment variable object with name and value
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validateEnvVar = (envVar) => {
  if (!envVar || typeof envVar !== 'object') {
    return {
      isValid: false,
      reason: 'Environment variable must be an object with name and value properties'
    };
  }

  const { name, value } = envVar;

  // Validate name
  const nameValidation = validateEnvVarName(name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  // Validate value
  const valueValidation = validateEnvVarValue(value);
  if (!valueValidation.isValid) {
    return valueValidation;
  }

  return {
    isValid: true,
    reason: 'Environment variable appears to be valid'
  };
};

/**
 * Validates multiple environment variables
 * @param {Object} envVars - Object containing environment variables as key-value pairs
 * @returns {Object} - Object with isValid (boolean), reasons (array), and validEnvVars (object) properties
 */
export const validateEnvVars = (envVars) => {
  if (!envVars || typeof envVars !== 'object') {
    return {
      isValid: false,
      reason: 'Environment variables must be provided as an object',
      reasons: [],
      validEnvVars: {}
    };
  }

  const reasons = [];
  const validEnvVars = {};

  for (const [name, value] of Object.entries(envVars)) {
    const validation = validateEnvVar({ name, value });

    if (validation.isValid) {
      validEnvVars[name] = value;
    } else {
      reasons.push(`Variable "${name}": ${validation.reason}`);
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons,
    validEnvVars,
    reason: reasons.length === 0 ? 'All environment variables are valid' : `Invalid environment variables: ${reasons.join('; ')}`
  };
};

/**
 * Sanitizes an environment variable name
 * @param {string} envName - The environment variable name to sanitize
 * @returns {string} - Sanitized environment variable name
 */
export const sanitizeEnvVarName = (envName) => {
  if (!envName || typeof envName !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters, keeping only alphanumeric and underscore
  const sanitized = envName
    .replace(/[^a-zA-Z0-9_]/g, '')  // Remove any non-alphanumeric characters except underscore
    .replace(/^[^a-zA-Z_]/, '_');   // Ensure it starts with a letter or underscore

  // Validate the sanitized name
  const result = validateEnvVarName(sanitized);
  if (!result.isValid) {
    return '';
  }

  return sanitized;
};

/**
 * Sanitizes an environment variable value
 * @param {string} envValue - The environment variable value to sanitize
 * @returns {string} - Sanitized environment variable value
 */
export const sanitizeEnvVarValue = (envValue) => {
  if (envValue === undefined || envValue === null) {
    return envValue;
  }

  if (typeof envValue !== 'string') {
    return '';
  }

  // Remove potentially dangerous patterns from the value
  let sanitized = envValue
    .replace(/[\r\n]\s*;/g, '')        // Remove semicolons after newlines
    .replace(/[\r\n]\s*&/g, '')        // Remove ampersands after newlines
    .replace(/[\r\n]\s*\|/g, '')       // Remove pipes after newlines
    .replace(/[\r\n]\s*`/g, '')        // Remove backticks after newlines
    .replace(/[\r\n]\s*\$\([^)]*\)/g, '')  // Remove command substitution after newlines
    .replace(/[\r\n]\s*\$[^{]/g, '')   // Remove dollar followed by non-brace after newlines
    .replace(/rm\s+-rf/gi, '')         // Remove rm -rf patterns (case insensitive)
    .replace(/chmod\s+\d{3,4}/gi, '')  // Remove chmod command patterns
    .replace(/chown\s+\S+:\S+/gi, '')  // Remove chown command patterns
    .replace(/kill\s+/gi, '')          // Remove kill command patterns
    .replace(/reboot/gi, '')           // Remove reboot commands
    .replace(/shutdown/gi, '')         // Remove shutdown commands
    .replace(/passwd/gi, '')           // Remove passwd commands
    .replace(/useradd/gi, '')          // Remove useradd commands
    .replace(/userdel/gi, '')          // Remove userdel commands
    .replace(/usermod/gi, '')          // Remove usermod commands
    .replace(/sudo\s+/gi, '')          // Remove sudo commands
    .replace(/su\s+/gi, '')            // Remove su commands
    .replace(/eval\s*\(/g, '')         // Remove eval function calls
    .replace(/exec\s*\(/g, '')         // Remove exec function calls
    .replace(/system\s*\(/g, '')       // Remove system function calls
    .replace(/popen\s*\(/g, '');       // Remove popen function calls

  return sanitized;
};