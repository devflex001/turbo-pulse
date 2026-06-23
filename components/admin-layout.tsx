"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth/AuthContext"
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
import { useBetStore } from "@/hooks/use-bet-store"
import {
  Bell,
  Sun,
  Moon,
  Menu,
  User,
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
} from "lucide-react"

// ─── Nav config ───────────────────────────────────────────────────────────────

const coreNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { id: "users", label: "Users", icon: Users, href: "/admin/users" },
  { id: "bets", label: "Bets", icon: Trophy, href: "/admin/bets" },
  { id: "payments", label: "Payments", icon: ArrowUpRight, href: "/admin/payments" },
  { id: "withdrawals", label: "Withdrawals", icon: ArrowDownLeft, href: "/admin/withdrawals" },
]

const operationsNavItems = [
  { id: "scraper", label: "Scraper", icon: Database, href: "/admin/scraper" },
  { id: "events", label: "Events", icon: PlayCircle, href: "/admin/events" },
  { id: "custom-events", label: "Custom Events", icon: PlusCircle, href: "/admin/custom-events" },
]

const settingsNavItems = [
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

  function renderNavGroup(label: string, items: typeof coreNavItems) {
    return (
      <div className="space-y-1">
        {!collapsed && (
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2.5">
            {label}
          </h3>
        )}
        {items.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.href
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start h-9 px-2.5 gap-2.5 font-normal text-xs ${isActive
                ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold"
                : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => {
                router.push(item.href)
                onNavigate?.()
              }}
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
      {renderNavGroup("Core", coreNavItems)}
      {renderNavGroup("Operations", operationsNavItems)}
      <div className="mt-auto space-y-5">
        {renderNavGroup("System", settingsNavItems)}
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
  const { theme, setTheme } = useTheme()
  const { user } = useBetStore()
  const { isAdmin, isLoading } = useAuth()

  const [mounted, setMounted] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)

  // Check admin access on mount
  React.useEffect(() => {
    let a = true
    const t = setTimeout(() => {
      if (a) {
        if (!isLoading && !isAdmin) {
          router.push("/login")
        } else if (a) {
          setMounted(true)
        }
      }
    }, 100)
    return () => { a = false; clearTimeout(t) }
  }, [isLoading, isAdmin, router])

  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout();
  }

  // Get current page label for mobile header
  const getCurrentLabel = () => {
    const allItems = [...coreNavItems, ...operationsNavItems, ...settingsNavItems]
    const current = allItems.find(item => item.href === pathname)
    return current?.label || pageTitle || "Admin"
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">

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

              {/* Left: Hamburger (mobile) */}
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
                <span className="sm:hidden text-sm font-semibold text-foreground truncate">
                  {getCurrentLabel()}
                </span>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Theme toggle */}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-9 gap-2 rounded-full border border-border px-2 hover:bg-muted/50"
                      aria-label="Admin account menu"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {(user?.username?.[0] ?? "A").toUpperCase()}
                      </span>
                      <span className="hidden min-w-0 flex-col text-left sm:flex">
                        <span className="max-w-28 truncate text-xs font-semibold leading-tight">
                          {user?.username ?? "Admin"}
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
                        <p className="truncate text-sm font-semibold leading-none">
                          {user?.username ?? "Admin"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Administrator
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/")} className="text-xs">
                      <User className="mr-2 size-4" />
                      User site
                    </DropdownMenuItem>
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
