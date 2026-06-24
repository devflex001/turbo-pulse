/**
 * Client-side auth helpers
 * This file intentionally does NOT import any server-only libraries such as `jose`.
 * Keep only localStorage helpers here so it can be imported from client components.
 */

/**
 * Storage keys for auth tokens
 */
export const AUTH_TOKEN_KEY = "convex_auth_token";
export const AUTH_USER_KEY = "convex_auth_user";

/**
 * Store auth token in localStorage
 */
export function storeAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove auth token from localStorage
 */
export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
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
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
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
    const data = localStorage.getItem(AUTH_USER_KEY);
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
