"use client";

import { AuthClientProvider } from "@/lib/auth-client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthClientProvider>{children}</AuthClientProvider>;
}
