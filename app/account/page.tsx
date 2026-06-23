"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Shield,
  LogOut,
} from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-muted-foreground">Loading...</div>
        </main>
        <BottomNav liveCount={0} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Please log in to view your account</p>
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        </main>
        <BottomNav liveCount={0} />
      </div>
    )
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="size-8 rounded-full border border-border hover:bg-muted/50"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">My Account</h1>
          </div>

          {/* Profile Section */}
          <Card className="border border-border bg-card p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-16 rounded-full bg-[#4b9f71]/10 border border-[#4b9f71]/30">
                  <User className="size-8 text-[#4b9f71]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">{user.phone}</h2>
                  <Badge className={user.role === "admin" ? "bg-amber-500/15 border-amber-500/40 text-amber-600" : "bg-blue-500/15 border-blue-500/40 text-blue-600"}>
                    {user.role === "admin" ? "Admin Account" : "User Account"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Phone Number */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-4 text-[#4b9f71]" />
                    <span>Phone Number</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{user.phone}</p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="size-4 text-[#4b9f71]" />
                    <span>Account Role</span>
                  </div>
                  <p className="text-base font-semibold text-foreground capitalize">
                    {user.role === "admin" ? "Administrator" : "Regular User"}
                  </p>
                </div>

                {/* Account Created */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4 text-[#4b9f71]" />
                    <span>Account Created</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{formatDate(user.createdAt)}</p>
                </div>

                {/* User ID */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4 text-[#4b9f71]" />
                    <span>User ID</span>
                  </div>
                  <p className="text-xs font-mono text-foreground break-all bg-muted/30 p-2 rounded">{user._id}</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t border-border pt-6">
              <Button
                onClick={logout}
                variant="outline"
                className="w-full text-destructive border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </Card>

          {/* Account Settings Note */}
          <div className="bg-muted/30 border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Account Information</p>
            <p>Your account is tied to your phone number. To change your password or phone number, please contact support.</p>
          </div>
        </div>
      </main>

      <BottomNav liveCount={0} />
    </div>
  )
}
