"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Loader2,
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useAuthClient } from "@/lib/auth-client"

const MIN_WITHDRAWAL = 50
const MAX_WITHDRAWAL = 100000

function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

type WithdrawalState = "idle" | "loading" | "confirming" | "success" | "failed"

export function WithdrawalSheet() {
  const wallet = useQuery(api.mpesa.getWallet)
  const { user, isAuthenticated, isLoading: authLoading } = useAuthClient()

  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [state, setState] = React.useState<WithdrawalState>("idle")

  React.useEffect(() => {
    if (user?.phone) {
      let rawPhone = user.phone
      if (rawPhone.startsWith("+254")) {
        rawPhone = "0" + rawPhone.slice(4)
      } else if (rawPhone.startsWith("254")) {
        rawPhone = "0" + rawPhone.slice(3)
      }
      setPhone(rawPhone)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)

    if (!amount.trim() || isNaN(parsedAmount)) {
      toast.error("Enter a valid amount")
      return
    }

    if (parsedAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is KES ${MIN_WITHDRAWAL}`)
      return
    }

    if (parsedAmount > MAX_WITHDRAWAL) {
      toast.error(`Maximum withdrawal is KES ${MAX_WITHDRAWAL}`)
      return
    }

    if (!wallet || wallet.balance < parsedAmount) {
      toast.error("Insufficient balance")
      return
    }

    if (!isValidKenyanPhone(phone)) {
      toast.error("Enter valid phone (e.g. 0712345678)")
      return
    }

    if (!isAuthenticated || !user) {
      toast.error("Please log in")
      return
    }

    setState("loading")

    try {
      // TODO: Integrate with M-Pesa B2C API for actual withdrawal
      // For now, simulate the withdrawal
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setState("success")
      toast.success(`Withdrawal of KES ${parsedAmount} initiated`)
      setAmount("")

      // Reset after 3 seconds
      setTimeout(() => {
        setState("idle")
      }, 3000)
    } catch (error) {
      console.error("Withdrawal error:", error)
      toast.error("Failed to process withdrawal")
      setState("idle")
    }
  }

  const handleReset = () => {
    setAmount("")
    setState("idle")
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <p className="text-xs text-red-700 text-center">Please log in to withdraw</p>
        </div>
      </div>
    )
  }

  if (state === "idle") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Available: KES{" "}
            {wallet?.balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }) || "0.00"}
          </label>
          <Input
            type="number"
            min={MIN_WITHDRAWAL}
            max={MAX_WITHDRAWAL}
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Min: KES {MIN_WITHDRAWAL} | Max: KES {MAX_WITHDRAWAL}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Receive to Phone
          </label>
          <Input
            type="tel"
            placeholder="0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2">
          <div className="flex gap-2 items-start">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-700">
              Withdrawal fee 2%. Processing time: 1-5 minutes
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full text-sm font-bold gap-1.5 h-9"
          disabled={!wallet || wallet.balance === 0}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Withdraw
        </Button>
      </form>
    )
  }

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Processing...</p>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-full">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-semibold">Withdrawal Initiated!</p>
          <p className="text-xs text-muted-foreground">
            KES {parseFloat(amount).toLocaleString()}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">
          Funds will arrive within 5 minutes
        </p>
        <Button
          className="w-full text-xs font-bold h-8 mt-2"
          onClick={handleReset}
        >
          Done
        </Button>
      </div>
    )
  }

  if (state === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-4">
        <div className="p-2 bg-destructive/10 text-destructive rounded-full">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs font-semibold">Withdrawal Failed</p>
          <p className="text-xs text-muted-foreground">Please try again</p>
        </div>
        <Button
          className="w-full text-xs font-bold h-8 mt-2"
          onClick={handleReset}
        >
          Retry
        </Button>
      </div>
    )
  }

  return null
}
