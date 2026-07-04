"use client"

import * as React from "react"
import { toast } from "sonner"
import { Share2, Copy, Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface MatchShareProps {
  homeTeam: string
  awayTeam: string
  matchId: string
  competitionName: string
  startTime?: number
}

export function MatchShare({
  homeTeam,
  awayTeam,
  matchId,
  competitionName,
  startTime,
}: MatchShareProps) {
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
  const shareTitle = `${homeTeam} vs ${awayTeam}`
  const shareText = `🏆 ${shareTitle}\n📍 ${competitionName}${formattedTime ? `\n⏰ ${formattedTime}` : ""}\n\n💰 Check the odds and place your bets on BetFlexx!\n\n${matchUrl}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success("Share link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const shareVia = (platform: "whatsapp" | "twitter" | "telegram") => {
    const encodedText = encodeURIComponent(shareText)
    let url = ""

    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}`
        break
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(matchUrl)}&text=${encodedText}`
        break
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400")
      toast.success(`Opening ${platform}...`)
    }
  }

  // Check if Web Share API is available (mobile)
  const isWebShareAvailable = typeof navigator !== "undefined" && !!navigator.share

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: `Check out this match: ${shareTitle}\n${competitionName}`,
        url: matchUrl,
      })
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name !== "AbortError") {
        toast.error("Share failed")
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          title="Share match"
        >
          <Share2 className="size-3.5" />
          <span className="sr-only">Share match</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Share {shareTitle}
        </div>
        <DropdownMenuSeparator />

        {isWebShareAvailable && (
          <>
            <DropdownMenuItem onClick={handleNativeShare} className="text-xs gap-2">
              <Share2 className="size-3.5" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => shareVia("whatsapp")} className="text-xs gap-2">
          <MessageCircle className="size-3.5" />
          <span>WhatsApp</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => shareVia("twitter")} className="text-xs gap-2">
          <svg
            className="size-3.5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 9-2 9-2z" />
          </svg>
          <span>Twitter</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => shareVia("telegram")} className="text-xs gap-2">
          <svg
            className="size-3.5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M23.91 3.79L20.3 20.84c-.25 1.12-.9 1.39-1.82.87l-5.09-3.75-2.45 2.36c-.27.27-.5.5-1.02.5-.67 0-.55-.25-.78-.87L6.3 13.3l-5.09-1.59c-1.02-.32-1.03-.82.23-1.23l19.7-7.6c.91-.33 1.72.22 1.42 1.53z" />
          </svg>
          <span>Telegram</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyToClipboard} className="text-xs gap-2">
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
