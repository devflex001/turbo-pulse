"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useConvexAuth } from "@/lib/auth/useConvexAuth";
import { AuthProvider } from "@/lib/auth/AuthContext";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexProviderWithAuth>
  );
}
