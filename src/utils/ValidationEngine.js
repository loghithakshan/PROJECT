/**
 * Advanced Custom Validation System
 * Type validation, sanitization, business logic validation
 */

class ValidationEngine {
  constructor() {
    this.validators = new Map();
    this.sanitizers = new Map();
    this.rules = {};
  }

  /**
   * Register custom validator
   */
  registerValidator(name, validatorFn) {
    this.validators.set(name, validatorFn);
  }

  /**
   * Register custom sanitizer
   */
  registerSanitizer(name, sanitizerFn) {
    this.sanitizers.set(name, sanitizerFn);
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate password strength
   */
  isStrongPassword(password) {
    const specs = {
      minLength: 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password)
    };

    return {
      valid: password.length >= specs.minLength && 
             specs.hasUppercase && 
             specs.hasLowercase && 
             specs.hasNumbers && 
             specs.hasSpecialChar,
      specifications: specs
    };
  }

  /**
   * Validate phone number (international)
   */
  isValidPhone(phone) {
    const regex = /^\+?[\d\s\-()]{10,}$/;
    return regex.test(phone);
  }

  /**
   * Validate geographic coordinates
   */
  isValidCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    return {
      valid: latitude >= -90 && latitude <= 90 && 
             longitude >= -180 && longitude <= 180,
      latitude,
      longitude
    };
  }

  /**
   * Validate array of objects against schema
   */
  validateArray(data, schema) {
    if (!Array.isArray(data)) {
      return { valid: false, error: 'Expected array' };
    }

    const errors = [];
    const validated = data.map((item, index) => {
      const result = this.validateObject(item, schema);
      if (!result.valid) {
        errors.push({ index, errors: result.errors });
      }
      return result.data;
    });

    return {
      valid: errors.length === 0,
      data: validated,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate object against schema
   */
  validateObject(data, schema) {
    const errors = {};
    const validated = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      const fieldErrors = this._validateField(value, rules, key);

      if (fieldErrors) {
        errors[key] = fieldErrors;
      } else {
        validated[key] = this._sanitizeValue(value, rules.sanitize);
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      data: validated,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Validate single field
   */
  _validateField(value, rules, fieldName) {
    const errors = [];

    // Required check
    if (rules.required && !value) {
      errors.push(`${fieldName} is required`);
      return errors;
    }

    if (!value) return null;

    // Type check
    if (rules.type) {
      if (typeof value !== rules.type) {
        errors.push(`${fieldName} must be of type ${rules.type}`);
      }
    }

    // Length check for strings
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must not exceed ${rules.maxLength} characters`);
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }

    // Custom validator
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors.length > 0 ? errors : null;
  }

  /**
   * Sanitize value
   */
  _sanitizeValue(value, sanitizeRules) {
    if (!sanitizeRules) return value;

    let sanitized = value;

    if (sanitizeRules.trim && typeof sanitized === 'string') {
      sanitized = sanitized.trim();
    }

    if (sanitizeRules.lowercase && typeof sanitized === 'string') {
      sanitized = sanitized.toLowerCase();
    }

    if (sanitizeRules.uppercase && typeof sanitized === 'string') {
      sanitized = sanitized.toUpperCase();
    }

    return sanitized;
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeHTML(input) {
    const htmlSpecialChars = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };

    return String(input).replace(/[&<>"']/g, char => htmlSpecialChars[char]);
  }

  /**
   * Validate JSON Web Token structure
   */
  isValidJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      for (const part of parts) {
        Buffer.from(part, 'base64').toString('utf8');
      }
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new ValidationEngine();
