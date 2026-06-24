"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/modals"
import { getAuthToken, getUserData } from "@/lib/auth/jwt"
import { useBetStore } from "@/hooks/use-bet-store"
import {
  ArrowLeft,
  User,
  Phone,
  LogOut,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { walletBalance, logout } = useBetStore()
  const [user, setUser] = React.useState<any>(null)
  const [loginOpen, setLoginOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const token = getAuthToken()
    const userData = getUserData()

    if (!token || !userData) {
      setLoginOpen(true)
      setMounted(true)
    } else {
      setUser({
        _id: userData.userId,
        phone: userData.phone,
        role: userData.role,
      })
      setMounted(true)
    }
  }, [])

  React.useEffect(() => {
    const handleStorageChange = () => {
      const token = getAuthToken()
      const userData = getUserData()

      if (!token || !userData) {
        setUser(null)
        setLoginOpen(true)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  if (!mounted) {
    return null
  }

  if (!user) {
    return <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <div className="max-w-md w-full mx-auto space-y-6">
              {/* Back Button & Title */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="size-8 rounded-full border border-border hover:bg-muted/50 shrink-0 hidden sm:inline-flex"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <h1 className="text-xl font-bold text-foreground">My Profile</h1>
              </div>

              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="flex items-center justify-center size-14 rounded-full bg-[#4b9f71]/10 border-2 border-[#4b9f71]/30 shrink-0">
                  <User className="size-7 text-[#4b9f71]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">{user.phone}</h2>
                  <p className="text-xs text-muted-foreground">Your account</p>
                </div>
              </div>

              {/* Wallet Balance */}
              <div className="flex items-center justify-between bg-muted/40 p-4 rounded-lg border border-border">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">Wallet Balance</span>
                  <span className="text-2xl font-bold font-mono">KES {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => router.push("/deposit")}
                  className="bg-[#4b9f71] text-white font-semibold h-10 text-sm hover:bg-[#3e865f]"
                >
                  <ArrowDownToLine className="size-4 mr-2" /> Deposit
                </Button>
                <Button
                  variant="outline"
                  className="font-semibold h-10 text-sm border-border"
                  onClick={() => router.push("/withdraw")}
                >
                  <ArrowUpFromLine className="size-4 mr-2" /> Withdraw
                </Button>
              </div>

              {/* Account Details */}
              <div className="space-y-3">
                <div className="py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone Number</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.phone}</span>
                </div>

                <div className="py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Type</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {user.role === "admin" ? "Admin" : "Regular"}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-destructive border-destructive/50 hover:bg-destructive/5 hover:text-destructive font-semibold h-10 mt-6"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </main>
        </div>

        <BottomNav liveCount={0} />
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
