import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Encryption key should be provided through environment variable
const ENCRYPTION_KEY = process.env.ENV_VAR_ENCRYPTION_KEY || process.env.JWT_SECRET;

if (!ENCRYPTION_KEY) {
  console.warn('Warning: ENV_VAR_ENCRYPTION_KEY not set. Environment variable encryption disabled.');
}

// Use a fixed initialization vector for consistent encryption/decryption
// In production, you might want to store IVs with the encrypted data
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Checks if environment variable encryption is enabled
 * @returns {boolean} - True if encryption is enabled
 */
export const isEncryptionEnabled = () => {
  return !!ENCRYPTION_KEY;
};

/**
 * Encrypts a value using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text as base64
 */
export const encryptValue = (text) => {
  if (!isEncryptionEnabled()) {
    // If encryption is not enabled, return the original text
    return text;
  }

  if (!text) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    const encryptedData = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(encryptedData).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt environment variable value');
  }
};

/**
 * Decrypts a value using AES-256-CBC
 * @param {string} encryptedText - The base64 encoded encrypted text
 * @returns {string} - The decrypted text
 */
export const decryptValue = (encryptedText) => {
  if (!isEncryptionEnabled() || !encryptedText) {
    // If encryption is not enabled, return the original text
    return encryptedText;
  }

  try {
    // Decode from base64
    const decodedData = Buffer.from(encryptedText, 'base64').toString('utf8');
    
    // Extract IV and encrypted data
    const parts = decodedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Decrypt
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt environment variable value');
  }
};

/**
 * Encrypts sensitive environment variables in an object
 * @param {Object} envVars - Object containing environment variables
 * @param {Array} sensitiveKeys - Array of keys that should be encrypted
 * @returns {Object} - Object with sensitive values encrypted
 */
export const encryptSensitiveEnvVars = (envVars, sensitiveKeys = []) => {
  if (!isEncryptionEnabled()) {
    // If encryption is not enabled, return the original object
    return envVars;
  }

  if (!envVars || typeof envVars !== 'object') {
    return envVars;
  }

  const result = { ...envVars };

  for (const [key, value] of Object.entries(result)) {
    // Always encrypt if it's in the sensitive keys list, or if it contains sensitive patterns
    if (sensitiveKeys.includes(key.toUpperCase()) || 
        key.toUpperCase().includes('KEY') || 
        key.toUpperCase().includes('SECRET') || 
        key.toUpperCase().includes('TOKEN') || 
        key.toUpperCase().includes('PASSWORD') || 
        key.toUpperCase().includes('PASS') ||
        key.toUpperCase().includes('CREDENTIAL') ||
        key.toUpperCase().includes('AUTH')) {
      if (typeof value === 'string') {
        result[key] = encryptValue(value);
      }
    }
  }

  return result;
};

/**
 * Decrypts sensitive environment variables in an object
 * @param {Object} envVars - Object containing environment variables (some encrypted)
 * @returns {Object} - Object with sensitive values decrypted
 */
export const decryptSensitiveEnvVars = (envVars) => {
  if (!isEncryptionEnabled()) {
    // If encryption is not enabled, return the original object
    return envVars;
  }

  if (!envVars || typeof envVars !== 'object') {
    return envVars;
  }

  const result = { ...envVars };

  for (const [key, value] of Object.entries(result)) {
    // Try to decrypt if it appears to be encrypted (base64 encoded with IV separator)
    if (typeof value === 'string') {
      // Check if this could be an encrypted value (base64 string containing ':')
      if (value && value.includes('==') && value.includes(':')) { // Basic check for base64 with IV separator
        try {
          result[key] = decryptValue(value);
        } catch (e) {
          // If decryption fails, leave the value as is
          // This could be a non-encrypted value that just happens to match our pattern
          result[key] = value;
        }
      }
    }
  }

  return result;
};

/**
 * Identifies potentially sensitive environment variable names
 * @param {string} key - The environment variable name
 * @returns {boolean} - True if the key is likely sensitive
 */
export const isSensitiveEnvVar = (key) => {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const upperKey = key.toUpperCase();
  
  // Check for sensitive patterns
  return (
    upperKey.includes('KEY') || 
    upperKey.includes('SECRET') || 
    upperKey.includes('TOKEN') || 
    upperKey.includes('PASSWORD') || 
    upperKey.includes('PASS') ||
    upperKey.includes('CREDENTIAL') ||
    upperKey.includes('AUTH') ||
    upperKey.includes('API') ||
    upperKey.includes('OAUTH') ||
    upperKey.startsWith('JWT_') ||
    upperKey.startsWith('DB_') ||
    upperKey.startsWith('DATABASE_') ||
    upperKey.startsWith('REDIS_') ||
    upperKey.startsWith('MONGO_') ||
    upperKey.startsWith('AWS_') ||
    upperKey.startsWith('GOOGLE_') ||
    upperKey.startsWith('FACEBOOK_') ||
    upperKey.startsWith('TWITTER_') ||
    upperKey.startsWith('GITHUB_') ||
    upperKey.startsWith('GITLAB_') ||
    upperKey.startsWith('SLACK_') ||
    upperKey.startsWith('DISCORD_') ||
    upperKey.startsWith('TWILIO_') ||
    upperKey.startsWith('STRIPE_')
  );
};

/**
 * Processes environment variables for storage - encrypts sensitive ones
 * @param {Object} envVars - Object containing environment variables
 * @returns {Object} - Object with sensitive values encrypted for storage
 */
export const processEnvVarsForStorage = (envVars) => {
  if (!envVars || typeof envVars !== 'object') {
    return envVars;
  }

  const result = {};
  
  for (const [key, value] of Object.entries(envVars)) {
    if (isSensitiveEnvVar(key) && typeof value === 'string') {
      result[key] = isEncryptionEnabled() ? encryptValue(value) : value;
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Processes environment variables for retrieval - decrypts sensitive ones
 * @param {Object} envVars - Object containing environment variables (some encrypted)
 * @returns {Object} - Object with sensitive values decrypted
 */
export const processEnvVarsForRetrieval = (envVars) => {
  return decryptSensitiveEnvVars(envVars);
};