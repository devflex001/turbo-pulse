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
    <article className="rounded-lg border border-border bg-card overflow-hidden flex flex-col justify-between h-full shadow-sm hover:border-muted-foreground/25 transition-colors">
      <div>
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/10 text-xs">
          <p className="text-[11px] text-muted-foreground">{bet.time}</p>
          <Badge
            variant={statusBadgeVariant(bet.status)}
            className="shrink-0 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm"
          >
            {bet.status}
          </Badge>
        </div>

        <ul className="divide-y divide-border/60">
          {bet.selections.map((selection, index) => (
            <li
              key={`${selection.id}-${index}`}
              className="px-4 py-3 text-xs space-y-1.5"
            >
              <p className="font-bold text-foreground leading-snug break-words text-sm">
                {selection.matchName}
              </p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {selection.market} · <span className="font-semibold text-foreground">{selection.selectionName}</span>
                </span>
                <span className="font-mono font-extrabold text-primary shrink-0">
                  @{selection.odds.toFixed(2)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/5 text-xs">
          <div>
            <span className="text-[9px] text-muted-foreground block uppercase font-medium tracking-wide">Stake</span>
            <span className="font-mono font-bold text-foreground">
              KES {bet.stake.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-muted-foreground block uppercase font-medium tracking-wide">
              {bet.status === "won" ? "Payout" : "Est. Return"}
            </span>
            <span className={cn(
              "font-mono font-extrabold",
              bet.status === "won" ? "text-emerald-600 dark:text-emerald-500 text-sm" : "text-primary"
            )}>
              KES {bet.potentialReturn.toLocaleString()}
            </span>
          </div>
        </div>

        {cancellable && (
          <div className="flex items-center gap-3 border-t border-border px-4 py-2 bg-destructive/5 justify-between">
            <div className="flex items-center gap-2">
              <PieCountdown
                deadline={cancelDeadline!}
                start={bet.placedAt}
                size={34}
                showLabel={false}
              />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cancel Window</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isCancelling}
              onClick={() => onCancel(bet.id)}
              className="h-8 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 bg-background"
            >
              {isCancelling ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
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
    <div className="space-y-6 w-full">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">My Bets</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center w-full">
          <Receipt className="size-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-foreground">
            {filter === "active" ? "No active bets" : "No settled bets yet"}
          </p>
        </div>
      )}
    </div>
  )
}
