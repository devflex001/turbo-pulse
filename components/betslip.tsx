"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useBetStore } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginModal } from "@/components/modals"
import { Trash2, X, Wallet, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BetslipProps {
  onClose?: () => void
}

export function Betslip({ onClose }: BetslipProps) {
  const router = useRouter()
  const {
    betslip,
    walletBalance,
    user,
    removeFromBetslip,
    clearBetslip,
    placeBet,
  } = useBetStore()

  const [stake, setStake] = React.useState("100")
  const [isPlacing, setIsPlacing] = React.useState(false)
  const [loginOpen, setLoginOpen] = React.useState(false)

  const presets = [50, 100, 200, 500, 1000]

  const parsedStake = parseFloat(stake) || 0
  const totalStake = React.useMemo(() => {
    return parsedStake * betslip.length
  }, [parsedStake, betslip.length])

  const totalPotentialReturn = React.useMemo(() => {
    return parseFloat(
      betslip.reduce((acc, item) => acc + parsedStake * item.odds, 0).toFixed(2)
    )
  }, [betslip, parsedStake])

  const handlePlaceBet = async () => {
    if (!user) {
      setLoginOpen(true)
      return
    }

    if (betslip.length === 0) {
      toast.error("Your betslip is empty")
      return
    }

    if (isNaN(parsedStake) || parsedStake <= 0) {
      toast.error("Please enter a valid stake amount")
      return
    }

    if (totalStake > walletBalance) {
      router.push("/deposit")
      return
    }

    try {
      setIsPlacing(true)
      const success = await placeBet(parsedStake)
      if (success) {
        toast.success(
          `Bets placed! Total potential return: KES ${totalPotentialReturn.toLocaleString()}`
        )
        onClose?.()
      } else {
        toast.error("Failed to place bets. Try again.")
      }
    } catch {
      toast.error("Failed to place bets. Please try again.")
    } finally {
      setIsPlacing(false)
    }
  }

  const selectPreset = (val: number) => {
    setStake(val.toString())
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-card text-card-foreground">
      {betslip.length > 0 && (
        <div className="flex shrink-0 items-center justify-end border-b border-border bg-muted/5 px-4 py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearBetslip}
            className="h-6 px-2 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-1 sm:px-4">
        {betslip.length === 0 ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
            <div className="rounded-full border border-dashed border-border bg-muted/60 p-4">
              <Trash2 className="size-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Betslip is empty
            </p>
            <p className="max-w-[220px] text-xs">
              Tap odds on any fixture to add selections here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 pb-2">
            {betslip.map((item) => (
              <div
                key={item.id}
                className="relative flex flex-col gap-1 py-3 text-xs"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-0 size-5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => removeFromBetslip(item.id)}
                  aria-label="Remove selection"
                >
                  <X className="size-2.5" />
                </Button>

                <div className="flex items-start justify-between gap-3 pr-6">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="block pr-1 text-[11px] leading-tight font-semibold break-words text-foreground">
                      {item.matchName}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {item.market} -{" "}
                      <span className="font-bold text-foreground">
                        {item.selectionName}
                      </span>
                    </span>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                      {item.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {betslip.length > 0 && (
        <div className="shrink-0 space-y-3 border-t border-border bg-muted/20 p-3 sm:p-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
              <span>Stake (KES)</span>
              {user && (
                <span className="flex items-center gap-1 font-normal text-muted-foreground">
                  <Wallet className="size-3 shrink-0" />
                  KES {walletBalance.toLocaleString()}
                </span>
              )}
            </div>

            <Input
              type="number"
              min="10"
              placeholder="Min KES 10"
              value={stake}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStake(e.target.value)
              }
              className="h-9 focus-visible:ring-primary"
            />

            <div className="grid grid-cols-5 gap-1.5">
              {presets.map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 border-border px-0 font-mono text-[11px] hover:bg-accent/40",
                    stake === val.toString() &&
                      "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => selectPreset(val)}
                >
                  {val}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            {betslip.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Stake (per selection)
                </span>
                <span className="font-mono font-semibold">
                  KES {parsedStake.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Stake</span>
              <span className="font-mono font-semibold text-foreground">
                KES {totalStake.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-bold">Total potential return</span>
              <span className="font-mono text-sm font-extrabold text-primary">
                KES{" "}
                {totalPotentialReturn.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <Button
            onClick={handlePlaceBet}
            className="h-10 w-full bg-primary text-xs font-bold text-primary-foreground hover:opacity-95"
            disabled={isPlacing}
          >
            {isPlacing ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" /> Placing...
              </span>
            ) : !user ? (
              "Log in to place bet"
            ) : (
              `Place bets - KES ${totalStake.toLocaleString()}`
            )}
          </Button>
        </div>
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
