"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

// Must be shorter than SESSION_STALE_THRESHOLD_MS (15 min) on the server.
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

interface ActiveAdminsIndicatorProps {
  /** When true, renders as a slim full-width bar (for mobile strip placement). */
  mobileStrip?: boolean
}

/**
 * Active Admins Indicator
 *
 * Desktop: pill in the navbar (default).
 * Mobile: full-width strip below the navbar (mobileStrip prop).
 *
 * Hides the current admin from the display.
 * Runs a heartbeat every 5 minutes so stale sessions are auto-expired by the server.
 */
export function ActiveAdminsIndicator({ mobileStrip = false }: ActiveAdminsIndicatorProps) {
  const { adminName, isAdmin, sessionToken } = useAuth()
  const activeAdmins = useQuery(api.admin.sessions.getActiveAdmins, {})
  const heartbeat = useMutation(api.admin.sessions.updateAdminSessionActivity)

  // Heartbeat: keep this admin's lastActivityAt current
  React.useEffect(() => {
    if (!isAdmin || !sessionToken) return

    heartbeat({ sessionToken }).catch(() => { })

    const id = setInterval(() => {
      heartbeat({ sessionToken }).catch(() => { })
    }, HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(id)
  }, [isAdmin, sessionToken, heartbeat])

  if (!isAdmin) return null

  // Filter out current admin
  const otherSessions =
    activeAdmins?.filter((admin) => admin.adminName !== adminName) ?? []

  if (otherSessions.length === 0) return null

  // Deduplicate by admin name and count devices
  const adminDeviceMap = new Map<string, number>()
  for (const session of otherSessions) {
    adminDeviceMap.set(
      session.adminName,
      (adminDeviceMap.get(session.adminName) ?? 0) + 1
    )
  }

  // Build display text
  const adminEntries = Array.from(adminDeviceMap.entries()).map(([name, count]) =>
    count === 1 ? name : `${name} (${count} devices)`
  )

  let adminText: string
  if (adminEntries.length === 1) {
    adminText = `${adminEntries[0]} is online`
  } else if (adminEntries.length === 2) {
    adminText = `${adminEntries[0]} and ${adminEntries[1]} are online`
  } else {
    const names = adminEntries.slice(0, -1).join(", ")
    const lastName = adminEntries[adminEntries.length - 1]
    adminText = `${names}, and ${lastName} are online`
  }

  if (mobileStrip) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border-b border-primary/10 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
        <span className="capitalize">{adminText}</span>
      </div>
    )
  }

  return (
    <div className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
      🟢 {adminText}
    </div>
  )
}
