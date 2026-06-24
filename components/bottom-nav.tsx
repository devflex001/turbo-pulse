"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useBetStore } from "@/hooks/use-bet-store"
import { useAuth } from "@/lib/auth/AuthContext"
import { Home, PlayCircle, FileText, User, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Betslip } from "./betslip"
import { LoginModal } from "./modals"

export function BottomNav({ liveCount }: { liveCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const { activeTab, setActiveTab, setSelectedLeague, betslip } = useBetStore()
  const { user, isLoading } = useAuth()

  const [betslipOpen, setBetslipOpen] = React.useState(false)
  const [loginOpen, setLoginOpen] = React.useState(false)

  const handleHomeClick = () => {
    setActiveTab("home")
    setSelectedLeague("All Leagues")
    router.push("/")
  }

  const handleLiveClick = () => {
    router.push("/live")
  }

  const handleProfileClick = () => {
    if (user || isLoading) {
      router.push("/account")
    } else {
      setLoginOpen(true)
    }
  }

  const handleMyBetsClick = () => {
    if (user || isLoading) {
      router.push("/my-bets")
    } else {
      setLoginOpen(true)
    }
  }

  return (
    <>
      <div className="pb-safe relative z-40 h-16 shrink-0 overflow-visible border-t border-border bg-card lg:hidden">
        <div className="grid h-full grid-cols-5 items-center text-center">
          {/* Home Tab */}
          <button
            onClick={handleHomeClick}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              pathname === "/" && activeTab === "home"
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home
              className={cn(
                "size-5",
                pathname === "/" && activeTab === "home"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />
            <span>Home</span>
          </button>

          {/* Live Tab */}
          <button
            onClick={handleLiveClick}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              pathname === "/live"
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PlayCircle
              className={cn(
                "size-5",
                pathname === "/live" ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span>Live ({liveCount})</span>
          </button>

          {/* Betslip FAB */}
          <div className="relative flex h-full items-center justify-center">
            <button
              onClick={() => setBetslipOpen(true)}
              className="absolute -top-5 z-50 flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-95"
            >
              <FileText className="size-6 stroke-[2.5] text-primary-foreground" />
              {betslip.length > 0 && (
                <span className="text-destructive-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-destructive text-[10px] font-bold">
                  {betslip.length}
                </span>
              )}
            </button>
          </div>

          {/* My Bets Tab */}
          <button
            onClick={handleMyBetsClick}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              pathname === "/my-bets"
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Receipt
              className={cn(
                "size-5",
                pathname === "/my-bets"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />
            <span>My Bets</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={handleProfileClick}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              pathname === "/account"
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User
              className={cn(
                "size-5",
                pathname === "/account"
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Betslip Mobile Drawer/Sheet */}
      <Sheet open={betslipOpen} onOpenChange={setBetslipOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[85vh] max-h-[720px] flex-col gap-0 rounded-t-2xl border-t border-border bg-card p-0"
        >
          <SheetHeader className="border-b border-border bg-muted/20 p-4">
            <SheetTitle className="text-lg font-bold">
              Betslip Manager
            </SheetTitle>
            <SheetDescription className="text-xs">
              Review selections and place your bet.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <Betslip onClose={() => setBetslipOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Auth and transaction modals */}
      <LoginModal open={loginOpen && !user} onOpenChange={setLoginOpen} />
    </>
  )
}
