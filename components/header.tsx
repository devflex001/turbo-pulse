"use client"

import * as React from "react"
import { useBetStore } from "@/hooks/use-bet-store"
import { Input } from "@/components/ui/input"
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
  Search, 
  Wallet, 
  User, 
  LogOut, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  LayoutDashboard
} from "lucide-react"
import { 
  LoginModal, 
  RegisterModal, 
  DepositModal, 
  WithdrawModal 
} from "./modals"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Betslip } from "./betslip"
import { useRoleRouter } from "@/hooks/use-role-router"
import { useRouter } from "next/navigation"

export function Header() {
  const { 
    user, 
    walletBalance, 
    logout, 
    searchQuery, 
    setSearchQuery, 
    setActiveTab,
    betslip
  } = useBetStore()

  // Role-based routing: admins are redirected to /admin on auth
  const { isAdmin } = useRoleRouter()
  const router = useRouter()

  const [loginOpen, setLoginOpen] = React.useState(false)
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [depositOpen, setDepositOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)
  const [betslipOpen, setBetslipOpen] = React.useState(false)
  const [showMobileSearch, setShowMobileSearch] = React.useState(false)

  const handleLogoClick = () => {
    setActiveTab("home")
    setSearchQuery("")
    setShowMobileSearch(false)
  }

  const handleLogout = async () => {
    await logout()
    router.replace("/")
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-3">
          {/* Brand/Logo */}
          <div className="flex items-center gap-2 cursor-pointer md:justify-self-start" onClick={handleLogoClick}>
            <span className="text-xl font-bold tracking-tight text-foreground">
              BetFlow
            </span>
          </div>

          {/* Search bar (Desktop) */}
          <div className="hidden md:flex relative max-w-md w-full justify-self-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search teams, leagues or match IDs..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 focus-visible:ring-primary h-9 w-full bg-muted/40 border-muted"
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

            {/* Betslip Sheet trigger for mobile/tablet (always accessible) */}
            <div className="hidden lg:block xl:hidden">
              <Sheet open={betslipOpen} onOpenChange={setBetslipOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative h-8 px-2 sm:px-2.5 text-xs font-semibold border-border flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Betslip</span>
                    <span className="sm:hidden">Slip</span>
                    {betslip.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground border border-background">
                        {betslip.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l border-border bg-card">
                  <SheetHeader className="p-4 border-b border-border bg-muted/20">
                    <SheetTitle className="text-lg font-bold">Betslip Manager</SheetTitle>
                    <SheetDescription className="text-xs">
                      Review your selections and place your accumulator or single bets.
                    </SheetDescription>
                  </SheetHeader>
                  <Betslip onClose={() => setBetslipOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Wallet Balance Display */}
                <div className="hidden sm:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md text-xs font-semibold border border-border">
                  <Wallet className="size-3.5 text-primary" />
                  <span>KES {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {/* Deposit action */}
                <Button
                  onClick={() => router.push("/deposit")}
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold px-2.5 sm:px-3 h-8 text-xs hover:opacity-90 flex items-center gap-1"
                >
                  <ArrowUpRight className="size-3.5" />
                  <span className="hidden sm:inline">Deposit</span>
                </Button>

                {/* User menu dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full border border-border hover:bg-muted/50 shrink-0">
                      <User className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {isAdmin ? "Administrator" : "Registered User"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push("/admin")} className="text-primary focus:text-primary">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="sm:hidden flex items-center justify-between text-xs py-2">
                      <span className="flex items-center gap-2"><Wallet className="size-3.5" /> Balance:</span>
                      <span className="font-semibold">KES {walletBalance.toLocaleString()}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/deposit")}>
                      <ArrowUpRight className="mr-2 h-4 w-4 text-emerald-500" />
                      <span>Deposit (M-Pesa)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setWithdrawOpen(true)}>
                      <ArrowDownLeft className="mr-2 h-4 w-4 text-rose-500" />
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
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setLoginOpen(true)}
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs font-semibold hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => setRegisterOpen(true)}
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold px-3 sm:px-4 h-8 text-xs hover:opacity-90"
                >
                  Register
                </Button>
              </div>
            )}
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
                className="pl-9 pr-8 focus-visible:ring-primary h-9 w-full bg-muted/40 border-muted text-xs"
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
