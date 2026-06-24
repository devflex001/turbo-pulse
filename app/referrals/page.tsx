"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/modals"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Loader2,
  Gift,
  TrendingUp,
  Share2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

export default function ReferralsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Convex queries
  const referralStats = useQuery(
    api.referrals.getReferralStats,
    user?._id ? { userId: user._id } : "skip"
  )

  const referralLink = useQuery(
    api.referrals.getReferralLink,
    user?._id ? { userId: user._id } : "skip"
  )

  const referralHistory = useQuery(
    api.referrals.getReferralHistory,
    user?._id ? { userId: user._id, limit: 50 } : "skip"
  )

  // Only render after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Referral code copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Referral link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async (link: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bet Flow - Referral",
          text: "Sign up and earn 1000 KES with my referral link!",
          url: link,
        })
      } catch (error) {
        if ((error as any).name !== "AbortError") {
          toast.error("Failed to share")
        }
      }
    } else {
      handleCopyLink(link)
    }
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav liveCount={0} />
      </div>
    )
  }

  // Not logged in state
  if (!user) {
    return (
      <>
        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Header />
          <div className="flex flex-1 items-center justify-center">
            <Card className="p-8 max-w-md w-full text-center space-y-4">
              <Users className="size-12 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">Authentication Required</h2>
              <p className="text-sm text-muted-foreground">Please log in to view referrals</p>
              <Button onClick={() => router.push("/")}>
                Go Home
              </Button>
            </Card>
          </div>
          <BottomNav liveCount={0} />
        </div>
        <LoginModal open={true} onOpenChange={() => { }} />
      </>
    )
  }

  // Logged in - render full page
  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <div className="max-w-2xl w-full mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="size-8 rounded-full border border-border hover:bg-muted/50 shrink-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <h1 className="text-xl font-bold text-foreground">Referrals</h1>
              </div>

              {/* Stats Cards */}
              {referralStats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Referrals */}
                  <Card className="p-4 border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Referrals</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {referralStats.totalReferrals}
                        </p>
                      </div>
                      <Users className="size-5 text-[#4b9f71]" />
                    </div>
                  </Card>

                  {/* Total Earnings */}
                  <Card className="p-4 border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Total Earnings</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          KES {referralStats.totalReferralEarnings.toLocaleString()}
                        </p>
                      </div>
                      <Gift className="size-5 text-[#4b9f71]" />
                    </div>
                  </Card>

                  {/* Pending Referrals */}
                  <Card className="p-4 border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Pending</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {referralStats.pendingCount}
                        </p>
                      </div>
                      <TrendingUp className="size-5 text-[#4b9f71]" />
                    </div>
                  </Card>
                </div>
              )}

              {/* Referral Code Section */}
              {referralStats?.referralCode && referralLink && (
                <Card className="p-6 border-border space-y-4">
                  <h2 className="text-lg font-bold text-foreground">Share Your Referral</h2>

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">
                      Your Referral Code
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 bg-muted/50 rounded-lg border border-border font-mono text-sm font-semibold text-foreground break-all">
                        {referralStats.referralCode}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(referralStats.referralCode)}
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">
                      Your Referral Link
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground break-all overflow-hidden">
                        {referralLink.referralLink}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(referralLink.referralLink)}
                        >
                          {copied ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#4b9f71] text-white hover:bg-[#3e865f]"
                          onClick={() => handleShare(referralLink.referralLink)}
                        >
                          <Share2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-[#4b9f71]/10 rounded-lg border border-[#4b9f71]/20">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Earn 1000 KES</span> for each friend who signs up using your referral code or link.
                    </p>
                  </div>
                </Card>
              )}

              {/* How It Works */}
              <Card className="p-6 border-border space-y-4">
                <h2 className="text-lg font-bold text-foreground">How It Works</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center size-8 rounded-full bg-[#4b9f71]/20 text-[#4b9f71] font-semibold text-sm shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Share Your Code</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy your referral code and share it with friends
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center size-8 rounded-full bg-[#4b9f71]/20 text-[#4b9f71] font-semibold text-sm shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">They Sign Up</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        They use your code when creating their account
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center size-8 rounded-full bg-[#4b9f71]/20 text-[#4b9f71] font-semibold text-sm shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">You Earn</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You get 1000 KES credited to your wallet instantly
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Referral History */}
              {referralHistory && referralHistory.length > 0 && (
                <Card className="p-6 border-border space-y-4">
                  <h2 className="text-lg font-bold text-foreground">Recent Referrals</h2>
                  <div className="space-y-3">
                    {referralHistory.map((referral) => (
                      <div
                        key={referral._id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {referral.referredUserPhone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {referral.status === "completed" ? "Completed" : "Pending"}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-sm font-bold text-foreground">
                            +KES {referral.amountEarned.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Empty State */}
              {referralHistory && referralHistory.length === 0 && (
                <Card className="p-12 border-border text-center space-y-4">
                  <Users className="size-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">No Referrals Yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share your referral code with friends to start earning
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>

        <BottomNav liveCount={0} />
      </div>
    </>
  )
}
