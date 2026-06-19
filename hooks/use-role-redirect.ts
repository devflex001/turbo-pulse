"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthClient } from "@/lib/auth-client";

/**
 * Hook to redirect users based on their role:
 * - Admins on "/" are redirected to "/admin"
 * - Regular users on "/admin" are redirected to "/"
 */
export function useRoleRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuthClient();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Only authenticated users need redirects
    if (!isAuthenticated || !user) return;

    // Admin on homepage → redirect to admin dashboard
    if (user.role === "admin" && pathname === "/") {
      router.replace("/admin");
      return;
    }

    // Regular user trying to access admin → redirect to homepage
    if (user.role === "user" && pathname.startsWith("/admin")) {
      router.replace("/");
      return;
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);
}
