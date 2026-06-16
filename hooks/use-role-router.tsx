"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * Watches Convex auth state + admin status and handles role-based routing:
 * - Authenticated admin  → /admin
 * - Authenticated user   → / (no redirect)
 * - Unauthenticated      → / (no redirect)
 *
 * Returns { isLoading, isAdmin } for consumers that need it.
 */
export function useRoleRouter() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()

  // Only fetch admin status when authenticated
  const adminStatus = useQuery(
    api.admin.getAdminStatus,
    isAuthenticated ? {} : "skip"
  )

  const isLoading = authLoading || (isAuthenticated && adminStatus === undefined)
  const isAdmin = adminStatus?.isAdmin ?? false

  React.useEffect(() => {
    if (isLoading) return

    if (isAuthenticated && isAdmin && pathname !== "/admin") {
      router.push("/admin")
    }
  }, [isLoading, isAuthenticated, isAdmin, pathname, router])

  return { isLoading, isAdmin, isAuthenticated }
}
