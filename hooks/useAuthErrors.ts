/**
 * Custom hook for handling authentication errors with user-friendly messages
 * Usage: const { formatError, isRetryable } = useAuthErrors()
 */

import { translateAuthError, getErrorDetails, isRetryableError } from "@/lib/auth/errorMessages";

export function useAuthErrors() {
  const formatError = (error: Error | string | unknown, context: "login" | "register" = "login") => {
    return translateAuthError(error, context);
  };

  const getDetails = (error: Error | string | unknown, context: "login" | "register" = "login") => {
    return getErrorDetails(error, context);
  };

  const canRetry = (error: Error | string | unknown) => {
    return isRetryableError(error);
  };

  return {
    formatError,
    getDetails,
    canRetry,
  };
}
