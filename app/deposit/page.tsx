"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DepositSheet } from "@/components/deposit-sheet"
import { UnifiedDepositSheet } from "@/components/unified-deposit-sheet"

export default function DepositPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header />

      <div className="flex-1 flex max-w-[1400px] w-full mx-auto overflow-hidden">
        <Sidebar className="hidden lg:flex w-60 shrink-0 h-full" />

        <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-4 scrollbar-thin">
          {/* Minimal Header */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-sm font-semibold">Deposit Funds</h1>
          </div>

          {/* Deposit Form */}
          <div className="max-w-sm w-full mx-auto">
            <div className="border border-border bg-card rounded-lg p-4">
              <UnifiedDepositSheet />
            </div>
          </div>
        </main>
      </div>

      <BottomNav liveCount={0} />
    </div>
  )
}
