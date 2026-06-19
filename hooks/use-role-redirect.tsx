"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthClient } from "@/lib/auth-client"

/**
 * Simple role-based redirect hook.
 * If user is logged in:
 * - Admin role → redirect to /admin
 * - User role → stay on current page unless on /admin (then go to /)
 */
export function useRoleRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthClient()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const isAdmin = user.role === "admin"
    const isOnAdminPage = pathname?.startsWith("/admin")
    const isOnAuthPage = pathname?.startsWith("/auth")

    // Redirect admin to /admin if not already there
    if (isAdmin && !isOnAdminPage && !isOnAuthPage) {
      router.push("/admin")
    }

    // Redirect non-admin away from /admin to /
    if (!isAdmin && isOnAdminPage) {
      router.push("/")
    }
  }, [isAuthenticated, user, pathname, router])
}
