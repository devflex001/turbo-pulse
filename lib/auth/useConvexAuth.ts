"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "./jwt";

/**
 * Custom auth hook for Convex authentication
 * This hook provides the authentication state required by ConvexProviderWithAuth
 * 
 * It must return an object with:
 * - isLoading: boolean - true while checking auth state
 * - isAuthenticated: boolean - true if user has valid token
 * - fetchAccessToken: function - returns the JWT token for Convex requests
 */
export function useConvexAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication state on mount
  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);

    // Listen for storage changes (e.g., login in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "convex_auth_token") {
        setIsAuthenticated(!!e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch access token for Convex requests
  const fetchAccessToken = useCallback(async ({
    forceRefreshToken,
  }: {
    forceRefreshToken: boolean;
  }) => {
    const token = getAuthToken();
    
    if (!token) {
      return null;
    }

    // TODO: Implement token refresh logic if needed
    // For now, we just return the stored token
    
    return token;
  }, []);

  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken,
  };
}
