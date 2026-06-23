"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoginModal } from "@/components/modals"
import { Separator } from "@/components/ui/separator"
import { getAuthToken, getUserData, AUTH_USER_KEY } from "@/lib/auth/jwt"
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Shield,
  LogOut,
  Copy,
  Check,
} from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const [copiedId, setCopiedId] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [loginOpen, setLoginOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Check session on mount - synchronously
  React.useEffect(() => {
    const token = getAuthToken()
    const userData = getUserData()

    if (!token || !userData) {
      setLoginOpen(true)
    } else {
      setUser({
        _id: userData.userId,
        phone: userData.phone,
        role: userData.role,
        createdAt: Date.now(),
      })
    }
    setMounted(true)
  }, [])

  // Listen for storage changes (logout from other tabs)
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

  const handleCopyId = async () => {
    if (user?._id) {
      await navigator.clipboard.writeText(user._id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("convex_auth_token")
    localStorage.removeItem("convex_auth_user")
    setUser(null)
    router.push("/")
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 scrollbar-thin">
            {user && (
              <div className="max-w-2xl w-full space-y-6">
                {/* Back Button & Title */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="size-8 rounded-full border border-border hover:bg-muted/50 shrink-0"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <h1 className="text-2xl font-bold text-foreground">My Account</h1>
                </div>

                {/* Profile Card */}
                <Card className="border border-border bg-card p-6 space-y-6">
                  {/* Header with Avatar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center size-16 rounded-full bg-[#4b9f71]/10 border-2 border-[#4b9f71]/30">
                        <User className="size-8 text-[#4b9f71]" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-foreground">{user.phone}</h2>
                        <Badge
                          className={user.role === "admin"
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-600"
                            : "bg-blue-500/15 border-blue-500/40 text-blue-600"
                          }
                        >
                          {user.role === "admin" ? "Admin Account" : "User Account"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Details Grid */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Phone Number */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="size-4 text-[#4b9f71]" />
                          <span className="font-semibold">Phone Number</span>
                        </div>
                        <p className="text-base font-semibold text-foreground ml-6">{user.phone}</p>
                      </div>

                      {/* Role */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Shield className="size-4 text-[#4b9f71]" />
                          <span className="font-semibold">Account Role</span>
                        </div>
                        <p className="text-base font-semibold text-foreground ml-6 capitalize">
                          {user.role === "admin" ? "Administrator" : "Regular User"}
                        </p>
                      </div>

                      {/* Account Created */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="size-4 text-[#4b9f71]" />
                          <span className="font-semibold">Account Created</span>
                        </div>
                        <p className="text-base font-semibold text-foreground ml-6">{formatDate(user.createdAt)}</p>
                      </div>

                      {/* User ID */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="size-4 text-[#4b9f71]" />
                          <span className="font-semibold">User ID</span>
                        </div>
                        <div className="ml-6">
                          <button
                            onClick={handleCopyId}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-xs font-mono text-foreground truncate max-w-xs">{user._id}</span>
                            {copiedId ? (
                              <Check className="size-3.5 text-green-500 shrink-0" />
                            ) : (
                              <Copy className="size-3.5 text-muted-foreground hover:text-foreground shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Logout Button */}
                  <div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/5 hover:text-destructive font-semibold"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </div>
                </Card>

                {/* Info Card */}
                <Card className="border border-border bg-muted/20 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Account Information</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your account is tied to your phone number. This is your unique identifier for placing bets and managing your wallet. To change your password or phone number, please contact support.
                  </p>
                </Card>
              </div>
            )}
          </main>
        </div>

        <BottomNav liveCount={0} />
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
