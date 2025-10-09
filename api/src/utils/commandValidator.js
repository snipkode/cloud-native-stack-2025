/**
 * Command validation utility to prevent dangerous command execution
 */

// Dangerous commands that should be blocked
const DANGEROUS_COMMANDS = [
  'rm -rf',
  'rm -rf /',
  'chmod',
  'chown',
  'kill',
  'pkill',
  'killall',
  'reboot',
  'shutdown',
  'halt',
  'poweroff',
  'passwd',
  'useradd',
  'userdel',
  'usermod',
  'groupadd',
  'groupdel',
  'groupmod',
  'sudo',
  'su',
  'dd',
  'mkfs',
  'mount',
  'umount',
  'ln -s /',
  'cat /etc/shadow',
  'cat /etc/passwd',
  'cat /etc/hosts',
  '/dev/null',
  '>/dev/null',
  '/dev/random',
  '/dev/zero',
  'eval',
  'source',
  '. ',
  'exec',
  'bash -i',
  'sh -i',
  'nc ',
  'netcat ',
  'nmap',
  'wget',
  'curl',
  '>&',
  '>>',
  '|',
  '`',
  '$(',
  'exec(',
  'system(',
  'popen(',
  'os.system(',
  'import os',
  'import subprocess',
  'subprocess.',
  'import sys',
  'sys.',
  'eval(',
  'exec(',
  '__import__('
];

// Allowed safe commands (whitelist approach)
const ALLOWED_COMMANDS = [
  'ls',
  'pwd',
  'echo',
  'cat',
  'head',
  'tail',
  'grep',
  'find',
  'ps',
  'top',
  'df',
  'du',
  'free',
  'whoami',
  'date',
  'env',
  'printenv',
  'node --version',
  'npm --version',
  'git --version',
  'python --version',
  'python3 --version',
  'ls -la',
  'ls -l',
  'ls -a',
  'pwd',
  'echo $',
  'printenv | grep',
  'env | grep',
  'node',
  'npm',
  'yarn',
  'pm2',
  'pm2 list',
  'pm2 status',
  'pm2 logs',
  'pm2 show',
  'git status',
  'git log',
  'git branch',
  'git remote -v',
  'docker ps',
  'docker images',
  'docker logs'
];

/**
 * Validates a command to check if it's safe to execute
 * @param {string} command - The command to validate
 * @returns {Object} - Object with isValid (boolean) and reason (string) properties
 */
export const validateCommand = (command) => {
  if (!command || typeof command !== 'string') {
    return {
      isValid: false,
      reason: 'Command must be a non-empty string'
    };
  }

  // Trim whitespace
  const trimmedCommand = command.trim();
  
  if (trimmedCommand === '') {
    return {
      isValid: false,
      reason: 'Command cannot be empty'
    };
  }

  // Check against dangerous command patterns
  for (const dangerous of DANGEROUS_COMMANDS) {
    // Use case-insensitive check and check if command contains the dangerous pattern
    if (trimmedCommand.toLowerCase().includes(dangerous.toLowerCase())) {
      return {
        isValid: false,
        reason: `Command contains potentially dangerous pattern: ${dangerous}`
      };
    }
  }

  // Additional checks for dangerous patterns
  if (/\s*;\s*/.test(trimmedCommand) ||  // Semicolons for command chaining
      /\s*&\s*/.test(trimmedCommand) ||  // Background processes
      /`.*`/.test(trimmedCommand) ||    // Command substitution
      /\$\([^)]*\)/.test(trimmedCommand) || // Command substitution
      /\$\{.*\}/.test(trimmedCommand)) { // Parameter expansion
    return {
      isValid: false,
      reason: 'Command contains potentially dangerous operators or substitutions'
    };
  }

  // Check if command is in allowed list (whitelist approach)
  const commandParts = trimmedCommand.split(' ');
  const baseCommand = commandParts[0].toLowerCase();
  
  // For more sophisticated applications, you might want to only allow specific commands
  // For now, we'll just block the dangerous ones and allow everything else
  // In a production environment, consider implementing a strict whitelist approach
  
  return {
    isValid: true,
    reason: 'Command appears to be safe'
  };
};

/**
 * Sanitizes command input to remove potentially harmful elements
 * @param {string} command - The command to sanitize
 * @returns {string} - Sanitized command
 */
export const sanitizeCommand = (command) => {
  if (!command || typeof command !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters while preserving the command structure
  let sanitized = command
    .replace(/;/g, '')           // Remove semicolons
    .replace(/\|/g, '')          // Remove pipe operators
    .replace(/`/g, '')           // Remove backticks
    .replace(/\$\([^)]*\)/g, '') // Remove $() command substitution
    .replace(/\$[^{]/g, '')      // Remove $ not followed by {
    .replace(/&/g, '')           // Remove & (backgrounding)
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim();

  // Additional sanitization for system directories
  sanitized = sanitized
    .replace(/\/etc\//g, '')     // Remove /etc/ paths
    .replace(/\/root\//g, '')    // Remove /root/ paths
    .replace(/\/home\/root\//g, '') // Remove /home/root/ paths
    .replace(/~root/g, '')       // Remove ~root patterns

  return sanitized;
};

/**
 * Validates if a command is in the allowed list (strict whitelist approach)
 * @param {string} command - The command to check against whitelist
 * @returns {boolean} - True if command is in allowed list
 */
export const isAllowedCommand = (command) => {
  if (!command || typeof command !== 'string') {
    return false;
  }

  const trimmedCommand = command.trim().toLowerCase();
  
  // Check if the base command (first word) is in the allowed list
  const baseCommand = trimmedCommand.split(' ')[0];
  
  // Direct command check
  if (ALLOWED_COMMANDS.includes(trimmedCommand)) {
    return true;
  }

  // Check if base command is in the list
  return ALLOWED_COMMANDS.some(allowed => {
    if (allowed === baseCommand) {
      return true;
    }
    // Check if the allowed command starts with the base command followed by space
    if (allowed.startsWith(baseCommand + ' ')) {
      return true;
    }
    return false;
  });
};