"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

// Must be shorter than SESSION_STALE_THRESHOLD_MS (15 min) on the server.
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Active Admins Indicator
 *
 * Shows in navbar: "hellen is online" or "hellen and mwalimu are online".
 * Hides the current admin from the display.
 *
 * Also runs a heartbeat every 5 minutes so the current admin's session
 * stays fresh in the DB — preventing stale sessions from showing other
 * admins as permanently online after a crash or abandoned tab.
 */
export function ActiveAdminsIndicator() {
  const { adminName, isAdmin, sessionToken } = useAuth()
  const activeAdmins = useQuery(api.admin.sessions.getActiveAdmins, {})
  const heartbeat = useMutation(api.admin.sessions.updateAdminSessionActivity)

  // Heartbeat: keep this admin's lastActivityAt current
  React.useEffect(() => {
    if (!isAdmin || !sessionToken) return

    // Fire immediately on mount so the session is fresh right away
    heartbeat({ sessionToken }).catch(() => { })

    const id = setInterval(() => {
      heartbeat({ sessionToken }).catch(() => { })
    }, HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(id)
  }, [isAdmin, sessionToken, heartbeat])

  if (!isAdmin) return null

  // Filter out the current admin — they know they're online
  const otherActiveAdmins =
    activeAdmins?.filter((admin) => admin.adminName !== adminName) ?? []

  if (otherActiveAdmins.length === 0) return null

  // Build the display string
  let adminText: string
  if (otherActiveAdmins.length === 1) {
    adminText = `${otherActiveAdmins[0].adminName} is online`
  } else if (otherActiveAdmins.length === 2) {
    adminText = `${otherActiveAdmins[0].adminName} and ${otherActiveAdmins[1].adminName} are online`
  } else {
    const names = otherActiveAdmins.slice(0, -1).map((a) => a.adminName).join(", ")
    const lastName = otherActiveAdmins[otherActiveAdmins.length - 1].adminName
    adminText = `${names}, and ${lastName} are online`
  }

  return (
    <div className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
      🟢 {adminText}
    </div>
  )
}
