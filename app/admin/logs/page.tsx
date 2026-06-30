"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/useAuth"
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
  Filter,
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
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"

// Action type configuration
const ACTION_TYPES = [
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "ban_user", label: "Ban User" },
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

export default function AdminLogsPage() {
  const { user, sessionToken } = useAuth()
  const [selectedAdmin, setSelectedAdmin] = useState<string>("")
  const [selectedActionType, setSelectedActionType] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch all logs
  const logs = useQuery(api.audit.logger.getAdminLogs, {
    limit: 500,
  })

  // Fetch stats
  const stats = useQuery(api.audit.logger.getAdminLogStats, {})

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

  // Get unique admin names from stats
  const adminNames = stats
    ? Object.keys(stats.actionCounts || {}).length > 0
      ? Object.keys(stats.actionCounts || {})
      : []
    : []

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

  if (!user || !user.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Access denied. Admin privileges required.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track and review all admin activities in the system
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All recorded activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Action Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.actionCounts || {}).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unique action types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Resource Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.resourceCounts || {}).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Affected resource types
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Admin Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Admin</label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="All admins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All admins</SelectItem>
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
              <label className="text-sm font-medium mb-2 block">
                Action Type
              </label>
              <Select
                value={selectedActionType}
                onValueChange={setSelectedActionType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
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
              <label className="text-sm font-medium mb-2 block">Export</label>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="w-full"
                disabled={!filteredLogs || filteredLogs.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Activity Log ({filteredLogs?.length || 0} entries)
          </CardTitle>
          <CardDescription>
            Showing {filteredLogs?.length || 0} of {logs?.logs.length || 0} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!logs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
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
                    <TableHead className="w-24">Admin</TableHead>
                    <TableHead className="w-32">Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead className="w-40">Description</TableHead>
                    <TableHead className="w-32">Timestamp</TableHead>
                    <TableHead className="w-20">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: AdminLog) => {
                    const action =
                      actionIconMap[log.actionType] || actionIconMap.other
                    return (
                      <TableRow key={log._id}>
                        {/* Admin Name */}
                        <TableCell>
                          <Badge variant="secondary">{log.adminName}</Badge>
                        </TableCell>

                        {/* Action */}
                        <TableCell>
                          <div className={cn("inline-flex items-center gap-2 px-2 py-1 rounded", action.color)}>
                            {action.icon}
                            <span className="text-xs font-medium">
                              {ACTION_TYPES.find(
                                (a) => a.value === log.actionType
                              )?.label || log.actionType}
                            </span>
                          </div>
                        </TableCell>

                        {/* Resource Type */}
                        <TableCell>
                          <span className="text-sm text-muted-foreground capitalize">
                            {log.resourceType}
                          </span>
                        </TableCell>

                        {/* Description */}
                        <TableCell>
                          <span className="text-sm truncate">
                            {log.resourceDescription}
                          </span>
                        </TableCell>

                        {/* Timestamp */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(log.timestamp),
                              "MMM dd, HH:mm:ss"
                            )}
                          </span>
                        </TableCell>

                        {/* Details Button */}
                        <TableCell>
                          {log.details && (
                            <details className="cursor-pointer group">
                              <summary className="text-xs font-medium text-primary hover:underline">
                                View
                              </summary>
                              <div className="absolute right-0 z-10 mt-1 bg-popover border rounded shadow-lg p-3 text-xs space-y-1 w-48">
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
