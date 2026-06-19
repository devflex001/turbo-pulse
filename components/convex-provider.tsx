"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useConvexAuth } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
