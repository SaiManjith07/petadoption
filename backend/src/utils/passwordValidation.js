/**
 * Password Validation Utilities
 * Ensures strong password requirements
 */

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required',
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: 'Password must not exceed 128 characters',
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character',
    };
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password',
    'password123',
    '12345678',
    'qwerty123',
    'admin123',
    'letmein',
    'welcome123',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      valid: false,
      error: 'Password is too common. Please choose a stronger password',
    };
  }

  return {
    valid: true,
  };
};

/**
 * Check if password contains user information (name, email)
 */
export const checkPasswordForUserInfo = (password, name, email) => {
  if (!password || !name || !email) {
    return {
      valid: true, // Can't check if info is missing
    };
  }

  const passwordLower = password.toLowerCase();
  const nameLower = name.toLowerCase();
  const emailLower = email.toLowerCase();
  const emailUsername = emailLower.split('@')[0];

  // Check if password contains name
  if (nameLower.length >= 3 && passwordLower.includes(nameLower)) {
    return {
      valid: false,
      error: 'Password cannot contain your name',
    };
  }

  // Check if password contains email username
  if (emailUsername.length >= 3 && passwordLower.includes(emailUsername)) {
    return {
      valid: false,
      error: 'Password cannot contain your email',
    };
  }

  return {
    valid: true,
  };
};


