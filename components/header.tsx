"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { useBetStore } from "@/hooks/use-bet-store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Wallet,
  User,
  LogOut,
  History,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Settings,
  ArrowUpRight,
  Menu,
  MessageCircle,
} from "lucide-react"
import {
  LoginModal,
  RegisterModal,
  DepositModal,
  WithdrawModal
} from "./modals"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Betslip } from "./betslip"
import { Sidebar } from "./sidebar"
import { NotificationsCenter } from "./notifications-center"
import { openSupportChat } from "@/lib/support-chat"

export function Header() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const {
    walletBalance,
    searchQuery,
    setSearchQuery,
    setActiveTab,
    betslip
  } = useBetStore()

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [depositOpen, setDepositOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)
  const [betslipOpen, setBetslipOpen] = React.useState(false)
  const [showMobileSearch, setShowMobileSearch] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)

  const handleLogoClick = () => {
    setActiveTab("home")
    setSearchQuery("")
    setShowMobileSearch(false)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md flex-shrink-0">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-3">

          {/* Brand/Logo - Increased height to h-12 (mobile) and h-14 (desktop) */}
          <div className="flex items-center gap-1.5 md:justify-self-start">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-muted-foreground hover:text-foreground size-8 rounded-full shrink-0"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 h-full flex flex-col border-r border-border bg-card">
                <SheetHeader className="px-6 pt-6 pb-2 border-b border-border bg-muted/20 flex-shrink-0">
                  <SheetTitle className="text-left text-sm font-bold flex items-center gap-2">
                    <img src="/images/logo.png" alt="BetFlexx Logo" className="h-8 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <Sidebar className="w-full border-r-0 h-full" onClose={() => setMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
              <img
                src="/images/logo.png"
                alt="BetFlexx Logo"
                className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105"
              />
            </div>
          </div>

          {/* Search bar (Desktop) */}
          <div className="hidden md:flex relative max-w-md w-full justify-self-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search teams, leagues or match IDs..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 focus-visible:ring-[#4b9f71] h-9 w-full bg-muted/40 border-muted"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {/* User Operations / Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 md:justify-self-end">
            {/* Search Icon toggler for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground size-8 rounded-full"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              {showMobileSearch ? <X className="size-4" /> : <Search className="size-4" />}
            </Button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Wallet Balance Display - Only show if logged in */}
              {user && (
                <>
                  <NotificationsCenter />
                  <Button
                    onClick={() => router.push("/deposit")}
                    variant="ghost"
                    className="flex items-center gap-2 bg-muted/50 px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold border border-border hover:bg-muted text-foreground h-auto"
                  >
                    <Wallet className="size-3.5 text-[#4b9f71]" />
                    <span>KES {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </Button>
                </>
              )}

              {/* User menu dropdown - Show login/signup for non-logged-in users */}
              {isLoading ? (
                // Show skeleton loaders while auth is loading
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full border border-border hover:bg-muted/50 shrink-0">
                      <User className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user.phone}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.role === "admin" ? "Admin" : "User"} Account
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="sm:hidden flex items-center justify-between text-xs py-2">
                      <span className="flex items-center gap-2"><Wallet className="size-3.5 text-[#4b9f71]" /> Balance:</span>
                      <span className="font-semibold">KES {walletBalance.toLocaleString()}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        openSupportChat()
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                      <span>Support Chat</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/account")}>
                      <User className="mr-2 h-4 w-4 text-blue-500" />
                      <span>My Account</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/deposit")}>
                      <ArrowDownToLine className="mr-2 h-4 w-4 text-[#4b9f71]" />
                      <span>Deposit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setWithdrawOpen(true)}>
                      <ArrowUpFromLine className="mr-2 h-4 w-4 text-rose-500" />
                      <span>Withdraw Winnings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("mybets")}>
                      <History className="mr-2 h-4 w-4 text-blue-500" />
                      <span>My Placed Bets</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    onClick={() => setLoginOpen(true)}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-semibold"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => setRegisterOpen(true)}
                    size="sm"
                    className="bg-[#4b9f71] text-white font-semibold h-8 text-xs hover:bg-[#3e865f]"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Mobile Search Card */}
        {showMobileSearch && (
          <div className="md:hidden border-t border-border bg-background p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues or match IDs..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 focus-visible:ring-[#4b9f71] h-9 w-full bg-muted/40 border-muted text-xs"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Modal Dialog wrappers */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  )
}
