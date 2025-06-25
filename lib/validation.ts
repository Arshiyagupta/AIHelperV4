// Input validation and sanitization utilities

export const validation = {
  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isValidPassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate partner code format
  isValidPartnerCode(code: string): boolean {
    // Partner codes are 6 characters, alphanumeric
    const codeRegex = /^[A-Z0-9]{6}$/;
    return codeRegex.test(code.toUpperCase());
  },

  // Sanitize message content
  sanitizeMessage(content: string): string {
    // Remove excessive whitespace and trim
    return content.trim().replace(/\s+/g, ' ');
  },

  // Check for potentially harmful content
  containsHarmfulContent(content: string): boolean {
    const harmfulPatterns = [
      /\b(kill|murder|hurt|harm|abuse|threat)\b/i,
      /\b(stupid|idiot|worthless|useless)\b/i,
      // Add more patterns as needed
    ];

    return harmfulPatterns.some(pattern => pattern.test(content));
  },

  // Validate name format
  isValidName(name: string): boolean {
    // Names should be 1-50 characters, letters, spaces, hyphens, apostrophes
    const nameRegex = /^[a-zA-Z\s\-']{1,50}$/;
    return nameRegex.test(name.trim());
  }
};