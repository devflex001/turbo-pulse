"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useBetStore } from "@/hooks/use-bet-store"
import { getAuthToken } from "@/lib/auth/jwt"
import { Home, PlayCircle, FileText, User, Receipt, Wallet, ArrowUpRight, ArrowDownLeft, LogOut, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Betslip } from "./betslip"
import { LoginModal, RegisterModal, DepositModal, WithdrawModal } from "./modals"
import { Button } from "@/components/ui/button"

export function BottomNav({ liveCount }: { liveCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const { activeTab, setActiveTab, betslip, walletBalance, logout } = useBetStore()
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)

  const [betslipOpen, setBetslipOpen] = React.useState(false)
  const [loginOpen, setLoginOpen] = React.useState(false)
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [depositOpen, setDepositOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)

  // Check auth status from localStorage
  React.useEffect(() => {
    const token = getAuthToken()
    setIsAuthenticated(!!token)
  }, [])

  // Listen for storage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      const token = getAuthToken()
      setIsAuthenticated(!!token)
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleProfileClick = () => {
    if (isAuthenticated) {
      router.push("/account")
    } else {
      setLoginOpen(true)
    }
  }

  const handleMyBetsClick = () => {
    if (isAuthenticated) {
      router.push("/my-bets")
    } else {
      setLoginOpen(true)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.replace("/")
  }

  return (
    <>
      <div className="lg:hidden h-16 bg-card border-t border-border relative z-40 overflow-visible shrink-0 pb-safe">
        <div className="grid grid-cols-5 h-full items-center text-center">
          {/* Home Tab */}
          <button
            onClick={() => {
              setActiveTab("home")
              router.push("/")
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full text-[10px] font-medium transition-colors",
              (pathname === "/" && activeTab === "home")
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className={cn("size-5", (pathname === "/" && activeTab === "home") ? "text-primary" : "text-muted-foreground")} />
            <span>Home</span>
          </button>

          {/* Live Tab */}
          <button
            onClick={() => {
              setActiveTab("live")
              router.push("/")
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full text-[10px] font-medium transition-colors",
              (pathname === "/" && activeTab === "live")
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PlayCircle className={cn("size-5", (pathname === "/" && activeTab === "live") ? "text-primary" : "text-muted-foreground")} />
            <span>Live ({liveCount})</span>
          </button>

          {/* Betslip FAB */}
          <div className="relative flex justify-center h-full items-center">
            <button
              onClick={() => setBetslipOpen(true)}
              className="absolute -top-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all z-50 border-4 border-background"
            >
              <FileText className="size-6 text-primary-foreground stroke-[2.5]" />
              {betslip.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground border-2 border-primary">
                  {betslip.length}
                </span>
              )}
            </button>
          </div>

          {/* My Bets Tab */}
          <button
            onClick={handleMyBetsClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full text-[10px] font-medium transition-colors",
              pathname === "/my-bets"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Receipt className={cn("size-5", pathname === "/my-bets" ? "text-primary" : "text-muted-foreground")} />
            <span>My Bets</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full text-[10px] font-medium transition-colors",
              pathname === "/account"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className={cn("size-5", pathname === "/account" ? "text-primary" : "text-muted-foreground")} />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Betslip Mobile Drawer/Sheet */}
      <Sheet open={betslipOpen} onOpenChange={setBetslipOpen}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[720px] rounded-t-2xl p-0 flex flex-col gap-0 border-t border-border bg-card">
          <SheetHeader className="p-4 border-b border-border bg-muted/20">
            <SheetTitle className="text-lg font-bold">Betslip Manager</SheetTitle>
            <SheetDescription className="text-xs">
              Review selections and place your bet.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            <Betslip onClose={() => setBetslipOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>



      {/* Auth and transaction modals */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <RegisterModal open={registerOpen} onOpenChange={setRegisterOpen} />
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </>
  )
}
