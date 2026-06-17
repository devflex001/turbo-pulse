"use client"

import * as React from "react"
import { useBetStore, type PlacedBet } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PieCountdown,
  canCancelBet,
  getCancelDeadline,
} from "@/components/pie-countdown"
import { toast } from "sonner"
import { Loader2, Receipt, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type BetFilter = "active" | "settled"

function statusBadgeVariant(status: PlacedBet["status"]) {
  if (status === "won") return "default"
  if (status === "lost") return "destructive"
  if (status === "cancelled") return "outline"
  return "secondary"
}

function BetCard({
  bet,
  onCancel,
  isCancelling,
}: {
  bet: PlacedBet
  onCancel: (betId: string) => void
  isCancelling: boolean
}) {
  const cancelDeadline = getCancelDeadline(bet.selections)
  const cancellable =
    bet.status === "active" && canCancelBet(bet.selections, bet.placedAt)

  return (
    <article className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-foreground">
            {bet.selections.length === 1 ? "Single" : "Accumulator"} · @
            {bet.totalOdds.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">{bet.time}</p>
        </div>
        <Badge
          variant={statusBadgeVariant(bet.status)}
          className="shrink-0 text-[10px] uppercase font-bold"
        >
          {bet.status}
        </Badge>
      </div>

      <ul className="divide-y divide-border">
        {bet.selections.map((selection, index) => (
          <li
            key={`${selection.id}-${index}`}
            className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground leading-snug break-words">
                {selection.matchName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selection.market} ·{" "}
                <span className="font-semibold text-foreground">
                  {selection.selectionName}
                </span>
              </p>
            </div>
            <span className="shrink-0 font-mono font-bold text-primary">
              {selection.odds.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
        <dl className="grid grid-cols-3 gap-3 text-[11px] flex-1">
          <div>
            <dt className="text-muted-foreground">Stake</dt>
            <dd className="font-mono font-bold text-foreground">
              KES {bet.stake.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Return</dt>
            <dd className="font-mono font-bold text-primary">
              KES {bet.potentialReturn.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Selections</dt>
            <dd className="font-bold text-foreground">{bet.selections.length}</dd>
          </div>
        </dl>

        {bet.status === "active" && (
          <div className="flex items-center gap-3 shrink-0">
            {cancelDeadline ? (
              <>
                <PieCountdown
                  deadline={cancelDeadline}
                  start={bet.placedAt}
                  size={56}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!cancellable || isCancelling}
                  onClick={() => onCancel(bet.id)}
                  className={cn(
                    "h-9 text-xs font-semibold shrink-0",
                    cancellable &&
                      "border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  )}
                >
                  {isCancelling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="size-3.5 mr-1.5" />
                      Cancel
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="text-[10px] text-muted-foreground max-w-[140px] text-right">
                Cancel unavailable — match times missing for this slip.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export function MyBetsPanel() {
  const { myBets, cancelBet } = useBetStore()
  const [filter, setFilter] = React.useState<BetFilter>("active")
  const [cancellingId, setCancellingId] = React.useState<string | null>(null)

  const activeBets = myBets.filter((b) => b.status === "active")
  const settledBets = myBets.filter((b) => b.status !== "active")
  const visibleBets = filter === "active" ? activeBets : settledBets

  const handleCancel = async (betId: string) => {
    const bet = myBets.find((b) => b.id === betId)
    if (!bet || !canCancelBet(bet.selections, bet.placedAt)) {
      toast.error("This bet can no longer be cancelled.")
      return
    }

    try {
      setCancellingId(betId)
      const success = await cancelBet(betId)
      if (success) {
        toast.success(`Bet cancelled. KES ${bet.stake.toLocaleString()} refunded.`)
      } else {
        toast.error("Could not cancel bet. Try again.")
      }
    } catch {
      toast.error("Could not cancel bet.")
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">My Bets</h2>
        <p className="text-xs text-muted-foreground">
          Cancel any active bet up to 5 minutes before the earliest match kicks off.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "active" ? "default" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilter("active")}
        >
          Active ({activeBets.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "settled" ? "default" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilter("settled")}
        >
          Settled ({settledBets.length})
        </Button>
      </div>

      {visibleBets.length > 0 ? (
        <div className="space-y-3">
          {visibleBets.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              onCancel={handleCancel}
              isCancelling={cancellingId === bet.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Receipt className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">
            {filter === "active" ? "No active bets" : "No settled bets yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            {filter === "active"
              ? "Add selections from any fixture and place a bet to see it here."
              : "Won, lost, and cancelled bets will appear here."}
          </p>
        </div>
      )}
    </div>
  )
}
