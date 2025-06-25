// App-wide constants

export const CONSTANTS = {
  // API Configuration
  MAX_MESSAGE_LENGTH: 500,
  MAX_PROPOSAL_ATTEMPTS: 5,
  MEDIATOR_SCORE_THRESHOLD: 0.8,
  
  // UI Configuration
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  
  // Issue Status
  ISSUE_STATUS: {
    IN_PROGRESS: 'in_progress',
    PROPOSAL_SENT: 'proposal_sent',
    RESOLVED: 'resolved',
    HALTED: 'halted'
  } as const,
  
  // Notification Types
  NOTIFICATION_TYPES: {
    NEW_ISSUE: 'new_issue',
    PROPOSAL_READY: 'proposal_ready',
    ISSUE_RESOLVED: 'issue_resolved'
  } as const,
  
  // AI Agent Types
  AI_AGENTS: {
    PARTNER_AI: 'partner_ai',
    MEDIATOR_AI: 'mediator_ai'
  } as const,
  
  // Error Messages
  ERRORS: {
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    PARTNER_ALREADY_CONNECTED: 'You are already connected to a partner.',
    INVALID_PARTNER_CODE: 'Invalid partner code. Please check and try again.',
    ISSUE_LIMIT_REACHED: 'Please resolve your current issue before starting a new one.',
    RED_FLAG_DETECTED: 'Your message contains concerning content. Please consider seeking professional help.'
  } as const,
  
  // Success Messages
  SUCCESS: {
    PARTNER_CONNECTED: 'Successfully connected with your co-parent!',
    ISSUE_CREATED: 'New issue started successfully.',
    MESSAGE_SENT: 'Message sent successfully.',
    PROPOSAL_SUBMITTED: 'Your vote has been recorded.',
    ISSUE_RESOLVED: 'Issue has been successfully resolved!',
    PROFILE_UPDATED: 'Profile updated successfully.'
  } as const,
  
  // External Resources
  RESOURCES: {
    DOMESTIC_VIOLENCE_HOTLINE: '1-800-799-7233',
    CRISIS_TEXT_LINE: '741741',
    CHILD_ABUSE_HOTLINE: '1-800-422-4453',
    EMERGENCY: '911'
  } as const,
  
  // App Configuration
  APP: {
    NAME: 'SafeTalk',
    VERSION: '1.0.0',
    SUPPORT_EMAIL: 'support@safetalk.app',
    PRIVACY_POLICY_URL: 'https://safetalk.app/privacy',
    TERMS_OF_SERVICE_URL: 'https://safetalk.app/terms'
  } as const
};

// Type exports for better TypeScript support
export type IssueStatus = typeof CONSTANTS.ISSUE_STATUS[keyof typeof CONSTANTS.ISSUE_STATUS];
export type NotificationType = typeof CONSTANTS.NOTIFICATION_TYPES[keyof typeof CONSTANTS.NOTIFICATION_TYPES];
export type AIAgentType = typeof CONSTANTS.AI_AGENTS[keyof typeof CONSTANTS.AI_AGENTS];