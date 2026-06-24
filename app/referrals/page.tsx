"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/modals"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Loader2,
  Gift,
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

  // Only render after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

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
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-up { animation: slideInUp 0.5s ease-out forwards; }
        .animate-slide-in-up-1 { animation: slideInUp 0.5s ease-out 0.1s forwards; opacity: 0; }
        .animate-slide-in-up-2 { animation: slideInUp 0.5s ease-out 0.2s forwards; opacity: 0; }
        .animate-slide-in-up-3 { animation: slideInUp 0.5s ease-out 0.3s forwards; opacity: 0; }
        .hover-scale { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; }
        .hover-scale:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(75, 159, 113, 0.1); }
        .stat-card { background: linear-gradient(135deg, rgba(75, 159, 113, 0.05) 0%, transparent 100%); }
      `}</style>

      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <div className="max-w-2xl w-full mx-auto space-y-8">
              {/* Header */}
              <div className="flex items-center gap-3 animate-slide-in-up">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="size-8 rounded-full border border-border hover:bg-muted/50 shrink-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Earn by inviting friends</p>
                </div>
              </div>

              {/* Stats Cards - 2 Column Grid */}
              {referralStats && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Total Referrals */}
                  <div className="animate-slide-in-up-1">
                    <Card className="stat-card border-border overflow-hidden hover-scale h-full">
                      <div className="p-5 sm:p-6 flex flex-col justify-between h-full">
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center size-10 rounded-lg bg-[#4b9f71]/20">
                            <Users className="size-5 text-[#4b9f71]" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Referrals</p>
                            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                              {referralStats.totalReferrals}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Total Earnings */}
                  <div className="animate-slide-in-up-2">
                    <Card className="stat-card border-border overflow-hidden hover-scale h-full">
                      <div className="p-5 sm:p-6 flex flex-col justify-between h-full">
                        <div className="space-y-3">
                          <div className="inline-flex items-center justify-center size-10 rounded-lg bg-[#4b9f71]/20">
                            <Gift className="size-5 text-[#4b9f71]" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Earnings</p>
                            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                              KES {referralStats.totalReferralEarnings.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Share Section */}
              {referralStats?.referralCode && referralLink && (
                <div className="animate-slide-in-up-3">
                  <Card className="border-border overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-6">
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">Share & Earn</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Send your link to friends. When they sign up, you both get rewarded.
                        </p>
                      </div>

                      {/* Referral Link Display */}
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground">Your Referral Link</label>
                        <div className="flex gap-2 group">
                          <div className="flex-1 px-4 py-3 bg-muted/60 rounded-lg border border-border text-xs sm:text-sm text-muted-foreground font-mono break-all overflow-hidden transition-colors group-hover:bg-muted/80">
                            {referralLink.referralLink}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(referralLink.referralLink)}
                              className="h-10 w-10 p-0 transition-all hover:bg-muted hover:border-[#4b9f71]/30"
                            >
                              {copied ? (
                                <Check className="size-4 text-[#4b9f71]" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              className="h-10 bg-[#4b9f71] text-white hover:bg-[#3e865f] transition-all font-medium gap-2"
                              onClick={() => handleShare(referralLink.referralLink)}
                            >
                              <Share2 className="size-4" />
                              <span className="hidden sm:inline">Share</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Referral Code Display */}
                      <div className="space-y-3 pt-2 border-t border-border">
                        <label className="text-sm font-semibold text-foreground">Referral Code</label>
                        <div className="flex gap-2">
                          <div className="flex-1 px-4 py-3 bg-muted/60 rounded-lg border border-border font-mono text-sm sm:text-base font-bold text-foreground tracking-wide overflow-hidden transition-colors hover:bg-muted/80">
                            {referralStats.referralCode}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(referralStats.referralCode)}
                            className="h-10 w-10 p-0 transition-all hover:bg-muted hover:border-[#4b9f71]/30 shrink-0"
                          >
                            {copied ? (
                              <Check className="size-4 text-[#4b9f71]" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="p-4 bg-[#4b9f71]/8 rounded-lg border border-[#4b9f71]/25">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold text-[#4b9f71]">Earn 1000 KES</span> for each friend who signs up
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>

        <BottomNav liveCount={0} />
      </div>
    </>
  )
}
