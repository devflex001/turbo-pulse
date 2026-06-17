"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { useBetStore } from "@/hooks/use-bet-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Loader2, ArrowLeft, ArrowUpRight, Wallet, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000]

// Validation helpers
function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

export default function DepositPage() {
  const { walletBalance } = useBetStore()
  const convexUser = useQuery(api.users.currentUser)
  
  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [provider, setProvider] = React.useState<"m-pesa" | "sasapay">("m-pesa")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [depositState, setDepositState] = React.useState<"idle" | "sending" | "pending_stk" | "success" | "failed">("idle")
  const [pendingTxId, setPendingTxId] = React.useState("")

  // Pre-fill phone if logged in
  React.useEffect(() => {
    if (convexUser?.phone) {
      // Clean prefix if it is +254... to show standard local number format
      let rawPhone = convexUser.phone
      if (rawPhone.startsWith("+254")) {
        rawPhone = "0" + rawPhone.slice(4)
      } else if (rawPhone.startsWith("254")) {
        rawPhone = "0" + rawPhone.slice(3)
      }
      setPhone(rawPhone)
    }
  }, [convexUser])

  // Monitor transactions for status change if we have a pending deposit
  React.useEffect(() => {
    if (depositState !== "pending_stk" || !pendingTxId) return

    const interval = setInterval(() => {
      const stored = localStorage.getItem("bet_transactions")
      if (stored) {
        const list = JSON.parse(stored)
        const currentTx = list.find((t: any) => t.id === pendingTxId)
        if (currentTx) {
          if (currentTx.status === "success") {
            setDepositState("success")
            clearInterval(interval)
            toast.success(`KES ${parseFloat(amount).toLocaleString()} successfully deposited!`)
          } else if (currentTx.status === "failed") {
            setDepositState("failed")
            clearInterval(interval)
            toast.error("Deposit request failed or was cancelled.")
          }
        }
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [depositState, pendingTxId, amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      toast.error("Minimum deposit amount is KES 10")
      return
    }
    if (!isValidKenyanPhone(phone)) {
      toast.error("Please enter a valid phone number (e.g. 0712345678)")
      return
    }

    setIsSubmitting(true)
    setDepositState("sending")
    
    setIsSubmitting(false)
    setDepositState("pending_stk")
  }

  const resetDeposit = () => {
    setAmount("")
    setDepositState("idle")
    setPendingTxId("")
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 h-full" />

        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-6 scrollbar-thin">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Deposit Funds</h1>
              <p className="text-xs text-muted-foreground">Add funds to your wallet instantly.</p>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto space-y-4">
            {/* Balance Card */}
            <div className="border border-border bg-card p-4 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Wallet Balance</p>
                  <p className="text-sm font-bold mt-0.5">KES {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <Badge variant="outline" className="font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                Active Wallet
              </Badge>
            </div>

            {/* Deposit States */}
            {depositState === "idle" && (
              <div className="border border-border bg-card rounded-lg p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Payment Channel Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block">Select Payment Channel</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={provider === "m-pesa" ? "default" : "outline"}
                        className="h-10 text-xs font-bold"
                        onClick={() => setProvider("m-pesa")}
                      >
                        M-Pesa Express
                      </Button>
                      <Button
                        type="button"
                        variant={provider === "sasapay" ? "default" : "outline"}
                        className="h-10 text-xs font-bold"
                        onClick={() => setProvider("sasapay")}
                      >
                        SasaPay
                      </Button>
                    </div>
                  </div>

                  {/* Amount and Quick Buttons */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block" htmlFor="amount-in">Deposit Amount (KES)</label>
                    <Input
                      id="amount-in"
                      type="number"
                      min="10"
                      placeholder="Enter amount (Min KES 10)"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-3 gap-2 pt-1.5">
                      {QUICK_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant="outline"
                          className="h-8 text-xs font-semibold"
                          onClick={() => setAmount(amt.toString())}
                        >
                          + {amt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block" htmlFor="phone-in">Mobile Number (STK Push Target)</label>
                    <Input
                      id="phone-in"
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">Enter a registered Kenyan mobile number. An STK PIN prompt will appear on your device.</p>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" className="w-full font-bold gap-1.5 mt-2 h-10">
                    <ArrowUpRight className="h-4 w-4" />
                    Deposit Instantly
                  </Button>
                </form>
              </div>
            )}

            {depositState === "sending" && (
              <div className="border border-border bg-card rounded-lg p-8 text-center flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Initiating Deposit</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Processing your deposit request...</p>
                </div>
              </div>
            )}

            {depositState === "pending_stk" && (
              <div className="border border-border bg-card rounded-lg p-6 text-center flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <span className="flex h-3 w-3 absolute top-0 right-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm">Action Required on Mobile Phone</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We have fired an STK payment push to <strong className="text-foreground">{phone}</strong>. Please check your phone screen, enter your M-Pesa/SasaPay PIN, and confirm payment.
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 italic pt-1">
                    Waiting for confirmation... (Auto-completing in 12s)
                  </p>
                </div>
                <div className="flex w-full gap-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold" onClick={resetDeposit}>
                    Cancel / Try Again
                  </Button>
                </div>
              </div>
            )}

            {depositState === "success" && (
              <div className="border border-border bg-card rounded-lg p-6 text-center flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Deposit Successful!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your account has been credited with KES {parseFloat(amount).toLocaleString()}. You can now use your balance to place bets.
                  </p>
                </div>
                <div className="flex w-full gap-2 pt-2">
                  <Button className="w-full text-xs font-bold" onClick={resetDeposit}>
                    Make Another Deposit
                  </Button>
                  <Link href="/" className="w-full">
                    <Button variant="outline" className="w-full text-xs font-bold">
                      Go to Betting Board
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {depositState === "failed" && (
              <div className="border border-border bg-card rounded-lg p-6 text-center flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-destructive/10 text-destructive rounded-full">
                  <CheckCircle2 className="h-10 w-10 rotate-45" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Deposit Failed</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The transaction request did not complete successfully. This could be due to a wrong PIN, insufficient funds, or network cancellation.
                  </p>
                </div>
                <Button className="w-full text-xs font-bold" onClick={resetDeposit}>
                  Try Again
                </Button>
              </div>
            )}
          </div>

          <footer className="mt-auto pt-8 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>&nbsp;</span>
          </footer>
        </main>
      </div>

      <BottomNav liveCount={0} />
    </div>
  )
}
