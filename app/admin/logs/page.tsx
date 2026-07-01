"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Download,
  ChevronDown,
  UserCheck,
  UserX,
  Edit,
  AlertCircle,
  CheckCircle2,
  LogOut,
  LogIn,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

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
    icon: <LogIn className="h-3 w-3" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  logout: {
    icon: <LogOut className="h-3 w-3" />,
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  },
  ban_user: {
    icon: <UserX className="h-3.5 w-3.5" />,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  unban_user: {
    icon: <UserCheck className="h-3.5 w-3.5" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  edit_user: {
    icon: <Edit className="h-3.5 w-3.5" />,
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  update_bet_status: {
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  approve_withdrawal: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  reject_withdrawal: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
  },
  create_custom_event: {
    icon: <Edit className="h-3.5 w-3.5" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  update_custom_event: {
    icon: <Edit className="h-3.5 w-3.5" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  settle_custom_event: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  },
  other: {
    icon: <Eye className="h-3.5 w-3.5" />,
    color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  },
}

// Per-admin color map: dikie → purple, hellen → pink, mwalimu → blue
const ADMIN_COLORS: Record<string, string> = {
  dikie: "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400",
  hellen: "bg-pink-500/15 text-pink-700 border-pink-500/30 dark:text-pink-400",
  mwalimu: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
}

function AdminBadge({ name }: { name: string }) {
  const cls = ADMIN_COLORS[name.toLowerCase()] ?? "bg-muted text-foreground border-border"
  return (
    <Badge variant="outline" className={`text-xs capitalize ${cls}`}>
      {name}
    </Badge>
  )
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
  const [search, setSearch] = useState<string>("")
  const [selectedAdmin, setSelectedAdmin] = useState<string>("")
  const [selectedActionType, setSelectedActionType] = useState<string>("")
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [allLogs, setAllLogs] = useState<AdminLog[]>([])
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [previousCursors, setPreviousCursors] = useState<(string | undefined)[]>([undefined])

  const PAGE_SIZE = 20

  // Fetch logs with pagination
  const logs = useQuery(api.audit.logger.getAdminLogs, {
    limit: PAGE_SIZE,
    cursor: cursor,
  })

  // Update local state when logs are fetched
  React.useEffect(() => {
    if (logs) {
      setAllLogs(logs.logs)
      setHasMore(logs.hasMore)
      setNextCursor(logs.nextCursor ?? undefined)
    }
  }, [logs])

  // Filter logs based on selected filters and search
  const filteredLogs = useMemo(() => {
    if (!allLogs) return []

    return allLogs.filter((log: AdminLog) => {
      // Admin filter
      if (selectedAdmin && log.adminName !== selectedAdmin) {
        return false
      }

      // Action type filter
      if (selectedActionType && log.actionType !== selectedActionType) {
        return false
      }

      // Search filter
      if (search) {
        const query = search.toLowerCase()
        return (
          log.adminName.toLowerCase().includes(query) ||
          log.actionType.toLowerCase().includes(query) ||
          log.resourceDescription.toLowerCase().includes(query) ||
          log.resourceType.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [allLogs, selectedAdmin, selectedActionType, search])

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert("No logs to export")
      return
    }

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

  const handleNextPage = () => {
    if (nextCursor) {
      setPreviousCursors([...previousCursors, cursor])
      setCursor(nextCursor)
    }
  }

  const handlePreviousPage = () => {
    if (previousCursors.length > 1) {
      const newPreviousCursors = previousCursors.slice(0, -1)
      setPreviousCursors(newPreviousCursors)
      setCursor(newPreviousCursors[newPreviousCursors.length - 1])
    }
  }

  if (!isAdmin) {
    return null
  }

  if (!logs) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-lg font-bold tracking-tight">Admin Logs</h1>
        <p className="text-xs text-muted-foreground">View all admin actions and activities.</p>
      </div>

      {/* Filters Bar - Same as custom-events */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="h-8 bg-muted/50 pl-8 text-xs focus-visible:ring-primary"
          />
        </div>

        {/* Admin Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border text-xs"
            >
              {selectedAdmin || "All Admins"}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={() => setSelectedAdmin("")}
              className={!selectedAdmin ? "bg-accent" : ""}
            >
              All Admins
            </DropdownMenuItem>
            {["dikie", "hellen", "mwalimu"].map((name) => (
              <DropdownMenuItem
                key={name}
                onClick={() => setSelectedAdmin(name)}
                className={selectedAdmin === name ? "bg-accent" : ""}
              >
                {name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Action Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border text-xs"
            >
              {ACTION_TYPES.find((a) => a.value === selectedActionType)?.label || "All Actions"}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={() => setSelectedActionType("")}
              className={!selectedActionType ? "bg-accent" : ""}
            >
              All Actions
            </DropdownMenuItem>
            {ACTION_TYPES.map((action) => (
              <DropdownMenuItem
                key={action.value}
                onClick={() => setSelectedActionType(action.value)}
                className={selectedActionType === action.value ? "bg-accent" : ""}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Button */}
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-border text-xs"
          disabled={!filteredLogs || filteredLogs.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            {allLogs.length === 0
              ? "No logs recorded yet"
              : "No logs match your filters"}
          </p>
        </div>
      ) : (
        <>
          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="h-9 font-semibold text-xs text-foreground">Admin</TableHead>
                  <TableHead className="h-9 font-semibold text-xs text-foreground">Action</TableHead>
                  <TableHead className="h-9 font-semibold text-xs text-foreground">Description</TableHead>
                  <TableHead className="h-9 font-semibold text-xs text-foreground">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: AdminLog) => {
                  const action = actionIconMap[log.actionType] || actionIconMap.other
                  return (
                    <TableRow key={log._id} className="border-border hover:bg-muted/30 transition-colors h-9">
                      <TableCell className="py-1.5 text-xs">
                        <AdminBadge name={log.adminName} />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium", action.color)}>
                          {action.icon}
                          <span>{ACTION_TYPES.find((a) => a.value === log.actionType)?.label || log.actionType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <span className="text-xs text-muted-foreground">{log.resourceDescription}</span>
                      </TableCell>
                      <TableCell className="py-1.5 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "MMM dd, HH:mm")}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── Mobile list (cards) ── */}
          <div className="sm:hidden space-y-2">
            {filteredLogs.map((log: AdminLog) => {
              const action = actionIconMap[log.actionType] || actionIconMap.other
              return (
                <div key={log._id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <AdminBadge name={log.adminName} />
                        <div className={cn("inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium", action.color)}>
                          {action.icon}
                          <span>{ACTION_TYPES.find((a) => a.value === log.actionType)?.label || log.actionType}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{log.resourceDescription}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap pt-0.5">{format(new Date(log.timestamp), "MMM dd, HH:mm")}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination Controls ── */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-xs text-muted-foreground">
              Page {previousCursors.length} • Showing {filteredLogs.length} logs per page
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousPage}
                disabled={previousCursors.length === 1}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={!hasMore}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
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
