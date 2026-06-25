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

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
            {/* Main Content */}
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center space-y-3">
                <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-[#4b9f71] to-[#4b9f71]/70 bg-clip-text text-transparent">
                  Invite & Earn
                </div>
                <p className="text-base sm:text-lg text-muted-foreground max-w-sm mx-auto">
                  Share your link with friends. When they join, you both get <span className="font-semibold text-foreground">1000 KES</span>.
                </p>
              </div>

              {/* Stats - Horizontal Layout */}
              {referralStats && (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="text-2xl sm:text-3xl font-bold text-foreground">
                      {referralStats.totalReferrals}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Friends Invited
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="text-2xl sm:text-3xl font-bold text-[#4b9f71]">
                      KES {referralStats.totalReferralEarnings.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                      You've Earned
                    </div>
                  </div>
                </div>
              )}

              {/* Link Section */}
              {referralStats?.referralCode && referralLink && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground block">
                      Your Referral Link
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 bg-muted/50 rounded-lg border border-border/50 text-sm text-muted-foreground font-mono truncate hover:bg-muted/70 transition-colors">
                        {referralLink.referralLink}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(referralLink.referralLink)}
                        className="shrink-0 h-auto px-3 hover:border-[#4b9f71]/50 hover:bg-muted/50"
                      >
                        {copied ? (
                          <Check className="size-4 text-[#4b9f71]" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleCopyLink(referralLink.referralLink)}
                      variant="outline"
                      className="flex-1 h-11 hover:bg-muted/50 hover:border-[#4b9f71]/50"
                    >
                      <Copy className="size-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button
                      onClick={() => handleShare(referralLink.referralLink)}
                      className="flex-1 h-11 bg-[#4b9f71] hover:bg-[#3e865f] text-white font-medium"
                    >
                      <Share2 className="size-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div className="space-y-3 pt-6 border-t border-border/50">
                <h3 className="font-semibold text-foreground">How it works</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4b9f71]/20 flex items-center justify-center text-xs font-bold text-[#4b9f71]">
                      1
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Share your link with friends
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4b9f71]/20 flex items-center justify-center text-xs font-bold text-[#4b9f71]">
                      2
                    </div>
                    <p className="text-sm text-muted-foreground">
                      They sign up with your link
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4b9f71]/20 flex items-center justify-center text-xs font-bold text-[#4b9f71]">
                      3
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You both get 1000 KES
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
