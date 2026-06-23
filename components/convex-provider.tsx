"use client";

import React from "react";
import { ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ConvexProvider as ConvexBase } from "convex/react";
import { getAuthToken } from "@/lib/auth/jwt";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Custom Convex Provider wrapper that handles JWT token passing
 * Intercepts fetch requests to add Authorization header
 */
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Store original fetch
    const originalFetch = globalThis.fetch;

    // Override fetch to add auth header
    globalThis.fetch = (async (resource: any, config: any) => {
      // Get token from localStorage
      const token = getAuthToken();

      // If this is a Convex request and we have a token, add the Authorization header
      if (token && typeof resource === "string" && resource.includes("convex")) {
        config = {
          ...config,
          headers: {
            ...(config?.headers || {}),
            Authorization: `Bearer ${token}`,
          },
        };
      }

      return originalFetch(resource, config);
    }) as any;

    return () => {
      // Restore original fetch on cleanup
      globalThis.fetch = originalFetch;
    };
  }, []);

  return (
    <ConvexBase client={convex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexBase>
  );
}
