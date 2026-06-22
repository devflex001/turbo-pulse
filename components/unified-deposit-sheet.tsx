"use client"

import React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { DepositSheet } from "./deposit-sheet"
import { PaystackDepositSheet } from "./paystack-deposit-sheet"

/**
 * Unified Deposit Sheet Component
 * Automatically switches between M-Pesa and Paystack based on admin configuration
 * Uses react-paystack library for embedded modal payments (no redirects)
 */
export function UnifiedDepositSheet() {
  const paymentMode = useQuery(api.paymentMode.getActiveMode)

  // Loading state
  if (!paymentMode) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    )
  }

  // Render based on payment mode
  if (paymentMode.mode === "paystack") {
    return <PaystackDepositSheet />
  }

  // Default to M-Pesa
  return <DepositSheet />
}
