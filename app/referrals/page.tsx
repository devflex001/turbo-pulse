"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { LoginModal } from "@/components/modals"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Copy,
  Check,
  Loader2,
  Share2,
  Users,
  TrendingUp,
  Gift,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

export default function ReferralsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const ensureReferralCodeMutation = useMutation(api.referrals.ensureReferralCode)

  const referralStats = useQuery(
    api.referrals.getReferralStats,
    user?._id ? { userId: user._id } : "skip"
  )

  const referralLink = useQuery(
    api.referrals.getReferralLink,
    user?._id && referralStats?.referralCode ? { userId: user._id } : "skip"
  )

  const referralHistory = useQuery(
    api.referrals.getReferralHistory,
    user?._id ? { userId: user._id, limit: 20 } : "skip"
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (mounted && user?._id) {
      ensureReferralCodeMutation({ userId: user._id }).catch((error) => {
        console.error("Failed to ensure referral code:", error)
      })
    }
  }, [mounted, user?._id, ensureReferralCodeMutation])

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Referral link copied to clipboard")
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async (link: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join BetFlexx — Earn KES 1,000",
          text: "Sign up on BetFlexx using my link and I earn KES 1,000. Join now!",
          url: link,
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Share failed. Try copying the link instead.")
        }
      }
    } else {
      handleCopyLink(link)
    }
  }

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
        <BottomNav liveCount={0} />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Header />
          <div className="flex flex-1  items-center justify-center px-4">
            <div className="text-center max-w-sm">
              <p className="text-sm text-muted-foreground mb-1">Sign in required</p>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Access your referral dashboard
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Log in to get your personal referral link and track your earnings.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="bg-[#4b9f71] hover:bg-[#3e865f] text-white w-full"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
          <BottomNav liveCount={0} />
        </div>
        <LoginModal open={true} onOpenChange={() => { }} />
      </>
    )
  }

  const statsLoaded = referralStats !== undefined
  const linkLoaded = referralLink !== undefined

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Refer & Earn
              </h1>
              <p className="text-sm text-muted-foreground mb-2 mt-1">
                Earn <span className="font-semibold text-[#4b9f71]">KES 1,000</span> for every friend you refer who signs up on BetFlexx.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Referrals
                  </span>
                </div>
                {!statsLoaded ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    {referralStats.totalReferrals}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Total Earned
                  </span>
                </div>
                {!statsLoaded ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold text-[#4b9f71]">
                    KES {(referralStats.totalReferralEarnings ?? 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Referral link section */}
            <div className="rounded-lg mt-4 mb-4 border border-border bg-card mb-8">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Your Referral Link</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share this link — you earn KES 1,000 when they sign up.
                </p>
              </div>

              <div className="px-5 py-4">
                {!linkLoaded || !referralStats?.referralCode ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1 rounded-md" />
                      <Skeleton className="h-9 flex-1 rounded-md" />
                    </div>
                  </div>
                ) : referralLink ? (
                  <div className="space-y-3">
                    {/* Link display */}
                    <div
                      className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5 cursor-pointer group hover:border-[#4b9f71]/40 transition-colors"
                      onClick={() => handleCopyLink(referralLink.referralLink)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleCopyLink(referralLink.referralLink)}
                      aria-label="Click to copy referral link"
                    >
                      <p className="text-xs text-muted-foreground font-mono flex-1 truncate">
                        {referralLink.referralLink}
                      </p>
                      {copied ? (
                        <Check className="size-3.5 text-[#4b9f71] shrink-0" />
                      ) : (
                        <Copy className="size-3.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                      )}
                    </div>

                    {/* Code badge
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Referral code:</span>
                      <code className="text-xs font-mono font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                        {referralStats.referralCode}
                      </code>
                    </div> */}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={() => handleCopyLink(referralLink.referralLink)}
                        variant="outline"
                        className="flex-1 h-9 text-sm font-medium hover:border-[#4b9f71]/50"
                      >
                        {copied ? (
                          <>
                            <Check className="size-3.5 mr-1.5 text-[#4b9f71]" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5 mr-1.5" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleShare(referralLink.referralLink)}
                        className="flex-1 h-9 text-sm font-medium bg-[#4b9f71] hover:bg-[#3e865f] text-white"
                      >
                        <Share2 className="size-3.5 mr-1.5" />
                        Share
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generating your referral link...
                  </p>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-lg mb-4 border border-border bg-card mb-8">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">How it works</h2>
              </div>
              <div className="px-5 py-4 space-y-0 divide-y divide-border">
                <div className="flex items-start gap-4 pb-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4b9f71]/10 text-[#4b9f71] flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Share your unique link</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Send your referral link to friends via WhatsApp, SMS, or any platform.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 py-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4b9f71]/10 text-[#4b9f71] flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Friend signs up</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      They create a new BetFlexx account using your link or referral code.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pt-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4b9f71]/10 text-[#4b9f71] flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      You earn KES 1,000
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      KES 1,000 is credited to your wallet instantly when their registration completes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral history */}
            <div className="rounded-lg border border-border bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Referral History</h2>
                {statsLoaded && referralStats.completedCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {referralStats.completedCount} completed
                  </span>
                )}
              </div>

              {referralHistory === undefined ? (
                <div className="px-5 py-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : referralHistory.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Gift className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No referrals yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your link to start earning.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {referralHistory.map((referral) => {
                    const isCompleted = referral.status === "completed"
                    const date = new Date(referral.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    // Mask the phone number for privacy
                    const phone = referral.referredUserPhone ?? "Unknown"
                    const maskedPhone =
                      phone.length > 6
                        ? `${phone.slice(0, 4)}${"*".repeat(phone.length - 6)}${phone.slice(-2)}`
                        : phone

                    return (
                      <div
                        key={referral._id}
                        className="flex items-center justify-between px-5 py-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="size-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {maskedPhone}
                            </p>
                            <p className="text-xs text-muted-foreground">{date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          {isCompleted && (
                            <span className="text-sm font-semibold text-[#4b9f71]">
                              +KES 1,000
                            </span>
                          )}
                          <Badge
                            variant={isCompleted ? "default" : "secondary"}
                            className={
                              isCompleted
                                ? "bg-[#4b9f71]/10 text-[#4b9f71] border-[#4b9f71]/20 hover:bg-[#4b9f71]/10 text-xs font-medium"
                                : "text-xs font-medium"
                            }
                          >
                            {isCompleted ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="h-8" />
          </div>
        </main>
      </div>

      <BottomNav liveCount={0} />
    </div>
  )
}
