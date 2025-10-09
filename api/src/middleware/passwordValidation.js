/**
 * Password validation utility functions
 */

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter  
 * - Contains at least one number
 * - Contains at least one special character
 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required']
    };
  }

  const errors = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?/)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Express middleware for password strength validation
 */
export const passwordStrengthValidator = (field = 'password') => {
  return (req, res, next) => {
    const password = req.body[field];
    
    const validation = validatePasswordStrength(password);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: validation.errors
      });
    }
    
    next();
  };
};