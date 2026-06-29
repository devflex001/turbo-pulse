"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Smartphone,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PaymentStage =
  | "initiating"
  | "pending_user_action"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "timeout"
  | "error"

interface PaymentStep {
  id: string
  label: string
  icon: React.ReactNode
  status: "pending" | "active" | "complete" | "error"
}

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stage: PaymentStage
  amount?: number
  phone?: string
  provider: "mpesa" | "paystack"
  message?: string
  resultCode?: string
  mpesaReceiptNumber?: string
  paystackReference?: string
  onReset?: () => void
  onClose?: () => void
}

const stageMessages = {
  mpesa: {
    initiating: {
      title: "Initiating Payment",
      description: "Connecting to M-Pesa...",
      icon: Loader2,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    pending_user_action: {
      title: "Check Your Phone",
      description: "Enter your M-Pesa PIN to complete the payment",
      icon: Smartphone,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    processing: {
      title: "Processing Payment",
      description: "Confirming your transaction...",
      icon: Loader2,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    success: {
      title: "Payment Successful!",
      description: "Your wallet has been credited",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    failed: {
      title: "Payment Failed",
      description: "The transaction could not be completed",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    cancelled: {
      title: "Payment Cancelled",
      description: "You cancelled the payment request",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    timeout: {
      title: "Request Timeout",
      description: "No response received",
      icon: Clock,
      color: "text-gray-600",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
    },
    error: {
      title: "Error",
      description: "An error occurred",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  },
  paystack: {
    initiating: {
      title: "Initiating Payment",
      description: "Opening secure payment gateway...",
      icon: Loader2,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    pending_user_action: {
      title: "Complete Payment",
      description: "Enter your card details in the secure window",
      icon: Lock,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    processing: {
      title: "Verifying Payment",
      description: "Confirming your transaction...",
      icon: Loader2,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    success: {
      title: "Payment Successful!",
      description: "Your wallet has been credited",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    failed: {
      title: "Payment Failed",
      description: "The transaction could not be completed",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    cancelled: {
      title: "Payment Cancelled",
      description: "You closed the payment window",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    timeout: {
      title: "Request Timeout",
      description: "Payment took too long to complete",
      icon: Clock,
      color: "text-gray-600",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/20",
    },
    error: {
      title: "Error",
      description: "An error occurred",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  },
}

export function PaymentModal({
  open,
  onOpenChange,
  stage,
  amount,
  phone,
  provider,
  message,
  resultCode,
  mpesaReceiptNumber,
  paystackReference,
  onReset,
  onClose,
}: PaymentModalProps) {
  // Safeguard: default to "initiating" if stage is undefined or not found
  const safeStage = stage || "initiating"
  const config = stageMessages[provider]?.[safeStage] || stageMessages[provider]["initiating"]
  const Icon = config.icon
  const isLoading = ["initiating", "pending_user_action", "processing"].includes(safeStage)
  const isComplete = ["success", "failed", "cancelled", "timeout", "error"].includes(safeStage)

  // Auto-close on success after 3 seconds
  React.useEffect(() => {
    if (safeStage === "success" && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [safeStage, onClose])

  const steps: PaymentStep[] = React.useMemo(() => {
    const baseSteps: PaymentStep[] = [
      {
        id: "init",
        label: "Initiating",
        icon: <Loader2 className="h-4 w-4" />,
        status: "complete",
      },
      {
        id: "user",
        label: provider === "mpesa" ? "Awaiting PIN" : "Payment Details",
        icon: provider === "mpesa" ? (
          <Smartphone className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        ),
        status:
          safeStage === "pending_user_action"
            ? "active"
            : ["processing", "success"].includes(safeStage)
              ? "complete"
              : "pending",
      },
      {
        id: "process",
        label: "Processing",
        icon: <Loader2 className="h-4 w-4" />,
        status:
          safeStage === "processing"
            ? "active"
            : safeStage === "success"
              ? "complete"
              : "pending",
      },
      {
        id: "complete",
        label: "Complete",
        icon: <CheckCircle2 className="h-4 w-4" />,
        status: safeStage === "success" ? "complete" : "pending",
      },
    ]

    if (["failed", "cancelled", "timeout", "error"].includes(safeStage)) {
      baseSteps[baseSteps.length - 1] = {
        id: "complete",
        label: safeStage === "failed" ? "Failed" : safeStage === "cancelled" ? "Cancelled" : safeStage === "timeout" ? "Timeout" : "Error",
        icon: <XCircle className="h-4 w-4" />,
        status: "error",
      }
    }

    return baseSteps
  }, [safeStage, provider])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Payment in Progress</DialogTitle>
          <DialogDescription className="text-center">
            {provider === "mpesa" ? "M-Pesa" : "Paystack"} Transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-between px-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                      step.status === "complete" &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-600",
                      step.status === "active" &&
                      "border-primary bg-primary/10 text-primary animate-pulse",
                      step.status === "pending" &&
                      "border-gray-300 bg-gray-100 text-gray-400",
                      step.status === "error" &&
                      "border-red-500 bg-red-500/10 text-red-600"
                    )}
                  >
                    {step.status === "active" && isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors duration-300",
                      step.status === "complete" && "text-emerald-600",
                      step.status === "active" && "text-primary",
                      step.status === "pending" && "text-gray-400",
                      step.status === "error" && "text-red-600"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={cn(
                        "h-0.5 transition-all duration-500",
                        steps[index + 1].status === "complete" ||
                          steps[index + 1].status === "active"
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Main Status Card */}
          <div
            className={cn(
              "border rounded-lg p-6 transition-all duration-300 animate-in fade-in-50",
              config.borderColor,
              config.bgColor
            )}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Icon with animation */}
              <div className="relative">
                {safeStage === "pending_user_action" && (
                  <span className="flex h-3 w-3 absolute -top-1 -right-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                )}
                <Icon
                  className={cn(
                    "h-12 w-12 transition-all duration-300",
                    config.color,
                    isLoading && "animate-spin"
                  )}
                />
              </div>

              {/* Title and Description */}
              <div className="space-y-2">
                <h3 className={cn("font-semibold text-lg", config.color)}>
                  {config.title}
                </h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>

              {/* Additional Info */}
              {amount && (
                <div className="w-full bg-background/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold font-mono">
                      KES {amount.toLocaleString()}
                    </span>
                  </div>
                  {phone && provider === "mpesa" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-mono">{phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Message */}
              {message && (
                <div className="w-full">
                  <div
                    className={cn(
                      "text-xs rounded-lg p-3 border",
                      safeStage === "success"
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700"
                        : safeStage === "failed" || safeStage === "error"
                          ? "bg-red-500/5 border-red-500/20 text-red-700"
                          : "bg-amber-500/5 border-amber-500/20 text-amber-700"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Number */}
              {(mpesaReceiptNumber || paystackReference) && (
                <div className="w-full">
                  <div className="text-xs text-muted-foreground mb-1">
                    Transaction Receipt
                  </div>
                  <code className="block text-xs font-mono bg-background/50 border rounded p-2 break-all">
                    {mpesaReceiptNumber || paystackReference}
                  </code>
                </div>
              )}

              {/* Loading Tips */}
              {safeStage === "pending_user_action" && provider === "mpesa" && (
                <div className="w-full pt-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 animate-pulse" />
                    <p className="leading-relaxed">
                      A prompt has been sent to {phone}. Check your phone and enter your
                      M-Pesa PIN to complete the payment.
                    </p>
                  </div>
                </div>
              )}

              {safeStage === "processing" && (
                <div className="w-full pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p>This usually takes a few seconds...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isComplete && (
            <div className="flex gap-2">
              {safeStage === "success" ? (
                <Button
                  onClick={() => {
                    if (onClose) onClose()
                    if (onReset) onReset()
                  }}
                  className="w-full gap-2"
                >
                  Deposit Again
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                      if (onReset) onReset()
                    }}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 text-emerald-600" />
            <span>
              Secured by {provider === "mpesa" ? "M-Pesa Daraja API" : "Paystack"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
