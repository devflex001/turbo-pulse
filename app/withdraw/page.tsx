"use client"

import { useAuth } from "@/lib/auth/AuthContext"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { LoginModal } from "@/components/modals"
import { WithdrawalSheet } from "@/components/withdrawal-sheet"

export default function WithdrawalPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav liveCount={0} />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <Header />
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="space-y-3 text-center text-muted-foreground">
              <p>Please log in to withdraw funds</p>
            </div>
          </div>
          <BottomNav liveCount={0} />
        </div>
        <LoginModal open={true} onOpenChange={() => {}} />
      </>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 overflow-hidden">
        <Sidebar className="hidden h-full w-60 shrink-0 lg:flex" />

        <main className="flex h-full min-w-0 flex-1 scrollbar-thin flex-col gap-4 overflow-y-auto p-4 sm:p-6">
          {/* Minimal Header */}
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden sm:inline-block">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-sm font-semibold">Withdraw Funds</h1>
          </div>

          {/* Withdrawal Form */}
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-lg border border-border bg-card p-4">
              <WithdrawalSheet />
            </div>
          </div>
        </main>
      </div>

      <BottomNav liveCount={0} />
    </div>
  )
}
