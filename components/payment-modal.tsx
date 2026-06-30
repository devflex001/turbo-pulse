"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Smartphone,
  ArrowRight,
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

const stageConfig = {
  mpesa: {
    initiating: {
      title: "Initiating",
      icon: Loader2,
      iconClass: "text-blue-600 animate-spin",
    },
    pending_user_action: {
      title: "Enter PIN",
      icon: Smartphone,
      iconClass: "text-primary animate-pulse",
    },
    processing: {
      title: "Processing",
      icon: Loader2,
      iconClass: "text-amber-600 animate-spin",
    },
    success: {
      title: "Success!",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    failed: {
      title: "Failed",
      icon: XCircle,
      iconClass: "text-red-600",
    },
    cancelled: {
      title: "Cancelled",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    },
    timeout: {
      title: "Timeout",
      icon: Clock,
      iconClass: "text-gray-600",
    },
    error: {
      title: "Error",
      icon: XCircle,
      iconClass: "text-red-600",
    },
  },
  paystack: {
    initiating: {
      title: "Initiating",
      icon: Loader2,
      iconClass: "text-blue-600 animate-spin",
    },
    pending_user_action: {
      title: "Complete",
      icon: Loader2,
      iconClass: "text-primary animate-spin",
    },
    processing: {
      title: "Processing",
      icon: Loader2,
      iconClass: "text-amber-600 animate-spin",
    },
    success: {
      title: "Success!",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    failed: {
      title: "Failed",
      icon: XCircle,
      iconClass: "text-red-600",
    },
    cancelled: {
      title: "Cancelled",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    },
    timeout: {
      title: "Timeout",
      icon: Clock,
      iconClass: "text-gray-600",
    },
    error: {
      title: "Error",
      icon: XCircle,
      iconClass: "text-red-600",
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
  mpesaReceiptNumber,
  paystackReference,
  onReset,
  onClose,
}: PaymentModalProps) {
  const safeStage = stage || "initiating"
  const config = stageConfig[provider]?.[safeStage] || stageConfig[provider]["initiating"]
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-0 bg-transparent shadow-none">
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          {/* Icon */}
          <Icon className={cn("h-16 w-16", config.iconClass)} />

          {/* Title */}
          <h2 className="text-2xl font-semibold text-center">{config.title}</h2>

          {/* Message - Only show if not success */}
          {message && safeStage !== "success" && (
            <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
          )}

          {/* Action Buttons */}
          {isComplete && (
            <div className="flex gap-2 w-full pt-4">
              {safeStage === "success" ? (
                <Button
                  onClick={() => {
                    if (onClose) onClose()
                    if (onReset) onReset()
                  }}
                  className="w-full gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (onClose) onClose()
                      if (onReset) onReset()
                    }}
                    className="flex-1"
                  >
                    Retry
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
