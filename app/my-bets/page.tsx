"use client"

import * as React from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { MyBetsPanel } from "@/components/my-bets-panel"
import { useBetStore } from "@/hooks/use-bet-store"

export default function MyBetsPage() {
  const { setActiveTab } = useBetStore()

  React.useEffect(() => {
    setActiveTab("mybets")
  }, [setActiveTab])

  const allMatches = useQuery(api.sportsData.listMatches, { limit: 300 })
  const liveCount = React.useMemo(
    () => (allMatches ?? []).filter((match: any) => match.isLive).length,
    [allMatches]
  )

  return (
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
  )
}
