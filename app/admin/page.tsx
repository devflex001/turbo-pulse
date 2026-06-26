"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  MoreHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { transactions, adminStats, updateAdminTransactionStatus } = useBetStore()

  // Real analytics from Convex queries
  const depositTrend = useQuery(api.bets.getDepositTrend, { daysBack: 7 })
  const userRegistrationTrend = useQuery(api.bets.getUserRegistrationTrend, { daysBack: 7 })

  const [currentPage, setCurrentPage] = React.useState(1)
  const [currentTime, setCurrentTime] = React.useState("")

  React.useEffect(() => {
    let a = true
    const t = setTimeout(() => {
      if (a) {
        setCurrentTime(
          new Date().toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          }) + ", " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        )
      }
    }, 0)
    return () => { a = false; clearTimeout(t) }
  }, [])

  const filteredTransactions = transactions

  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredTransactions, currentPage])

  const depositChartConfig = { amount: { label: "Deposits (KES)", color: "var(--primary)" } }
  const userChartConfig = { count: { label: "New Registrations", color: "var(--primary)" } }

  const handleUpdateStatus = (
    txId: string,
    status: "success" | "pending" | "failed",
    errorDetail?: string
  ) => {
    updateAdminTransactionStatus(txId, status, errorDetail)
    toast.success(`Transaction ${txId} updated to ${status}!`)
  }

  const handleExport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: "Compiling transaction logs...",
        success: "betflexx_transactions_export.csv downloaded!",
        error: "Export failed.",
      }
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight">Overview</h1>
          <p className="text-xs text-muted-foreground">
            Snapshot refreshed at{" "}
            <span className="font-semibold text-foreground">
              {currentTime || "Loading..."}
            </span>
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Users */}
          <div className="flex flex-col gap-1 p-2.5 sm:p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-wider uppercase truncate">
              Users
            </span>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-extrabold font-mono leading-none">
                {adminStats.totalUsers}
              </span>
              <Badge
                variant="outline"
                className="text-[8px] sm:text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-none px-1 rounded-sm hidden sm:inline-flex"
              >
                +1.2%
              </Badge>
            </div>
          </div>

          {/* Deposits */}
          <div className="flex flex-col gap-1 p-2.5 sm:p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-wider uppercase truncate">
              Deposits
            </span>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-sm sm:text-2xl font-extrabold font-mono leading-none truncate">
                <span className="hidden sm:inline">KES </span>
                {adminStats.totalDeposits.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Active Bets */}
          <div className="flex flex-col gap-1 p-2.5 sm:p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-wider uppercase truncate">
              Bets
            </span>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-lg sm:text-2xl font-extrabold font-mono leading-none">
                {adminStats.activeBets}
              </span>
              <Badge
                variant="outline"
                className="text-[8px] sm:text-[9px] font-bold bg-sky-500/10 text-sky-600 border-none px-1 rounded-sm"
              >
                Live
              </Badge>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                Deposit Trend
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
              >
                1 Week
              </Badge>
            </div>
            <div className="h-52 w-full">
              <ChartContainer
                config={depositChartConfig}
                className="h-full w-full"
              >
                <AreaChart
                  data={depositTrend || []}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold tracking-tight text-foreground uppercase">
                User Registration Trend
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
              >
                1 Week
              </Badge>
            </div>
            <div className="h-52 w-full">
              <ChartContainer
                config={userChartConfig}
                className="h-full w-full"
              >
                <BarChart
                  data={userRegistrationTrend || []}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="space-y-3 border border-border rounded-xl bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              Recent Activity
            </span>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 font-medium border-border"
            >
              <Download className="size-3.5" /> Export
            </Button>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Time</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTransactions.map((tx, idx) => {
                  const globalIdx =
                    (currentPage - 1) * itemsPerPage + idx + 1
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-muted-foreground">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-3 font-semibold font-mono text-foreground max-w-[130px] truncate">
                        {tx.phone || "Platform Wallet"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0 hover:bg-emerald-500/10 capitalize rounded-sm text-[10px] font-semibold">
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-bold font-mono">
                        KES {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 space-y-1">
                        <Badge
                          className={
                            tx.status === "success"
                              ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 rounded-sm text-[10px] font-bold border border-emerald-500/20"
                              : tx.status === "failed"
                                ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 rounded-sm text-[10px] font-bold border border-rose-500/20"
                                : "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15 rounded-sm text-[10px] font-bold border border-yellow-500/20"
                          }
                        >
                          {tx.status}
                        </Badge>
                        {tx.status === "failed" && tx.errorDetail && (
                          <p className="text-[10px] text-rose-500 leading-tight block">
                            {tx.errorDetail}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">
                        {tx.time}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 hover:bg-muted"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 text-xs"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(tx.id, "success")
                              }
                            >
                              Mark as Success
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(
                                  tx.id,
                                  "failed",
                                  "Request Cancelled by user."
                                )
                              }
                            >
                              Mark as Failed: Cancelled
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(
                                  tx.id,
                                  "failed",
                                  "The balance is insufficient."
                                )
                              }
                            >
                              Mark as Failed: Insufficient
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(
                                  tx.id,
                                  "failed",
                                  "No response from user."
                                )
                              }
                            >
                              Mark as Failed: No Response
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateStatus(tx.id, "pending")
                              }
                            >
                              Revert to Pending
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
            <span className="text-[11px] text-muted-foreground">
              Showing{" "}
              {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)}–
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{" "}
              {filteredTransactions.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 border-border hover:bg-accent"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    variant={currentPage === idx + 1 ? "default" : "outline"}
                    className={`size-7 text-[10px] p-0 font-bold ${currentPage === idx + 1
                      ? "bg-primary text-primary-foreground"
                      : "border-border"
                      }`}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 border-border hover:bg-accent"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
