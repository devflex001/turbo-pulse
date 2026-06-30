"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { AdminLayout } from "@/components/admin-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Search,
  Download,
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
import { format } from "date-fns"

// Action type configuration
const ACTION_TYPES = [
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "ban_user", label: "Ban User" },
]
{ value: "unban_user", label: "Unban User" },
{ value: "edit_user", label: "Edit User" },
{ value: "update_bet_status", label: "Update Bet" },
{ value: "approve_withdrawal", label: "Approve Withdrawal" },
{ value: "reject_withdrawal", label: "Reject Withdrawal" },
{ value: "create_custom_event", label: "Create Event" },
{ value: "update_custom_event", label: "Update Event" },
{ value: "settle_custom_event", label: "Settle Event" },
]

const actionIconMap: Record<
  string,
  { icon: React.ReactNode; color: string }
> = {
  login: {
    icon: <LogIn className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  logout: {
    icon: <LogOut className="h-4 w-4" />,
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  },
  ban_user: {
    icon: <UserX className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  unban_user: {
    icon: <UserCheck className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  edit_user: {
    icon: <Edit className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  update_bet_status: {
    icon: <Zap className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  approve_withdrawal: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  reject_withdrawal: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  create_custom_event: {
    icon: <Edit className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  update_custom_event: {
    icon: <Edit className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  settle_custom_event: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  other: {
    icon: <Eye className="h-4 w-4" />,
    color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
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
function AdminLogsContent() {
  const { isAdmin } = useAuth()
  const [selectedAdmin, setSelectedAdmin] = useState<string>("")
  const [selectedActionType, setSelectedActionType] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all logs
  const logs = useQuery(api.audit.logger.getAdminLogs, {
    limit: 500,
  })

  // Filter logs based on selected filters and search
  const filteredLogs = useMemo(() => {
    if (!logs) return []

    return logs.logs.filter((log: AdminLog) => {
      // Admin filter
      if (selectedAdmin && log.adminName !== selectedAdmin) {
        return false
      }

      // Action type filter
      if (selectedActionType && log.actionType !== selectedActionType) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          log.adminName.toLowerCase().includes(query) ||
          log.actionType.toLowerCase().includes(query) ||
          log.resourceDescription.toLowerCase().includes(query) ||
          log.resourceType.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [logs, selectedAdmin, selectedActionType, searchQuery])

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert("No logs to export")
      return
    }

    // Create CSV content
    const headers = [
      "Admin Name",
      "Action Type",
      "Resource Type",
      "Resource Description",
      "Timestamp",
      "Details",
    ]
    const rows = filteredLogs.map((log: AdminLog) => [
      log.adminName,
      log.actionType,
      log.resourceType,
      log.resourceDescription,
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.details ? JSON.stringify(log.details) : "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `admin-logs-${Date.now()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isAdmin) {
    return null
  }
  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Admin Filter */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Admin</label>
              <Select value={selectedAdmin || "all"} onValueChange={(val) => setSelectedAdmin(val === "all" ? "" : val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All admins</SelectItem>
                  {["dikie", "hellen", "mwalimu"].map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">
                Action Type
              </label>
              <Select
                value={selectedActionType || "all"}
                onValueChange={(val) => setSelectedActionType(val === "all" ? "" : val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Export</label>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                disabled={!filteredLogs || filteredLogs.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Activity Logs</CardTitle>
              <CardDescription className="text-xs mt-1">
                {filteredLogs?.length || 0} of {logs?.logs.length || 0} entries
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!logs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">
                {logs.logs.length === 0
                  ? "No logs recorded yet"
                  : "No logs match your filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 text-xs font-semibold">Admin</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Action</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Resource</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Description</TableHead>
                    <TableHead className="h-8 text-xs font-semibold">Time</TableHead>
                    <TableHead className="h-8 text-xs font-semibold w-16">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: AdminLog) => {
                    const action =
                      actionIconMap[log.actionType] || actionIconMap.other
                    return (
                      <TableRow key={log._id} className="h-9">
                        {/* Admin Name */}
                        <TableCell className="py-1.5">
                          <Badge variant="secondary" className="text-xs font-mono">
                            {log.adminName}
                          </Badge>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="py-1.5">
                          <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs", action.color)}>
                            {action.icon}
                            <span className="font-medium">
                              {ACTION_TYPES.find(
                                (a) => a.value === log.actionType
                              )?.label || log.actionType}
                            </span>
                          </div>
                        </TableCell>

                        {/* Resource Type */}
                        <TableCell className="py-1.5">
                          <span className="text-xs text-muted-foreground capitalize">
                            {log.resourceType}
                          </span>
                        </TableCell>

                        {/* Description */}
                        <TableCell className="py-1.5">
                          <span className="text-xs truncate max-w-xs">
                            {log.resourceDescription}
                          </span>
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell className="py-1.5">
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(log.timestamp),
                              "MMM dd, HH:mm"
                            )}
                          </span>
                        </TableCell>

                        {/* Details Button */}
                        <TableCell className="py-1.5">
                          {log.details && (
                            <details className="cursor-pointer group">
                              <summary className="text-xs font-medium text-primary hover:underline">
                                View
                              </summary>
                              <div className="absolute right-2 z-10 mt-1 bg-popover border rounded shadow-lg p-2 text-xs space-y-1 w-48">
                                {log.details.reason && (
                                  <div>
                                    <strong>Reason:</strong> {log.details.reason}
                                  </div>
                                )}
                                {log.details.previousValue && (
                                  <div>
                                    <strong>Previous:</strong>{" "}
                                    {log.details.previousValue}
                                  </div>
                                )}
                                {log.details.newValue && (
                                  <div>
                                    <strong>New:</strong> {log.details.newValue}
                                  </div>
                                )}
                                {log.details.amount !== undefined && (
                                  <div>
                                    <strong>Amount:</strong> KES{" "}
                                    {log.details.amount.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminLogsPage() {
  return (
    <AdminLayout pageTitle="Admin Logs">
      <AdminLogsContent />
    </AdminLayout>
  )
}
