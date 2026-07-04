"use client"

import * as React from "react"
import { toast } from "sonner"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveModal,
} from "@/components/ui/responsive-modal"

interface ShareModalProps {
  title: string
  matchId: string
  competitionName?: string
  startTime?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareModal({
  title,
  matchId,
  competitionName,
  startTime,
  open,
  onOpenChange,
}: ShareModalProps) {
  const [copied, setCopied] = React.useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const matchUrl = `${baseUrl}/markets/${matchId}`

  // Format time for sharing
  const formattedTime = startTime
    ? new Date(startTime).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : ""

  // Create share text
  const shareText = `🏆 ${title}\n${competitionName ? `📍 ${competitionName}\n` : ""}${formattedTime ? `⏰ ${formattedTime}\n\n` : "\n"}💰 Check the odds and place your bets on BetFlexx!\n\n${matchUrl}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success("Link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Check out this match: ${title}`,
          url: matchUrl,
        })
        onOpenChange(false)
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        toast.error("Share failed")
      }
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Share"
      description={title}
    >
      <div className="space-y-3 py-4">
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-muted-foreground">
          <p className="truncate">{matchUrl}</p>
        </div>

        <div className="space-y-2">
          {navigator.share && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            >
              <Share2 className="size-4" />
              Share
            </Button>
          )}

          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="w-full font-semibold gap-2"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

interface MatchShareProps {
  title: string
  matchId: string
  competitionName?: string
  startTime?: number
}

export function MatchShare({
  title,
  matchId,
  competitionName,
  startTime,
}: MatchShareProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Share"
        onClick={() => setOpen(true)}
      >
        <Share2 className="size-3.5" />
        <span className="sr-only">Share</span>
      </Button>

      <ShareModal
        open={open}
        onOpenChange={setOpen}
        title={title}
        matchId={matchId}
        competitionName={competitionName}
        startTime={startTime}
      />
    </>
  )
}
