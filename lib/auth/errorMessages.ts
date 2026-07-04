/**
 * User-friendly error message translations
 * Maps Convex/technical errors to friendly, understandable messages
 */

export interface ErrorTranslationMap {
  [key: string]: string;
}

// Login errors
const LOGIN_ERRORS: ErrorTranslationMap = {
  "Invalid phone number or password": "Phone number or password is incorrect. Please try again.",
  "User not found": "This phone number is not registered. Please sign up first.",
  "Invalid credentials": "Phone number or password is incorrect. Please try again.",
  "Session expired": "Your session has expired. Please log in again.",
  "Failed to create session": "Unable to create session. Please try again.",
};

// Registration errors
const REGISTRATION_ERRORS: ErrorTranslationMap = {
  "Phone number already registered": "This phone number is already registered. Please log in or use a different number.",
  "Invalid phone number format": "Invalid phone number. Please enter a valid Kenyan number (e.g., 0712345678).",
  "Password must be at least 8 characters long": "Password must be at least 8 characters long.",
  "Password must not exceed 128 characters": "Password is too long. Please use a shorter password.",
  "Invalid referral code": "The referral code is invalid or has expired. You can still sign up without it.",
  "Failed to generate unique referral code": "Unable to create your account. Please try again.",
  "Phone number already exists": "This phone number is already registered. Please log in or use a different number.",
};

// Generic/system errors
const SYSTEM_ERRORS: ErrorTranslationMap = {
  "Network error": "Network connection failed. Please check your connection and try again.",
  "Server error": "Server error occurred. Please try again in a moment.",
  "Timeout": "Request took too long. Please try again.",
  "Failed to connect": "Unable to connect to the server. Please try again.",
};

/**
 * Translate a raw error message to a user-friendly message
 * @param error - Error object or message string
 * @param context - Context (e.g., 'login', 'register', 'session') to provide relevant error messages
 * @returns User-friendly error message
 */
export function translateAuthError(
  error: Error | string | unknown,
  context: "login" | "register" | "session" = "login"
): string {
  let errorMessage = "";

  // Extract error message from various error formats
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    return "An unexpected error occurred. Please try again.";
  }

  // Try to find exact match first
  const contextErrors = context === "register" ? REGISTRATION_ERRORS : 
                       context === "session" ? SYSTEM_ERRORS : 
                       LOGIN_ERRORS;

  if (contextErrors[errorMessage]) {
    return contextErrors[errorMessage];
  }

  // Try to find partial match (case-insensitive)
  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(contextErrors)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Check system errors
  for (const [key, value] of Object.entries(SYSTEM_ERRORS)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Fallback messages based on context
  if (context === "register") {
    return "Unable to create account. Please check your information and try again.";
  } else if (context === "session") {
    return "Session error. Please try again or log in again.";
  } else {
    return "Login failed. Please check your credentials and try again.";
  }
}

/**
 * Get specific error details for UI handling
 * Useful for showing different UI states (e.g., shake animation, specific field highlighting)
 */
export function getErrorDetails(
  error: Error | string | unknown,
  context: "login" | "register" = "login"
): {
  message: string;
  type: "invalid_credentials" | "invalid_format" | "user_exists" | "server" | "generic";
  field?: "phone" | "password" | "confirmPassword";
} {
  const errorMessage = error instanceof Error ? error.message : 
                      typeof error === "string" ? error : "";
  const lowerMessage = errorMessage.toLowerCase();

  // Invalid credentials or not found
  if (lowerMessage.includes("invalid") && lowerMessage.includes("password")) {
    return {
      message: "Phone number or password is incorrect.",
      type: "invalid_credentials",
      field: "password",
    };
  }

  // Phone number validation
  if (lowerMessage.includes("phone") && (lowerMessage.includes("invalid") || lowerMessage.includes("format"))) {
    return {
      message: "Invalid phone number format.",
      type: "invalid_format",
      field: "phone",
    };
  }

  // User already exists
  if (lowerMessage.includes("already registered") || lowerMessage.includes("already exists")) {
    return {
      message: "This phone number is already registered.",
      type: "user_exists",
      field: "phone",
    };
  }

  // Password issues
  if (lowerMessage.includes("password")) {
    return {
      message: translateAuthError(error, context),
      type: "invalid_format",
      field: "password",
    };
  }

  // Server errors
  if (lowerMessage.includes("server") || lowerMessage.includes("network") || lowerMessage.includes("connection")) {
    return {
      message: "Server error. Please try again in a moment.",
      type: "server",
    };
  }

  // Generic fallback
  return {
    message: translateAuthError(error, context),
    type: "generic",
  };
}

/**
 * Check if error is a retry-able error
 * Some errors shouldn't be retried immediately (e.g., user already exists)
 */
export function isRetryableError(error: Error | string | unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : 
                      typeof error === "string" ? error : "";
  const lowerMessage = errorMessage.toLowerCase();

  // These errors should NOT be retried
  const nonRetryable = [
    "already registered",
    "already exists",
    "invalid phone",
    "invalid format",
    "invalid referral",
    "password",
  ];

  for (const phrase of nonRetryable) {
    if (lowerMessage.includes(phrase)) {
      return false;
    }
  }

  // Network/server errors are retryable
  return true;
}
