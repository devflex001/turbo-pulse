"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
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
  ChartTooltipContent 
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
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal, 
  Download, 
  PlayCircle,
  PlusCircle,
  Menu,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"

// Mock Chart data for last 5 days matching the screenshot trends
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

export default function AdminDashboard() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const adminStatus = useQuery(
    api.admin.getAdminStatus,
    isAuthenticated ? {} : "skip"
  )
  const { theme, setTheme } = useTheme()
  const { 
    transactions, 
    adminStats, 
    updateAdminTransactionStatus 
  } = useBetStore()

  const [mounted, setMounted] = React.useState(false)

  // Redirect logic: only redirect once we know auth + admin status
  React.useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace("/")
      return
    }
    if (adminStatus !== undefined && !adminStatus.isAdmin) {
      router.replace("/")
    }
  }, [authLoading, isAuthenticated, adminStatus, router])

  // Independent layout states
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [activeTab, setActiveTab] = React.useState("dashboard")

  // Ensure theme logic compiles cleanly without server-side hydrated warnings
  React.useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) setMounted(true)
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [])

  // Time stamp state
  const [currentTime, setCurrentTime] = React.useState("")
  React.useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      if (active) {
        setCurrentTime(new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }) + ", " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
      }
    }, 0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [])

  // Filter transactions based on phone/id search query
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const phone = t.phone?.toLowerCase() || ""
      const id = t.id.toLowerCase()
      return phone.includes(query) || id.includes(query)
    })
  }, [transactions, searchQuery])

  // Pagination bounds (5 items per page)
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredTransactions, currentPage])

  // Chart configuration for ShadCN Charts
  const depositChartConfig = {
    amount: {
      label: "Deposits (KES)",
      color: "var(--primary)",
    },
  }

  
  const userChartConfig = {
    count: { 
      label: "New Registrations",
      color: "var(--primary)",
    },
  }

  // Handle transaction status adjustments by admin
  const handleUpdateStatus = (
    txId: string, 
    status: "success" | "pending" | "failed", 
    errorDetail?: string
  ) => {
    updateAdminTransactionStatus(txId, status, errorDetail)
    toast.success(`Transaction ${txId} updated to ${status}!`)
  }

  // Mock Export trigger
  const handleExport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: "Compiling transactions logs...",
        success: "betflow_transactions_export.csv downloaded successfully!",
        error: "Export compilation failed.",
      }
    )
  }

  // Navigation Items
  const coreNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "bets", label: "Bets", icon: Trophy },
    { id: "payments", label: "Payments", icon: ArrowUpRight },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowDownLeft },
  ]

  const operationsNavItems = [
    { id: "events", label: "Events", icon: PlayCircle },
    { id: "custom-events", label: "Custom Events", icon: PlusCircle },
    { id: "risk", label: "Risk", icon: ShieldAlert },
    { id: "newsletter", label: "Newsletter", icon: Mail },
  ]

  const insightsNavItems = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
  ]

  const isPageLoading = authLoading || !isAuthenticated || adminStatus === undefined

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

  if (!adminStatus?.isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* 1. Left Sidebar Workspace Navigation */}
      <aside className={`flex flex-col gap-6 py-6 border-r border-border h-full bg-card text-card-foreground shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}>
        {/* Brand / Toggle Logo */}
        <div className="flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5 select-none">
              <span className="bg-primary text-primary-foreground font-black px-1.5 py-0.5 rounded text-xs">WORKSPACE</span>
              BetFlow
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Menu className="size-4" />
          </Button>
        </div>

        {/* Section Navigation Groups */}
        <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-3">
          {/* Core group */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2.5">Core</h3>
            )}
            {coreNavItems.map((item) => {
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
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Button>
              )
            })}
          </div>

          {/* Operations group */}
          <div className="space-y-1">
            {!sidebarCollapsed && (
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2.5">Operations</h3>
            )}
            {operationsNavItems.map((item) => {
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
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Button>
              )
            })}
          </div>

          {/* Insights group */}
          <div className="space-y-1 mt-auto">
            {!sidebarCollapsed && (
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2.5">Insights</h3>
            )}
            {insightsNavItems.map((item) => {
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
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* 2. Right Main Application View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header Dashboard utilities */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-background/95 backdrop-blur-md shrink-0">
          {/* Universal Search bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Universal search..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 focus-visible:ring-primary h-9 w-full bg-muted/40 border-muted text-xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
              ⌘K
            </span>
          </div>

          {/* User metadata & controllers */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle (Light/Dark) */}
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs gap-1.5 font-medium border-border hover:bg-accent"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="size-3.5 text-primary" /> Light
                  </>
                ) : (
                  <>
                    <Moon className="size-3.5" /> Dark
                  </>
                )}
              </Button>
            )}

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="size-8 rounded-full border border-border hover:bg-muted/50 relative">
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </Button>

            {/* User Profile display */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                B
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight">bethwelmax</span>
                <span className="text-[9px] font-medium leading-none text-muted-foreground tracking-wider uppercase">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* independent main scrollable body */}
        <main className="flex-1 p-6 overflow-y-auto h-full space-y-6 scrollbar-thin">
          
          {activeTab === "dashboard" ? (
            <>
              {/* Snapshot header */}
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight">Overview</h1>
                <p className="text-xs text-muted-foreground">
                  Live platform snapshot refreshed at <span className="font-semibold text-foreground">{currentTime || "Loading..."}</span>
                </p>
              </div>

              {/* Grid of 3 platform metrics cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Users Card */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Total Users</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold font-mono">{adminStats.totalUsers}</span>
                    <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-none px-1 rounded-sm">
                      +1.2%
                    </Badge>
                  </div>
                </div>

                {/* Deposits Card */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Total Deposits</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold font-mono">KES {adminStats.totalDeposits.toLocaleString()}</span>
                  </div>
                </div>

                {/* Active Bets Card */}
                <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-card border border-border text-card-foreground shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Active Bets</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold font-mono">{adminStats.activeBets}</span>
                    <Badge variant="outline" className="text-[9px] font-bold bg-sky-500/10 text-sky-600 border-none px-1 rounded-sm">
                      Live
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Two columns layout for charts (Deposit Trend & User Reg) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Deposit Trend Area Chart */}
                <div className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground space-y-4 shadow-sm">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold tracking-tight text-foreground uppercase">Deposit Trend</span>
                    <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded">
                      1 Week
                    </Badge>
                  </div>
                  
                  <div className="h-60 w-full">
                    <ChartContainer config={depositChartConfig} className="h-full w-full">
                      <AreaChart
                        data={DEPOSIT_TREND_DATA}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="day" 
                          stroke="var(--muted-foreground)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="var(--muted-foreground)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#10b981" // Custom solid primary color matching screenshot
                          fill="#10b981"
                          fillOpacity={0.12} // Solid fill with opacity (no gradient as per agents.md)
                          strokeWidth={2}
                          activeDot={{ r: 4 }}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </div>

                {/* 2. User Registration Trend Bar Chart */}
                <div className="flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground space-y-4 shadow-sm">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold tracking-tight text-foreground uppercase">User Registration Trend</span>
                    <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded">
                      1 Week
                    </Badge>
                  </div>

                  <div className="h-60 w-full">
                    <ChartContainer config={userChartConfig} className="h-full w-full">
                      <BarChart
                        data={USER_REG_DATA}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="day" 
                          stroke="var(--muted-foreground)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="var(--muted-foreground)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="count" 
                          fill="#3b82f6" // Custom solid blue matching screenshot
                          radius={[4, 4, 0, 0]} 
                          maxBarSize={30}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>

              </div>

              {/* Recent Activity Section */}
              <div className="space-y-3.5 border border-border rounded-xl bg-card p-4 text-card-foreground shadow-sm">
                
                {/* Table Title and Actions */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-bold text-foreground">Recent Activity</span>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs gap-1.5 font-medium border-border"
                  >
                    <Download className="size-3.5" /> Export
                  </Button>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">Phone</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Time</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedTransactions.map((tx, idx) => {
                        const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1
                        return (
                          <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3.5 px-3 font-medium text-muted-foreground">{globalIdx}</td>
                            <td className="py-3.5 px-3 font-semibold font-mono text-foreground">{tx.phone || "Platform Wallet"}</td>
                            <td className="py-3.5 px-3">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0 hover:bg-emerald-500/10 capitalize rounded-sm text-[10px] font-semibold">
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-3 font-bold font-mono">KES {tx.amount.toLocaleString()}</td>
                            <td className="py-3.5 px-3 space-y-1">
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
                            <td className="py-3.5 px-3 text-muted-foreground">{tx.time}</td>
                            <td className="py-3.5 px-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-7 hover:bg-muted">
                                    <MoreHorizontal className="size-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "success")}>
                                    Mark as Success
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "failed", "Request Cancelled by user.")}>
                                    Mark as Failed: Cancelled
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "failed", "The balance is insufficient for the transaction.")}>
                                    Mark as Failed: Insufficient
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "failed", "No response from user.")}>
                                    Mark as Failed: No Response
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(tx.id, "pending")}>
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

                {/* Table pagination footer matching screenshot design */}
                <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
                            currentPage === idx + 1 ? "bg-primary text-primary-foreground" : "border-border"
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
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
              <div className="p-4 bg-muted rounded-full">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground capitalize">{activeTab} Panel</h2>
              <p className="text-xs max-w-sm">
                This section of the BetFlow admin workspace is mock-represented. Use the Dashboard tab to manage metrics and transaction logs.
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
