"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/modals"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Copy,
  Check,
  Loader2,
  Share2,
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
    toast.success("Link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async (link: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bet Flow - Referral",
          text: "Join me and earn 1000 KES!",
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
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-foreground">Sign in to access referrals</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Log in to get your personalized referral link and start earning.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="mt-6 w-full bg-[#4b9f71] hover:bg-[#3e865f]"
              >
                Go Home
              </Button>
            </div>
          </div>
          <BottomNav liveCount={0} />
        </div>
        <LoginModal open={true} onOpenChange={() => { }} />
      </>
    )
  }

  // Logged in - render full page
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 overflow-y-auto border-r border-border" />

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col justify-center px-4 py-12 sm:px-6 md:px-8 lg:py-16">
            <div className="max-w-xl mx-auto w-full">
              {/* Hero Section */}
              <div className="text-center mb-20 sm:mb-24 md:mb-28">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 sm:mb-8">
                  Invite & Earn
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Share your link with friends and <span className="font-semibold text-[#4b9f71]">earn 1000 KES</span> when they join
                </p>
              </div>

              {/* Stats Cards */}
              {referralStats && (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-20 sm:mb-24 md:mb-28">
                  <div className="p-6 sm:p-8 rounded-xl border border-border/50 bg-muted/40 text-center">
                    <p className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                      {referralStats.totalReferrals}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Friends Invited
                    </p>
                  </div>
                  <div className="p-6 sm:p-8 rounded-xl border border-border/50 bg-muted/40 text-center">
                    <p className="text-3xl sm:text-4xl font-bold text-[#4b9f71] mb-3">
                      {referralStats.totalReferralEarnings.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      KES Earned
                    </p>
                  </div>
                </div>
              )}

              {/* Referral Link Section */}
              {referralStats?.referralCode && referralLink && (
                <div className="mb-20 sm:mb-24 md:mb-28">
                  <label className="block text-sm font-semibold text-foreground mb-4 sm:mb-5">
                    Your Referral Link
                  </label>
                  <div className="p-5 sm:p-6 rounded-xl border border-border/50 bg-muted/40 mb-6 sm:mb-8">
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                      {referralLink.referralLink}
                    </p>
                  </div>

                  {/* Action Buttons - Full Width Stack on Mobile */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      onClick={() => handleCopyLink(referralLink.referralLink)}
                      variant="outline"
                      className="h-12 sm:h-12 flex-1 font-medium text-sm hover:border-[#4b9f71]/50 hover:bg-muted/50"
                    >
                      <Copy className="size-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      onClick={() => handleShare(referralLink.referralLink)}
                      className="h-12 sm:h-12 flex-1 bg-[#4b9f71] hover:bg-[#3e865f] text-white font-medium text-sm transition-colors"
                    >
                      <Share2 className="size-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div className="border-t border-border/50 pt-16 sm:pt-20 md:pt-24">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-8 sm:mb-10">
                  How it works
                </h2>
                <div className="space-y-6 sm:space-y-8">
                  <div className="flex gap-5 sm:gap-6">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#4b9f71] text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground pt-1 sm:pt-2">
                      Share your link with friends
                    </p>
                  </div>
                  <div className="flex gap-5 sm:gap-6">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#4b9f71] text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground pt-1 sm:pt-2">
                      They sign up with your link
                    </p>
                  </div>
                  <div className="flex gap-5 sm:gap-6">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#4b9f71] text-white flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground pt-1 sm:pt-2">
                      You both get 1000 KES instantly
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav liveCount={0} />
    </div>
  )
}
