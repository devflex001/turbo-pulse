/**
 * Session Management
 * Handles storing and retrieving session tokens from localStorage
 */

/**
 * Storage keys for auth session
 */
export const SESSION_TOKEN_KEY = "betflow_session_token";
export const SESSION_USER_KEY = "betflow_session_user";

/**
 * Store session token in localStorage
 */
export function storeSessionToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

/**
 * Get session token from localStorage
 */
export function getSessionToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove session token from localStorage
 */
export function removeSessionToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
  }
}

/**
 * Store user data in localStorage
 */
export function storeUserData(userData: {
  userId: string;
  phone: string;
  role: string;
}) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
  }
}

/**
 * Get user data from localStorage
 */
export function getUserData(): {
  userId: string;
  phone: string;
  role: string;
} | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(SESSION_USER_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
  }
  return null;
}
