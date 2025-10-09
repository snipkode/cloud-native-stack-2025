/**
 * Domain validation utility to prevent malicious domain registration
 */

// Regular expression for validating domain names
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// List of restricted or potentially malicious domain patterns
const RESTRICTED_DOMAINS = [
  // IP addresses
  '127.0.0.1',
  'localhost',
  '0.0.0.0',
  
  // Internal domains that should not be accessible
  'internal',
  'private',
  'local',
  'docker',
  'kubernetes',
  'k8s',
  'svc',
  'cluster',
  'localdomain',
  
  // Common system domains
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'localhost6',
  'ip6-allnodes',
  'ip6-allrouters',
  
  // Platform-related domains that might be internal
  'platform',
  'admin',
  'system',
  'root',
  'master',
  'worker',
  
  // Common infrastructure domains
  'database',
  'db',
  'redis',
  'memcached',
  'elasticsearch',
  'kibana',
  'prometheus',
  'grafana',
  'monitoring',
  'metrics'
];

/**
 * Validates a domain name to ensure it's properly formatted and not restricted
 * @param {string} domain - The domain to validate
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validateDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return {
      isValid: false,
      reason: 'Domain must be a non-empty string'
    };
  }

  const trimmedDomain = domain.trim().toLowerCase();
  
  if (trimmedDomain === '') {
    return {
      isValid: false,
      reason: 'Domain cannot be empty'
    };
  }

  // Check length constraints
  if (trimmedDomain.length > 253) {
    return {
      isValid: false,
      reason: 'Domain name is too long (max 253 characters)'
    };
  }

  // Check against restricted domains
  if (RESTRICTED_DOMAINS.some(restricted => trimmedDomain.includes(restricted))) {
    return {
      isValid: false,
      reason: `Domain contains a restricted pattern: ${trimmedDomain}`
    };
  }

  // Validate domain format using regex
  if (!DOMAIN_REGEX.test(trimmedDomain)) {
    return {
      isValid: false,
      reason: 'Domain name format is invalid'
    };
  }

  // Split domain into parts and validate each part
  const parts = trimmedDomain.split('.');
  
  if (parts.length < 2) {
    return {
      isValid: false,
      reason: 'Domain must contain at least one dot (e.g., example.com)'
    };
  }

  // Validate each part of the domain
  for (const part of parts) {
    if (part.length === 0) {
      return {
        isValid: false,
        reason: 'Domain contains empty parts (e.g., double dots)'
      };
    }

    if (part.length > 63) {
      return {
        isValid: false,
        reason: `Domain part '${part}' is too long (max 63 characters)`
      };
    }

    // Check if part starts or ends with hyphen
    if (part.startsWith('-') || part.endsWith('-')) {
      return {
        isValid: false,
        reason: `Domain part '${part}' cannot start or end with a hyphen`
      };
    }
  }

  // Additional checks for IP addresses
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedDomain);
  if (isIpAddress) {
    // Validate each octet
    const octets = trimmedDomain.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        return {
          isValid: false,
          reason: 'Invalid IP address format'
        };
      }
    }
    
    // If domain looks like an IP address, it might be restricted
    if (['127.0.0.1', '0.0.0.0'].includes(trimmedDomain)) {
      return {
        isValid: false,
        reason: 'Restricted IP address'
      };
    }
  }

  return {
    isValid: true,
    reason: 'Domain appears to be valid'
  };
};

/**
 * Sanitizes domain input to remove potentially harmful elements
 * @param {string} domain - The domain to sanitize
 * @returns {string} - Sanitized domain
 */
export const sanitizeDomain = (domain) => {
  if (!domain || typeof domain !== 'string') {
    return '';
  }

  let sanitized = domain.trim();
  
  // Remove potentially dangerous characters
  sanitized = sanitized
    .replace(/[^a-zA-Z0-9.-]/g, '')  // Only allow alphanumeric, dots, and hyphens
    .replace(/\.{2,}/g, '.')          // Replace multiple dots with a single dot
    .replace(/-+/g, '-');             // Replace multiple hyphens with a single hyphen

  // Validate the sanitized domain
  const result = validateDomain(sanitized);
  if (!result.isValid) {
    return '';
  }

  return sanitized.toLowerCase();
};

/**
 * Validates if a domain is allowed in the specific context (for API use)
 * @param {string} domain - The domain to validate
 * @param {Array} allowedDomains - Optional array of allowed domains
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validateDomainWithContext = (domain, allowedDomains = null) => {
  // First, run the standard validation
  const standardValidation = validateDomain(domain);
  if (!standardValidation.isValid) {
    return standardValidation;
  }

  // If allowed domains are specified, check against them
  if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
    const domainLower = domain.toLowerCase();
    
    // Check if the exact domain or the main domain is in the allowed list
    const isAllowed = allowedDomains.some(allowed => {
      const allowedLower = allowed.toLowerCase();
      return domainLower === allowedLower || domainLower.endsWith('.' + allowedLower);
    });

    if (!isAllowed) {
      return {
        isValid: false,
        reason: `Domain ${domain} is not in the allowed domains list`
      };
    }
  }

  return {
    isValid: true,
    reason: 'Domain is valid and allowed in this context'
  };
};