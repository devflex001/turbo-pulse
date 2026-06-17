"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { AdminUsersPanel } from "@/components/admin-users-panel"
import { AdminScraperPanel } from "@/components/admin-scraper-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  Search,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  Mail,
  BarChart3,
  FileText,
  Database,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Download,
  PlayCircle,
  PlusCircle,
  Menu,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ─── Chart Data ───────────────────────────────────────────────────────────────

const DEPOSIT_TREND_DATA = [
  { day: "Fri, 12 Jun", amount: 10000 },
  { day: "Sat, 13 Jun", amount: 7500 },
  { day: "Sun, 14 Jun", amount: 11000 },
  { day: "Mon, 15 Jun", amount: 5000 },
  { day: "Tue, 16 Jun", amount: 1800 },
]

const USER_REG_DATA = [
  { day: "1 Jun", count: 52 },
  { day: "Fri, 12 Jun", count: 4 },
  { day: "Sat, 13 Jun", count: 14 },
  { day: "Sun, 14 Jun", count: 11 },
  { day: "Mon, 15 Jun", count: 9 },
  { day: "Tue, 16 Jun", count: 4 },
]

// ─── Nav config ───────────────────────────────────────────────────────────────

const coreNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "bets", label: "Bets", icon: Trophy },
  { id: "payments", label: "Payments", icon: ArrowUpRight },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowDownLeft },
]

const operationsNavItems = [
  { id: "scraper", label: "Scraper", icon: Database },
  { id: "events", label: "Events", icon: PlayCircle },
  { id: "custom-events", label: "Custom Events", icon: PlusCircle },
  { id: "risk", label: "Risk", icon: ShieldAlert },
  { id: "newsletter", label: "Newsletter", icon: Mail },
]

const insightsNavItems = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
]

// ─── Sidebar Content (shared between desktop aside and mobile Sheet) ──────────

interface SidebarContentProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed?: boolean
}

function SidebarContent({ activeTab, onTabChange, collapsed = false }: SidebarContentProps) {
  function NavGroup({
    label,
    items,
  }: {
    label: string
    items: typeof coreNavItems
  }) {
    return (
      <div className="space-y-1">
        {!collapsed && (
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2.5">
            {label}
          </h3>
        )}
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start h-9 px-2.5 gap-2.5 font-normal text-xs ${
                isActive
                  ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold"
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon
                className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-3 py-2">
      <NavGroup label="Core" items={coreNavItems} />
      <NavGroup label="Operations" items={operationsNavItems} />
      <div className="mt-auto">
        <NavGroup label="Insights" items={insightsNavItems} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const adminStatus = useQuery(
    api.admin.getAdminStatus,
    isAuthenticated ? {} : "skip"
  )
  const { theme, setTheme } = useTheme()
  const { transactions, adminStats, updateAdminTransactionStatus } = useBetStore()

  const [mounted, setMounted] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [activeTab, setActiveTab] = React.useState("dashboard")
  const [currentTime, setCurrentTime] = React.useState("")

  // Redirect guard
  React.useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.replace("/"); return }
    if (adminStatus !== undefined && !adminStatus.isAdmin) router.replace("/")
  }, [authLoading, isAuthenticated, adminStatus, router])

  React.useEffect(() => {
    let a = true
    const t = setTimeout(() => { if (a) setMounted(true) }, 0)
    return () => { a = false; clearTimeout(t) }
  }, [])

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

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (t.phone?.toLowerCase() || "").includes(q) || t.id.toLowerCase().includes(q)
    })
  }, [transactions, searchQuery])

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
        success: "betflow_transactions_export.csv downloaded!",
        error: "Export failed.",
      }
    )
  }

  // Handle tab change and close mobile sidebar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  const isPageLoading =
    authLoading || !isAuthenticated || adminStatus === undefined

  if (isPageLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm font-medium">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!adminStatus?.isAdmin) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col gap-0 border-r border-border h-full bg-card text-card-foreground shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Brand + collapse toggle */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-border shrink-0">
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight text-foreground select-none truncate">
              BetFlow Admin
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 ml-auto"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </Button>
        </div>

        <SidebarContent
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
        />
      </aside>

      {/* ── Mobile Sidebar (Sheet) ── */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 flex flex-col">
          <SheetHeader className="px-4 h-14 border-b border-border flex-row items-center justify-between space-y-0 shrink-0">
            <SheetTitle className="text-sm font-bold">BetFlow Admin</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </SheetHeader>
          <SidebarContent
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between px-3 sm:px-5 border-b border-border bg-background/95 backdrop-blur-md shrink-0 gap-3">

          {/* Left: Hamburger (mobile) + Search */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 lg:hidden shrink-0"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </Button>

            {/* Search — hidden on xs, visible from sm */}
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-8 pr-3 focus-visible:ring-primary h-8 bg-muted/40 border-muted text-xs"
              />
            </div>

            {/* Active tab label on mobile */}
            <span className="sm:hidden text-sm font-semibold capitalize text-foreground truncate">
              {activeTab === "custom-events" ? "Custom Events" : activeTab}
            </span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme toggle — icon-only on mobile */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 border border-border hover:bg-accent"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="size-3.5 text-primary" />
                ) : (
                  <Moon className="size-3.5" />
                )}
              </Button>
            )}

            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full border border-border hover:bg-muted/50 relative"
              aria-label="Notifications"
            >
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </Button>

            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                B
              </div>
              {/* Name — hidden on small screens */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight">bethwelmax</span>
                <span className="text-[9px] font-medium leading-none text-muted-foreground tracking-wider uppercase">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto h-full space-y-5 scrollbar-thin">

          {/* ── Dashboard Tab ── */}
          {activeTab === "dashboard" && (
            <>
              <div className="space-y-0.5">
                <h1 className="text-lg font-bold tracking-tight">Overview</h1>
                <p className="text-xs text-muted-foreground">
                  Snapshot refreshed at{" "}
                  <span className="font-semibold text-foreground">
                    {currentTime || "Loading..."}
                  </span>
                </p>
              </div>

              {/* Metric Cards — always 3-across, compact on mobile */}
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


              {/* Charts — 1 col on mobile, 2 on lg+ */}
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
                        data={DEPOSIT_TREND_DATA}
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
                        data={USER_REG_DATA}
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
                          className={`size-7 text-[10px] p-0 font-bold ${
                            currentPage === idx + 1
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
            </>
          )}

          {/* ── Users Tab ── */}
          {activeTab === "users" && <AdminUsersPanel />}

          {activeTab === "scraper" && <AdminScraperPanel />}

          {/* ── Placeholder for other tabs ── */}
          {activeTab !== "dashboard" && activeTab !== "users" && activeTab !== "scraper" && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
              <div className="p-4 bg-muted rounded-full">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground capitalize">
                {activeTab === "custom-events" ? "Custom Events" : activeTab} Panel
              </h2>
              <p className="text-xs max-w-sm">
                This section is under construction. Use the Dashboard tab to
                manage metrics and transaction logs.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
