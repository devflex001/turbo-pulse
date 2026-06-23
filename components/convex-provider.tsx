"use client";

import React from "react";
import { ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ConvexProvider as ConvexBase } from "convex/react";
import { getAuthToken } from "@/lib/auth/jwt";

// Create Convex client with auth configuration
// This ensures the token is included on every request, including initial connection
function createConvexClient() {
  const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  // Set auth token on client if available
  const token = getAuthToken();
  if (token) {
    client.setAuth(token);
  }

  return client;
}

const convex = createConvexClient();

/**
 * Custom Convex Provider wrapper that handles JWT token passing
 * Monitors token changes and updates Convex client accordingly
 */
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Listen for storage events to detect token changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "convex_auth_token") {
        if (e.newValue) {
          convex.setAuth(e.newValue);
        } else {
          convex.clearAuth();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Sync auth token on mount
    const token = getAuthToken();
    if (token) {
      convex.setAuth(token);
    } else {
      convex.clearAuth();
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <ConvexBase client={convex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexBase>
  );
}
