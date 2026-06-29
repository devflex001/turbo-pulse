"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useBetStore } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoginModal } from "@/components/modals"
import { Trash2, X, Wallet, AlertCircle, Loader2 } from "lucide-react"
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

  if (betslip.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground h-full min-h-[200px] gap-3">
        <div className="rounded-full bg-muted/60 p-4 border border-dashed border-border">
          <Trash2 className="size-8 text-muted-foreground/50" />
        </div>
        <p className="font-semibold text-foreground text-sm">Betslip is empty</p>
        <p className="text-xs max-w-[220px]">
          Tap odds on any fixture to add selections here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card text-card-foreground">
      <div className="flex shrink-0 items-center justify-end px-4 py-1 border-b border-border bg-muted/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearBetslip}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-[10px] h-6 px-2 py-0.5 font-medium"
        >
          Clear all
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-1 sm:px-4">
        <div className="divide-y divide-border/40 pb-2">
          {betslip.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-col gap-1 py-3 text-xs"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-0 size-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                onClick={() => removeFromBetslip(item.id)}
                aria-label="Remove selection"
              >
                <X className="size-2.5" />
              </Button>

              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="font-semibold text-foreground break-words leading-tight text-[11px] block pr-1">
                    {item.matchName}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {item.market} • <span className="font-bold text-foreground">{item.selectionName}</span>
                  </span>
                </div>
                <div className="shrink-0 pt-0.5">
                  <span className="font-bold text-primary font-mono text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                    {item.odds.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 p-3 sm:p-4 bg-muted/20 border-t border-border space-y-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span>Stake (KES)</span>
            {user && (
              <span className="flex items-center gap-1 text-muted-foreground font-normal">
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
            className="focus-visible:ring-primary h-9"
          />

          <div className="grid grid-cols-5 gap-1.5">
            {presets.map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 px-0 text-[11px] font-mono border-border hover:bg-accent/40",
                  stake === val.toString() &&
                  "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
                onClick={() => selectPreset(val)}
              >
                {val}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5 text-xs pt-1">
          {betslip.length > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Stake (per selection)</span>
              <span className="font-semibold font-mono">
                KES {parsedStake.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Stake</span>
            <span className="font-semibold font-mono text-foreground">
              KES {totalStake.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-bold text-sm">Total potential return</span>
            <span className="font-extrabold font-mono text-sm text-primary">
              KES {totalPotentialReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePlaceBet}
          className="w-full bg-primary text-primary-foreground font-bold hover:opacity-95 text-xs h-10"
          disabled={isPlacing}
        >
          {isPlacing ? (
            <span className="flex items-center gap-1.5 justify-center">
              <Loader2 className="size-3.5 animate-spin" /> Placing…
            </span>
          ) : !user ? (
            "Log in to place bet"
          ) : (
            `Place bets · KES ${totalStake.toLocaleString()}`
          )}
        </Button>
      </div>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
