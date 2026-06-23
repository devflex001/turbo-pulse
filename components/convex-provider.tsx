"use client";

import React from "react";
import { ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ConvexProvider as ConvexBase } from "convex/react";

// Create Convex client
// Session-based auth doesn't require JWT configuration
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Convex Provider wrapper with session-based authentication
 * Sessions are managed through database and localStorage
 */
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexBase client={convex}>
      <AuthProvider>{children}</AuthProvider>
    </ConvexBase>
  );
}
