"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth/useAuth"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LogIn, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

/**
 * Admin Indicator Component
 * 
 * Displays:
 * 1. Current admin identification (if logged in as admin)
 * 2. List of other active admins in the system
 */
export function AdminIndicator() {
  const { user, adminName, isAdmin } = useAuth()
  const activeAdmins = useQuery(api.admin.sessions.getActiveAdmins, {})

  if (!isAdmin || !adminName) {
    return null
  }

  // Filter out current admin from the list
  const otherActiveAdmins =
    activeAdmins?.filter((admin) => admin.adminName !== adminName) || []

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <LogIn className="h-4 w-4 text-primary" />
            Admin Session
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Admin */}
        <div className="flex items-center justify-between p-2.5 bg-white/50 dark:bg-black/20 rounded-lg border border-primary/20">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground">
              Logged in as
            </p>
            <p className="font-mono text-sm font-bold text-primary capitalize">
              {adminName}
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/25 border-primary/30">
            Active
          </Badge>
        </div>

        {/* Other Active Admins */}
        {otherActiveAdmins.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Other active admins
            </p>
            <div className="space-y-1.5">
              {otherActiveAdmins.map((admin) => (
                <TooltipProvider key={admin.adminName}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-2 bg-white/30 dark:bg-black/10 rounded border border-border/50 hover:border-border transition-colors cursor-help">
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs font-bold capitalize">
                            {admin.adminName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(admin.lastActivityAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          Online
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      <p>
                        Logged in{" "}
                        {formatDistanceToNow(admin.loginAt, {
                          addSuffix: true,
                        })}
                      </p>
                      <p>
                        Last active{" "}
                        {formatDistanceToNow(admin.lastActivityAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {/* No Other Admins */}
        {otherActiveAdmins.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No other admins currently online
          </p>
        )}
      </CardContent>
    </Card>
  )
}
