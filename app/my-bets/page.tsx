"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { MyBetsPanel } from "@/components/my-bets-panel"
import { LoginModal } from "@/components/modals"
import { useBetStore } from "@/hooks/use-bet-store"
import { useAuth } from "@/lib/auth/AuthContext"
import { Loader2 } from "lucide-react"

export default function MyBetsPage() {
  const { setActiveTab } = useBetStore()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = React.useState(false)

  // Only render after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    setActiveTab("mybets")
  }, [setActiveTab])

  const allMatches = useQuery(api.sportsData.listMatches, { limit: 300 })
  const liveCount = React.useMemo(
    () => (allMatches?.items ?? []).filter((match: any) => match.isLive).length,
    [allMatches]
  )

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
        <BottomNav liveCount={liveCount} />
      </div>
    )
  }

  // Not logged in state
  if (!user) {
    return (
      <>
        <div className="flex flex-col h-screen overflow-hidden bg-background">
          <Header />
          <div className="flex flex-1" />
          <BottomNav liveCount={liveCount} />
        </div>
        <LoginModal open={true} onOpenChange={() => { }} />
      </>
    )
  }

  // Authenticated - render full page
  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />

        <div className="flex-1 flex max-w-[1400px] w-full mx-auto overflow-hidden">
          <Sidebar className="hidden lg:flex w-60 shrink-0 h-full" />

          <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto h-full flex flex-col gap-6 scrollbar-thin">
            <div className="flex flex-col gap-6 w-full">
              <MyBetsPanel />
            </div>
          </main>
        </div>

        <BottomNav liveCount={liveCount} />
      </div>
    </>
  )
}
