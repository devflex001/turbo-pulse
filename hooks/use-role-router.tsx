"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { useSession } from "@/lib/auth-client"
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
  const { data: session, isPending } = useSession()

  // Only fetch admin status when authenticated
  const adminStatus = useQuery(
    api.admin.getAdminStatus,
    session ? {} : "skip"
  )

  const isLoading = isPending || (session && adminStatus === undefined)
  const isAdmin = adminStatus?.isAdmin ?? false
  const isAuthenticated = !!session

  React.useEffect(() => {
    if (isLoading) return

    if (isAuthenticated && isAdmin && pathname !== "/admin") {
      router.push("/admin")
    }
  }, [isLoading, isAuthenticated, isAdmin, pathname, router])

  return { isLoading, isAdmin, isAuthenticated }
}
