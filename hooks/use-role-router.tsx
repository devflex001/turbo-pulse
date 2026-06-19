"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "@/lib/auth-client"

/**
 * Watches auth state and routes based on role:
 * - admin role     → /admin
 * - user role      → / (no redirect)
 * - unauthenticated → / (no redirect)
 *
 * Returns { isAdmin, isAuthenticated } for consumers that need it.
 */
export function useRoleRouter() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending } = useSession()

  const isAuthenticated = !!session
  const isAdmin = session?.user?.role === "admin"

  React.useEffect(() => {
    if (isPending) return

    if (isAuthenticated && isAdmin && pathname !== "/admin") {
      router.push("/admin")
    }
  }, [isPending, isAuthenticated, isAdmin, pathname, router])

  return { isAdmin, isAuthenticated }
}
