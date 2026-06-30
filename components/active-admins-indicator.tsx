"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

/**
 * Active Admins Indicator
 * 
 * Shows in navbar: "hellen is online" or "hellen and mwalimu are online"
 * Hides the current admin from the display
 */
export function ActiveAdminsIndicator() {
  const { adminName, isAdmin } = useAuth()
  const activeAdmins = useQuery(api.admin.sessions.getActiveAdmins, {})

  if (!isAdmin) {
    return null
  }

  // Filter out current admin from the list
  const otherActiveAdmins =
    activeAdmins?.filter((admin) => admin.adminName !== adminName) || []

  if (otherActiveAdmins.length === 0) {
    return null
  }

  // Format the text
  let adminText = ""
  if (otherActiveAdmins.length === 1) {
    adminText = `${otherActiveAdmins[0].adminName} is online`
  } else if (otherActiveAdmins.length === 2) {
    adminText = `${otherActiveAdmins[0].adminName} and ${otherActiveAdmins[1].adminName} are online`
  } else {
    const names = otherActiveAdmins.slice(0, -1).map(a => a.adminName).join(", ")
    const lastName = otherActiveAdmins[otherActiveAdmins.length - 1].adminName
    adminText = `${names}, and ${lastName} are online`
  }

  return (
    <div className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
      🟢 {adminText}
    </div>
  )
}
