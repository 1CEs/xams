/**
 * Utility functions for handling authentication error messages
 * Provides consistent, user-friendly error messages across the application
 */

export interface AuthErrorData {
  message?: string
  status?: string
  err?: { message?: string }
  errors?: Array<{
    schema?: { description?: string }
    message?: string
  }>
}

/**
 * Transforms technical error messages into user-friendly ones
 */
export const getAuthErrorMessage = (errorData: AuthErrorData, isSignUp: boolean = false): string => {
  // Handle standardized error format from backend
  if (errorData?.message) {
    return errorData.message
  }
  
  if (errorData?.status === 'fail' || errorData?.status === 'error') {
    return errorData.message || 'An error occurred'
  }
  
  // Handle validation errors from schema
  const { err, errors } = errorData || {}
  if (err?.message) {
    return err.message
  }
  
  if (errors?.length) {
    const validationError = errors[0]
    const errorMessage = validationError.schema?.description || validationError.message
    
    // Transform technical validation messages to user-friendly ones
    if (errorMessage?.includes('Expected string to match')) {
      if (errorMessage.includes('passwordRegex') || errorMessage.includes('^(?=.*[a-z])(?=.*[A-Z])')) {
        return isSignUp 
          ? 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
          : 'Invalid password format'
      }
      
      if (errorMessage.includes('emailRegex') || errorMessage.includes('@')) {
        return 'Please enter a valid email address'
      }
      
      return errorMessage
    }
    
    return errorMessage || 'Validation error occurred'
  }
  
  return 'An unexpected error occurred'
}

/**
 * Common error messages for authentication
 */
export const AUTH_ERROR_MESSAGES = {
  // Sign Up Errors
  SIGNUP: {
    FIRST_NAME_REQUIRED: 'First name is required',
    LAST_NAME_REQUIRED: 'Last name is required',
    USERNAME_REQUIRED: 'Username is required',
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    CONFIRM_PASSWORD_REQUIRED: 'Please confirm your password',
    PASSWORDS_NOT_MATCH: 'Passwords do not match',
    INVALID_EMAIL: 'Please enter a valid email address',
    WEAK_PASSWORD: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)',
    USERNAME_EXISTS: 'This username is already taken. Please choose a different one.',
    EMAIL_EXISTS: 'An account with this email already exists. Please use a different email or sign in.',
    ACCOUNT_EXISTS: 'Username or email already exists. Please use different credentials.',
    SUCCESS: 'Account created successfully! Welcome to XAMS!'
  },
  
  // Sign In Errors
  SIGNIN: {
    IDENTIFIER_REQUIRED: 'Username or email is required',
    PASSWORD_REQUIRED: 'Password is required',
    INVALID_CREDENTIALS: 'Invalid username/email or password',
    USER_NOT_FOUND: 'No account found with this username/email',
    WRONG_PASSWORD: 'Incorrect password. Please try again.',
    INVALID_PASSWORD_FORMAT: 'Invalid password format',
    SUCCESS: 'Welcome back! Sign-in successful.'
  },
  
  // Forgot Password Errors
  FORGOT_PASSWORD: {
    EMAIL_REQUIRED: 'Please enter your email address',
    INVALID_EMAIL: 'Please enter a valid email address',
    EMAIL_NOT_FOUND: 'No account found with this email address',
    SUCCESS: 'Password reset instructions have been sent to your email address. Please check your inbox.',
    ERROR: 'Unable to process password reset request. Please try again.'
  },
  
  // General Errors
  GENERAL: {
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
    VALIDATION_ERROR: 'Please check your input and try again.'
  }
} as const

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

/**
 * Gets password strength requirements as an array
 */
export const getPasswordRequirements = (): string[] => {
  return [
    'At least 8 characters',
    'One uppercase letter (A-Z)',
    'One lowercase letter (a-z)',
    'One number (0-9)',
    'One special character (@$!%*?&)'
  ]
}
