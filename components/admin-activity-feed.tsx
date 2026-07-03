"use client"

import * as React from "react"
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
  Loader2,
  UserCheck,
  UserX,
  Edit,
  AlertCircle,
  CheckCircle2,
  LogOut,
  LogIn,
  Zap,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface ActivityFeedProps {
  limit?: number
  className?: string
}

// Map action types to icons and colors
const actionIconMap: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  login: {
    icon: <LogIn className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    label: "Login",
  },
  logout: {
    icon: <LogOut className="h-4 w-4" />,
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
    label: "Logout",
  },
  ban_user: {
    icon: <UserX className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
    label: "Ban User",
  },
  unban_user: {
    icon: <UserCheck className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    label: "Unban User",
  },
  edit_user: {
    icon: <Edit className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    label: "Edit User",
  },
  update_bet_status: {
    icon: <Zap className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    label: "Update Bet",
  },
  approve_withdrawal: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    label: "Approve Withdrawal",
  },
  reject_withdrawal: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
    label: "Reject Withdrawal",
  },
  create_custom_event: {
    icon: <Edit className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    label: "Create Event",
  },
  update_custom_event: {
    icon: <Edit className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    label: "Update Event",
  },
  settle_custom_event: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    label: "Settle Event",
  },
  other: {
    icon: <Eye className="h-4 w-4" />,
    color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    label: "Activity",
  },
}

interface AdminLog {
  _id: string
  adminName: string
  actionType: string
  resourceType: string
  resourceDescription: string
  timestamp: number
  details?: {
    previousValue?: string
    newValue?: string
    reason?: string
    amount?: number
  }
}

export function AdminActivityFeed({
  limit = 20,
  className,
}: ActivityFeedProps) {
  const logs = useQuery(api.audit.logger.getRecentAdminLogs, {
    limit,
  })

  if (logs === undefined) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Admin Activity</CardTitle>
          <CardDescription>Real-time admin actions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Admin Activity</CardTitle>
          <CardDescription>Real-time admin actions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Admin Activity</CardTitle>
        <CardDescription>Real-time admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log: AdminLog) => {
            const action = actionIconMap[log.actionType] || actionIconMap.other
            const timeAgo = formatDistanceToNow(log.timestamp, {
              addSuffix: true,
            })

            return (
              <div
                key={log._id}
                className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0"
              >
                {/* Icon */}
                <div className={cn("rounded p-1.5 mt-0.5", action.color)}>
                  {action.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {log.adminName}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {action.label}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground mt-1">
                    {log.resourceDescription}
                  </p>

                  {/* Details if available */}
                  {log.details && (
                    <div className="text-xs text-muted-foreground mt-1.5 space-y-0.5">
                      {log.details.reason && (
                        <div>
                          <span className="font-medium">Reason:</span> {log.details.reason}
                        </div>
                      )}
                      {log.details.previousValue && log.details.newValue && (
                        <div>
                          <span className="font-medium">Change:</span> {log.details.previousValue} →{" "}
                          {log.details.newValue}
                        </div>
                      )}
                      {log.details.amount !== undefined && (
                        <div>
                          <span className="font-medium">Amount:</span> KES{" "}
                          {log.details.amount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
