/**
 * Port validation utility for secure port mapping
 */

// Well-known system ports that should be restricted
const RESTRICTED_PORTS = [
  // System ports (0-1023)
  // These are just examples - in practice, all ports < 1024 are system ports
  1,    // tcpmux
  7,    // echo
  9,    // discard
  13,   // daytime
  19,   // chargen
  20,   // ftp-data
  21,   // ftp
  22,   // ssh
  23,   // telnet
  25,   // smtp
  53,   // dns
  80,   // http
  110,  // pop3
  143,  // imap
  443,  // https
  993,  // imaps
  995,  // pop3s
  
  // Common service ports that should be restricted
  3306, // mysql
  5432, // postgresql
  6379, // redis
  27017, // mongodb
  9200, // elasticsearch
  5601, // kibana
  9090, // prometheus
  3000, // common web app port
  8080, // common web app port
  8443, // common secure web app port
];

// Valid protocols for port mapping
const VALID_PROTOCOLS = ['http', 'https', 'tcp', 'udp'];

/**
 * Validates port mapping format and values
 * Expected format: protocol:external:internal (e.g., 'http:80:5000')
 * @param {string} portMapping - The port mapping to validate
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validatePortMapping = (portMapping) => {
  if (!portMapping || typeof portMapping !== 'string') {
    return {
      isValid: false,
      reason: 'Port mapping must be a non-empty string'
    };
  }

  const trimmedPortMapping = portMapping.trim();
  
  if (trimmedPortMapping === '') {
    return {
      isValid: false,
      reason: 'Port mapping cannot be empty'
    };
  }

  // Split the port mapping into components
  const parts = trimmedPortMapping.split(':');
  
  if (parts.length !== 3) {
    return {
      isValid: false,
      reason: 'Port mapping must have exactly 3 parts: protocol:external:internal'
    };
  }

  const [protocol, externalPort, internalPort] = parts;

  // Validate protocol
  if (!protocol || !VALID_PROTOCOLS.includes(protocol.toLowerCase())) {
    return {
      isValid: false,
      reason: `Invalid protocol: ${protocol}. Valid protocols are: ${VALID_PROTOCOLS.join(', ')}`
    };
  }

  // Validate port numbers
  const extPort = parseInt(externalPort, 10);
  const intPort = parseInt(internalPort, 10);

  // Check if ports are valid numbers
  if (isNaN(extPort) || isNaN(intPort)) {
    return {
      isValid: false,
      reason: 'Port numbers must be valid integers'
    };
  }

  // Check port ranges
  if (extPort < 1 || extPort > 65535) {
    return {
      isValid: false,
      reason: `External port ${extPort} is outside valid range (1-65535)`
    };
  }

  if (intPort < 1 || intPort > 65535) {
    return {
      isValid: false,
      reason: `Internal port ${intPort} is outside valid range (1-65535)`
    };
  }

  // Check for restricted ports
  // External ports should not be system ports for security reasons
  if (extPort < 1024) {
    if (RESTRICTED_PORTS.includes(extPort)) {
      return {
        isValid: false,
        reason: `External port ${extPort} is a restricted system port`
      };
    }
  }

  // Internal ports should be checked as well, but may be more permissive
  if (intPort < 1024 && RESTRICTED_PORTS.includes(intPort)) {
    return {
      isValid: false,
      reason: `Internal port ${intPort} is a restricted system port`
    };
  }

  // Additional security check: prevent mapping to very common service ports
  if (extPort === 22 || extPort === 23 || extPort === 25) { // SSH, Telnet, SMTP
    return {
      isValid: false,
      reason: `External port ${extPort} is a restricted service port`
    };
  }

  return {
    isValid: true,
    reason: 'Port mapping appears to be valid'
  };
};

/**
 * Validates multiple port mappings
 * @param {Array} portMappings - Array of port mappings to validate
 * @returns {Object} - Object with isValid (boolean) and results (array) properties
 */
export const validatePortMappings = (portMappings) => {
  if (!Array.isArray(portMappings)) {
    return {
      isValid: false,
      reason: 'Port mappings must be an array',
      results: []
    };
  }

  const results = portMappings.map(portMapping => validatePortMapping(portMapping));
  const isValid = results.every(result => result.isValid);

  return {
    isValid,
    results,
    reason: isValid ? 'All port mappings are valid' : 'Some port mappings are invalid'
  };
};

/**
 * Validates that there are no conflicting port mappings
 * @param {Array} portMappings - Array of port mappings to check for conflicts
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validatePortMappingConflicts = (portMappings) => {
  if (!Array.isArray(portMappings)) {
    return {
      isValid: false,
      reason: 'Port mappings must be an array'
    };
  }

  const externalPorts = new Set();
  const internalPorts = new Set();

  for (const portMapping of portMappings) {
    const validation = validatePortMapping(portMapping);
    if (!validation.isValid) {
      return validation;
    }

    const parts = portMapping.split(':');
    if (parts.length !== 3) {
      continue; // This should have been caught by validatePortMapping
    }

    const [, externalPort, internalPort] = parts;
    
    // Check for duplicate external ports
    if (externalPorts.has(externalPort)) {
      return {
        isValid: false,
        reason: `External port ${externalPort} is mapped multiple times`
      };
    }
    
    // Check for duplicate internal ports
    if (internalPorts.has(internalPort)) {
      return {
        isValid: false,
        reason: `Internal port ${internalPort} is mapped multiple times`
      };
    }

    externalPorts.add(externalPort);
    internalPorts.add(internalPort);
  }

  return {
    isValid: true,
    reason: 'No port mapping conflicts detected'
  };
};

/**
 * Sanitizes port mapping input to remove potentially harmful elements
 * @param {string} portMapping - The port mapping to sanitize
 * @returns {string} - Sanitized port mapping
 */
export const sanitizePortMapping = (portMapping) => {
  if (!portMapping || typeof portMapping !== 'string') {
    return '';
  }

  const sanitized = portMapping
    .replace(/[^\w\d:.-]/g, '')  // Remove any non-alphanumeric characters except colon/dash/dot
    .replace(/\s+/g, '')         // Remove all whitespace
    .toLowerCase();              // Convert to lowercase

  // Validate the sanitized port mapping
  const result = validatePortMapping(sanitized);
  if (!result.isValid) {
    return '';
  }

  return sanitized;
};