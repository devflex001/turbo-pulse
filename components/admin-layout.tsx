"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth/AuthContext"
import { useAdminInactivity } from "@/hooks/use-admin-inactivity"
import { AdminInactivityWarning } from "@/components/admin-inactivity-warning"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { NotificationsCenter } from "@/components/notifications-center"
import { ActiveAdminsIndicator } from "@/components/active-admins-indicator"
import {
  Sun,
  Moon,
  Menu,
  LogOut,
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Users,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  Database,
  PlayCircle,
  PlusCircle,
  Settings,
  Zap,
  Globe,
  ServerCog,
  MessageSquare,
  Logs,
} from "lucide-react"

// ─── Nav config ───────────────────────────────────────────────────────────────

const navigationItems = [
  {
    section: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    ],
  },
  {
    section: "Users & Data",
    items: [
      { id: "users", label: "Users", icon: Users, href: "/admin/users" },
      { id: "visitors", label: "Visitors", icon: Globe, href: "/admin/visitors" },
    ],
  },
  {
    section: "Betting",
    items: [
      { id: "bets", label: "Bets", icon: Trophy, href: "/admin/bets" },
      { id: "payments", label: "Payments", icon: ArrowUpRight, href: "/admin/payments" },
      { id: "withdrawals", label: "Withdrawals", icon: ArrowDownLeft, href: "/admin/withdrawals" },
    ],
  },
  {
    section: "Growth",
    items: [
      { id: "referrals", label: "Referrals", icon: Zap, href: "/admin/referrals" },
    ],
  },
  {
    section: "Events",
    items: [
      { id: "events", label: "Events", icon: PlayCircle, href: "/admin/events" },
      { id: "custom-events", label: "Custom Events", icon: PlusCircle, href: "/admin/custom-events" },
    ],
  },
  {
    section: "Operations",
    items: [
      { id: "scraper", label: "Scraper", icon: Database, href: "/admin/scraper" },
      { id: "redis", label: "Redis", icon: ServerCog, href: "/admin/redis" },
      { id: "logs", label: "Logs", icon: Logs, href: "/admin/logs" },
      { id: "support", label: "Support", icon: MessageSquare, href: "/admin/support" },
    ],
  },
]

const settingsItems = [
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
]

// ─── Sidebar Content ──────────────────────────────────────────────────────────

interface SidebarContentProps {
  currentPath: string
  collapsed?: boolean
  onNavigate?: () => void
}

function SidebarContent({ currentPath, collapsed = false, onNavigate }: SidebarContentProps) {
  const router = useRouter()

  function renderNavItem(item: { id: string; label: string; icon: React.ComponentType<{ className: string }>; href: string }, isActive: boolean) {
    const Icon = item.icon
    return (
      <Button
        key={item.id}
        variant="ghost"
        className={`w-full justify-start h-8 px-2.5 gap-2.5 font-normal text-xs ${isActive
          ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          }`}
        onClick={() => {
          router.push(item.href)
          onNavigate?.()
        }}
      >
        <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        {!collapsed && <span>{item.label}</span>}
      </Button>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable nav sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4">
        {navigationItems.map((section) => (
          <div key={section.section} className="space-y-1">
            {!collapsed && (
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1.5">
                {section.section}
              </h3>
            )}
            {section.items.map((item) => renderNavItem(item, currentPath === item.href))}
          </div>
        ))}
      </div>

      {/* Fixed settings at bottom */}
      <div className="border-t border-border px-2.5 py-2 shrink-0 bg-card">
        {/* {!collapsed && (
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-1.5">
            System
          </h3>
        )} */}
        {settingsItems.map((item) => renderNavItem(item, currentPath === item.href))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode
  pageTitle?: string
}

export function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin, isLoading, adminName } = useAuth()

  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  // Admin inactivity detection
  // warningTime: inactivity before warning appears
  // logoutTime: countdown duration shown in the warning dialog
  const {
    showWarning,
    countdown,
    extendSession,
    logoutNow,
  } = useAdminInactivity({
    warningTime: 9 * 60 * 1000, // show warning after 9 min of inactivity
    logoutTime: 60 * 1000,       // 60-second countdown before auto-logout
    onLogout: () => router.push("/"),
  })

  // Check admin access on mount
  React.useEffect(() => {
    let a = true
    const t = setTimeout(() => {
      if (a) {
        if (!isLoading && !isAdmin) {
          router.push("/")
        } else if (a) {
          setMounted(true)
        }
      }
    }, 100)
    return () => { a = false; clearTimeout(t) }
  }, [isLoading, isAdmin, router])

  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

      {/* Admin Inactivity Warning Modal */}
      <AdminInactivityWarning
        open={showWarning}
        countdown={countdown}
        onExtendSession={extendSession}
        onLogoutNow={logoutNow}
      />

      {/* Show loading or redirect if not admin */}
      {!mounted && (
        <div className="flex h-full w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}

      {mounted && (
        <>
          {/* ── Desktop Sidebar ── */}
          <aside
            className={`hidden lg:flex flex-col gap-0 border-r border-border h-full bg-card text-card-foreground shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-60"
              }`}
          >
            {/* Brand + collapse toggle */}
            <div className="flex items-center justify-between px-3 h-14 border-b border-border shrink-0">
              {!sidebarCollapsed && (
                <span className="text-sm font-bold tracking-tight text-foreground select-none truncate">
                  BetFlexx Admin
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
                  <ChevronLeft className="size-4" />
                )}
              </Button>
            </div>

            <SidebarContent
              currentPath={pathname}
              collapsed={sidebarCollapsed}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </aside>

          {/* ── Mobile Sidebar (Sheet) ── */}
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SheetHeader className="px-4 h-14 border-b border-border flex-row items-center justify-between space-y-0 shrink-0">
                <SheetTitle className="text-sm font-bold">BetFlexx Admin</SheetTitle>
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
                currentPath={pathname}
                collapsed={false}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* ── Main Content ── */}
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

            {/* Top Navbar */}
            <header className="flex h-14 items-center justify-between px-3 sm:px-5 border-b border-border bg-background/95 backdrop-blur-md shrink-0 gap-3">

              {/* Left: Hamburger (mobile) + Active Admins (desktop) */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 lg:hidden shrink-0"
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="size-4" />
                </Button>
                <div className="hidden md:block ml-auto">
                  <ActiveAdminsIndicator />
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Theme toggle */}
                {mounted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-accent"
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                  >
                    {resolvedTheme === "dark" ? (
                      <Sun className="size-3.5 text-primary" />
                    ) : (
                      <Moon className="size-3.5" />
                    )}
                  </Button>
                )}

                <NotificationsCenter />

                {/* User Avatar */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-9 gap-2 rounded-full sm:border sm:border-border px-2 hover:bg-muted/50"
                      aria-label="Admin account menu"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {(adminName?.[0] ?? "A").toUpperCase()}
                      </span>
                      <span className="hidden min-w-0 flex-col text-left sm:flex">
                        <span className="max-w-28 truncate text-xs font-semibold leading-tight capitalize">
                          {adminName ?? "Admin"}
                        </span>
                        <span className="text-[9px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
                          Admin
                        </span>
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="truncate text-sm font-semibold leading-none capitalize">
                          {adminName ?? "Admin"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Administrator
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-xs text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 size-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* Mobile-only: active admins strip — hidden on md+ where it shows in the navbar */}
            <div className="md:hidden">
              <ActiveAdminsIndicator mobileStrip />
            </div>

            {/* Scrollable content */}
            <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto h-full scrollbar-thin">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  )
}
