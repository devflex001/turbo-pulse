"use client"

import { useRoleRedirect } from "@/hooks/use-role-redirect"

/**
 * Simple wrapper that calls the role redirect hook.
 * Add this to the layout to enable role-based routing globally.
 */
export function RoleRedirectHandler() {
  useRoleRedirect()
  return null
}
