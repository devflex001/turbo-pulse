"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, ShieldX, Clock, AlertTriangle, MessageSquare } from "lucide-react"

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatUntil(ts: number | null) {
  if (ts === null) return "Permanent ban"
  const now = Date.now()
  if (ts < now) return "Expired"
  const diff = ts - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h remaining`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? "s" : ""} remaining`
}

interface BanScreenProps {
  /** If provided, renders inside a layout. If not, renders full-page overlay. */
  embedded?: boolean
}

export function BanScreen({ embedded = false }: BanScreenProps) {
  const banStatus = useQuery(
    api.adminUsers.getMyBanStatus,
    {}
  )
  const submitAppeal = useMutation(api.adminUsers.submitAppeal)

  const [message, setMessage] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [appealSubmitted, setAppealSubmitted] = React.useState(false)

  if (banStatus === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!banStatus) return null

  const { ban, pendingAppeal } = banStatus
  const isPermanent = ban.bannedUntil === null
  const hasAppeal = pendingAppeal !== null || appealSubmitted

  async function handleSubmitAppeal(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      toast.error("Please write your appeal message")
      return
    }
    if (message.trim().length < 20) {
      toast.error("Please provide a more detailed appeal (at least 20 characters)")
      return
    }

    try {
      setSubmitting(true)
      await submitAppeal({ banId: ban._id, message: message.trim() })
      toast.success("Appeal submitted. Our team will review it shortly.")
      setAppealSubmitted(true)
      setMessage("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit appeal")
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <div className="max-w-lg w-full mx-auto space-y-6 p-6">
      {/* Status Icon & Title */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
          <ShieldX className="size-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-sm text-muted-foreground">
            Your account has been temporarily suspended by our moderation team.
          </p>
        </div>
        <Badge
          variant="outline"
          className={`text-xs font-semibold px-3 py-1 ${
            isPermanent
              ? "text-rose-600 border-rose-500/30 bg-rose-500/10"
              : "text-orange-600 border-orange-500/30 bg-orange-500/10"
          }`}
        >
          {isPermanent ? "Permanent Suspension" : "Temporary Suspension"}
        </Badge>
      </div>

      <Separator />

      {/* Ban Details */}
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <div className="flex justify-between items-start gap-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reason
          </span>
          <span className="text-right text-sm font-medium text-foreground flex-1">
            {ban.reason}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Banned On
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(ban.bannedAt)}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="size-3" />
            Duration
          </span>
          <span className={`text-xs font-semibold ${isPermanent ? "text-rose-500" : "text-orange-500"}`}>
            {formatUntil(ban.bannedUntil)}
          </span>
        </div>
      </div>

      {/* Appeal Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h2 className="text-sm font-bold">Appeal This Decision</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          If you believe this suspension was made in error, you can submit an
          appeal. Our moderation team typically reviews appeals within 24–48 hours.
        </p>

        {hasAppeal ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <AlertTriangle className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-xs">
                Appeal Submitted
              </p>
              <p className="text-xs text-muted-foreground">
                {pendingAppeal
                  ? `Submitted on ${formatDate(pendingAppeal.submittedAt)}`
                  : "Your appeal has been submitted and is under review."}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitAppeal} className="space-y-3">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold text-muted-foreground block"
                htmlFor="appeal-msg"
              >
                Your Appeal Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="appeal-msg"
                placeholder="Explain why you believe this suspension was made in error. Include any relevant details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                disabled={submitting}
                className="resize-none text-sm focus-visible:ring-primary"
                required
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {message.length} chars (min. 20)
              </p>
            </div>
            <Button
              type="submit"
              disabled={submitting || message.trim().length < 20}
              className="w-full font-semibold text-sm"
            >
              {submitting ? (
                <><Loader2 className="size-3.5 mr-1.5 animate-spin" /> Submitting Appeal...</>
              ) : (
                "Submit Appeal"
              )}
            </Button>
          </form>
        )}
      </div>

      <Separator />

      {/* Contact note */}
      <p className="text-[11px] text-muted-foreground text-center">
        For urgent matters, contact support at{" "}
        <span className="font-semibold text-foreground">support@betflexx.co.ke</span>
      </p>
    </div>
  )

  if (embedded) return content

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {content}
    </div>
  )
}
