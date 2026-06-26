"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Gift, TrendingUp, Users } from "lucide-react"

interface ReferralSignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referredByPhone?: string
}

export function ReferralSignupModal({
  open,
  onOpenChange,
  referredByPhone,
}: ReferralSignupModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const platformConfig = useQuery(api.platformConfig.getUserFacingConfig, {})

  const referralReward = platformConfig?.referralReward ?? 1000

  if (!mounted) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            Welcome to the Referral Program
          </DialogTitle>
          <DialogDescription>
            Start earning cash by sharing your unique referral link with friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* How it Works */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">How it works:</h3>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Get your unique code</p>
                  <p className="text-xs text-muted-foreground">
                    You'll receive a personal referral link after signup.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Share with friends</p>
                  <p className="text-xs text-muted-foreground">
                    Send your link via WhatsApp, SMS, or any platform.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Earn instantly</p>
                  {platformConfig ? (
                    <p className="text-xs text-muted-foreground">
                      Get <span className="font-semibold text-emerald-600">KES {referralReward.toLocaleString()}</span> when they
                      sign up.
                    </p>
                  ) : (
                    <Skeleton className="h-4 w-32" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Summary Card */}
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-600" />
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Your Reward
              </span>
            </div>
            {platformConfig ? (
              <p className="text-2xl font-bold text-emerald-600">
                KES {referralReward.toLocaleString()}
              </p>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
            <p className="text-[10px] text-muted-foreground">
              per successful referral
            </p>
          </div>

          {/* You were referred message (optional) */}
          {referredByPhone && (
            <div className="rounded-lg border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/30 p-3">
              <div className="flex items-start gap-2">
                <Users className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    Great choice! You were referred by a friend
                  </p>
                  <p className="text-[10px] text-blue-700/70 dark:text-blue-300/70 mt-0.5">
                    They'll earn KES {referralReward.toLocaleString()} when your account is created.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
