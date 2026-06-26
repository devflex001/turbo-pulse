"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { Id } from "@/convex/_generated/dataModel"
import {
  Loader2,
  ArrowDownLeft,
  ArrowUpFromLine,
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  Info,
  Lock,
} from "lucide-react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Separator } from "@/components/ui/separator"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "form"          // User enters amount + phone
  | "fee-paying"    // Paystack modal open for the withdrawal fee
  | "submitting"    // Calling submitWithdrawalRequest mutation
  | "success"       // Request submitted — show dialog with instant option
  | "instant-paying"// Paystack modal for KES 150 instant fee
  | "instant-done"  // Instant processing confirmed
  | "error"

// ─── Component ────────────────────────────────────────────────────────────────

export function WithdrawalSheet({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth()
  const wallet = useQuery(
    api.mpesa.getWallet,
    user?._id ? { userId: user._id } : "skip"
  )
  const config = useQuery(api.platformConfig.getUserFacingConfig)
  const submitWithdrawal = useMutation(api.withdrawals.submitWithdrawalRequest)
  const payInstantFee = useMutation(api.withdrawals.payInstantFee)
  const [step, setStep] = React.useState<Step>("form")
  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")

  React.useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone)
    }
  }, [user?.phone])

  React.useEffect(() => {
    if (config?.minWithdrawal && !amount) {
      setAmount(config.minWithdrawal.toString())
    }
  }, [config?.minWithdrawal])
  const [error, setError] = React.useState<string | null>(null)
  const [requestId, setRequestId] = React.useState<Id<"withdrawal_requests"> | null>(null)
  const [paystackPublicKey, setPaystackPublicKey] = React.useState("")
  const [paystackLoaded, setPaystackLoaded] = React.useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false)
  const [showFeeConfirmDialog, setShowFeeConfirmDialog] = React.useState(false)

  const minWithdrawal = config?.minWithdrawal ?? 500
  const feePercent = config?.withdrawalFeePercent ?? 2.5
  const instantFee = config?.instantProcessingFee ?? 150

  const isLoading = config === undefined || wallet === undefined

  const parsedAmount = parseFloat(amount) || 0
  const calculatedFee = Math.ceil((parsedAmount * feePercent) / 100)

  // ── Load Paystack ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (window.PaystackPop) {
      setPaystackLoaded(true)
    } else {
      const script = document.createElement("script")
      script.src = "https://js.paystack.co/v2/inline.js"
      script.async = true
      script.onload = () => setTimeout(() => {
        if (window.PaystackPop) setPaystackLoaded(true)
      }, 100)
      document.body.appendChild(script)
    }

    fetch("/api/paystack/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.publicKey) setPaystackPublicKey(d.publicKey)
      })
      .catch(() => toast.error("Failed to load payment config"))
  }, [])

  // Force body pointer-events to auto when Paystack modal is active, overriding Radix UI's modal blocker
  React.useEffect(() => {
    if (step === "fee-paying" || step === "instant-paying") {
      const originalPointerEvents = document.body.style.pointerEvents
      document.body.style.pointerEvents = "auto"

      const styleEl = document.createElement("style")
      styleEl.id = "paystack-pointer-override"
      styleEl.innerHTML = `
        body { pointer-events: auto !important; }
      `
      document.head.appendChild(styleEl)

      return () => {
        document.body.style.pointerEvents = originalPointerEvents
        const el = document.getElementById("paystack-pointer-override")
        if (el) el.remove()
      }
    }
  }, [step])

  // ── Helpers ────────────────────────────────────────────────────────────────

  function openPaystack(opts: {
    amountKes: number
    ref: string
    label: string
    onSuccess: (ref: string) => void
    onCancel: () => void
  }) {
    if (!window.PaystackPop || !paystackPublicKey) {
      setError("Payment system not ready. Please refresh.")
      setStep("error")
      return
    }
    const sanitizedPhone = (user?.phone ?? "user").replace(/[^a-zA-Z0-9]/g, "")
    const email = `user${sanitizedPhone}@betflexx.com`
    const popup = window.PaystackPop.setup({
      key: paystackPublicKey,
      email,
      amount: Math.round(opts.amountKes * 100),
      ref: opts.ref,
      onSuccess: (tx) => opts.onSuccess(tx.reference),
      onClose: opts.onCancel,
    })
    popup.openIframe()
  }

  function validateForm(): string | null {
    if (isLoading || !config || !wallet) return "Loading configuration, please wait..."
    if (!parsedAmount || parsedAmount <= 0) return "Enter a valid amount"
    if (parsedAmount < minWithdrawal)
      return `Minimum withdrawal is KES ${minWithdrawal.toLocaleString()}`
    if (parsedAmount > wallet.balance)
      return "Insufficient wallet balance"
    if (!phone.trim()) return "Enter your M-Pesa phone number"
    if (!/^(?:\+254|254|0)?([71]\d{8})$/.test(phone.trim()))
      return "Enter a valid Kenyan phone number (e.g. 0712345678)"
    return null
  }

  // ── Step: user clicks Withdraw ─────────────────────────────────────────────
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (isLoading) {
      setError("Loading configuration, please wait...")
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!paystackLoaded || !paystackPublicKey) {
      setError("Payment system is still loading. Please wait.")
      return
    }

    setShowFeeConfirmDialog(true)
  }

  async function handleConfirmAndPayFee() {
    setShowFeeConfirmDialog(false)
    setStep("fee-paying")

    const feeRef = `WDFEE-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    openPaystack({
      amountKes: calculatedFee,
      ref: feeRef,
      label: "Withdrawal Fee",
      onSuccess: async (reference) => {
        setStep("submitting")
        try {
          const result = await submitWithdrawal({
            userId: user?._id,
            amount: parsedAmount,
            feeAmount: calculatedFee,
            feeTxReference: reference,
            phone: phone.trim(),
          })
          setRequestId(result.requestId)
          setStep("success")
          setShowSuccessDialog(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to submit request")
          setStep("error")
        }
      },
      onCancel: () => {
        setStep("form")
        toast.info("Fee payment cancelled")
      },
    })
  }

  // ── Step: user clicks Pay KES 150 ──────────────────────────────────────────
  function handlePayInstantFee() {
    if (!requestId) return
    setStep("instant-paying")

    const instantRef = `WDINST-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    openPaystack({
      amountKes: instantFee,
      ref: instantRef,
      label: "Instant Processing",
      onSuccess: async (reference) => {
        try {
          await payInstantFee({
            userId: user?._id,
            requestId,
            instantFeeTxReference: reference,
          })
          setStep("instant-done")
          setShowSuccessDialog(true)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to register instant fee")
          setStep("success")
          setShowSuccessDialog(true)
        }
      },
      onCancel: () => {
        setStep("success")
        setShowSuccessDialog(true)
        toast.info("Instant payment cancelled")
      },
    })
  }

  function handleReset() {
    setStep("form")
    setAmount("")
    setPhone("")
    setError(null)
    setRequestId(null)
    setShowSuccessDialog(false)
  }

  // ── Render: loading / submitting states ────────────────────────────────────

  if (step === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Submitting your request…</p>
      </div>
    )
  }

  if (step === "instant-paying") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Opening instant payment…</p>
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Something went wrong</p>
            <p className="text-xs text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full text-xs font-bold h-9" onClick={handleReset}>
          Try Again
        </Button>
      </div>
    )
  }

  // ── Render: instant done ───────────────────────────────────────────────────

  if (step === "instant-done") {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full">
          <Zap className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">Instant Processing Activated!</p>
          <p className="text-xs text-muted-foreground">
            Your withdrawal of{" "}
            <span className="font-semibold">KES {parsedAmount.toLocaleString()}</span> will be
            processed shortly.
          </p>
        </div>
        <Button className="w-full text-xs font-bold h-9 mt-2" onClick={() => { handleReset(); onSuccess?.() }}>
          Done
        </Button>
      </div>
    )
  }

  // ── Render: main form ──────────────────────────────────────────────────────

  return (
    <>
      <form onSubmit={handleSubmitForm} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Balance */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Available Balance
          </label>
          <p className="text-lg font-bold  text-emerald-500">
            KES{" "}
            {wallet?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
          </p>
        </div>

        <Separator />

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="wd-amount">
            Withdrawal Amount (KES) <span className="text-destructive">*</span>
          </label>
          <Input
            id="wd-amount"
            type="number"
            min={minWithdrawal}
            placeholder={`Min KES ${minWithdrawal.toLocaleString()}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm focus-visible:ring-primary"
            disabled={step === "fee-paying" || isLoading}
          />
          {/* {config && (
            <p className="text-[10px] text-muted-foreground">
              Min: KES {minWithdrawal.toLocaleString()}
            </p>
          )} */}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground" htmlFor="wd-phone">
            M-Pesa Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="wd-phone"
            type="tel"
            placeholder="0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-sm focus-visible:ring-primary"
            disabled={step === "fee-paying" || isLoading}
          />
        </div>

        {/* Fee preview line */}
        {parsedAmount >= minWithdrawal && (
          <div className="text-xs text-muted-foreground flex justify-between items-center py-1 bg-muted/20 border border-border/50 rounded-lg p-2.5 font-sans">
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              Processing Fee ({feePercent}%)
            </span>
            <span className="font-bold font-mono text-foreground">
              KES {calculatedFee.toLocaleString()}
            </span>
          </div>
        )}

        <Button
          type="submit"
          className="w-full text-sm font-bold gap-1.5 h-9"
          disabled={step === "fee-paying" || !paystackLoaded || isLoading || !wallet || wallet.balance === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading configuration…
            </>
          ) : step === "fee-paying" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Awaiting fee payment…
            </>
          ) : (
            <>
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </>
          )}
        </Button>
      </form>

      {/* ── Fee Confirmation Dialog ─────────────────────────────────────────── */}
      <ResponsiveModal
        open={showFeeConfirmDialog}
        onOpenChange={setShowFeeConfirmDialog}
        title={
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="p-1.5 bg-primary/10 text-primary rounded-full shrink-0">
              <Lock className="h-4 w-4" />
            </span>
            <span>Security Verification Required</span>
          </span>
        }
        description="Please review the transaction summary below. Platform policy requires a processing fee to be settled before submission."
        className="sm:max-w-md"
      >
        <div className="space-y-4 py-2">
          {/* Transaction Invoice Summary */}
          <div className="border border-border rounded-lg overflow-hidden bg-muted/10 font-sans">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Remittance Summary
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="h-1 w-1 rounded-full bg-emerald-600 animate-pulse" />
                Authorized
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Dest. Phone (M-Pesa):</span>
                <span className="font-bold text-foreground font-mono">{phone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Withdrawal Amount:</span>
                <span className="font-bold text-foreground font-mono">KES {parsedAmount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Processing Fee ({feePercent}%):</span>
                <span className="font-extrabold text-amber-600 font-mono">
                  KES {calculatedFee.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Note / Terms */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3.5 space-y-1.5 font-sans">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs font-semibold text-amber-700">Fee Notice</p>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700/80">
              A processing fee of <span className="font-bold text-amber-800">KES {calculatedFee.toLocaleString()}</span> ({feePercent}%) is required to release the requested amount. This payment must be settled through our secure portal and will not affect your current balance.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              className="text-xs font-semibold h-9"
              onClick={() => setShowFeeConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="text-xs font-bold gap-1.5 h-9"
              onClick={handleConfirmAndPayFee}
            >
              <Lock className="h-3.5 w-3.5" />
              Pay Fee & Submit
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      {/* ── Success Dialog ───────────────────────────────────────────────────── */}
      <ResponsiveModal
        open={showSuccessDialog && step === "success"}
        onOpenChange={(open) => {
          if (!open) {
            handleReset()
            onSuccess?.()
          }
        }}
        title={
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Request Submitted!</span>
          </span>
        }
        description={
          <span className="block text-xs text-muted-foreground pt-1">
            Your withdrawal of{" "}
            <span className="font-semibold text-foreground">
              KES {parsedAmount.toLocaleString()}
            </span>{" "}
            has been submitted for review.
          </span>
        }
        className="sm:max-w-md"
      >
        <div className="space-y-3 py-1">
          {/* Standard processing */}
          <div className="bg-muted/40 border border-border rounded-lg p-3 flex gap-2.5">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold">Standard Processing</p>
              <p className="text-[11px] text-muted-foreground">
                Your request is pending admin approval. Processing typically takes a few hours.
              </p>
            </div>
          </div>

          <Separator />

          {/* Instant processing upsell */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">Want it faster?</p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-2.5">
              <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-primary">Instant Processing</p>
                <p className="text-[11px] text-muted-foreground">
                  Pay a one-time fee of{" "}
                  <span className="font-bold text-foreground">
                    KES {instantFee.toLocaleString()}
                  </span>{" "}
                  and your withdrawal will be prioritised immediately.
                </p>
              </div>
            </div>

            <Button
              className="w-full gap-1.5 text-xs font-bold h-9"
              onClick={handlePayInstantFee}
            >
              <Zap className="h-3.5 w-3.5" />
              Pay KES {instantFee.toLocaleString()} for Instant Processing
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full text-xs font-semibold h-8"
            onClick={() => { handleReset(); onSuccess?.() }}
          >
            No thanks, I&apos;ll wait
          </Button>
        </div>
      </ResponsiveModal>
    </>
  )
}
