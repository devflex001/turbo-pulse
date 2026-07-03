"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUserData } from "@/lib/auth/jwt";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    // Don't redirect while loading if we have stored credentials
    // This prevents the flicker when user just logged in
    const storedUser = getUserData();

    if (isLoading && storedUser) {
      // We're loading but have credentials, wait for Convex to verify
      return;
    }

    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to home (modals are on homepage)
        router.push("/");
      } else if (requireAdmin && !isAdmin) {
        // Authenticated but not admin when admin required
        router.push("/");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, requireAdmin, router]);

  // Show loading state while checking authentication
  // But only if we don't have stored credentials (to prevent flicker)
  const storedUser = getUserData();
  if (isLoading && !storedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not admin when required
  if (!isLoading && (!isAuthenticated || (requireAdmin && !isAdmin))) {
    return null;
  }

  return <>{children}</>;
}
