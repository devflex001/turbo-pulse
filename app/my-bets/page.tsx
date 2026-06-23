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
import { getAuthToken } from "@/lib/auth/jwt"

export default function MyBetsPage() {
  const { setActiveTab } = useBetStore()
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null)
  const [loginOpen, setLoginOpen] = React.useState(false)

  // Check session on mount - synchronously from localStorage
  React.useEffect(() => {
    const token = getAuthToken()
    const isAuth = !!token

    if (!isAuth) {
      setLoginOpen(true)
      setIsAuthenticated(false)
    } else {
      setIsAuthenticated(true)
    }
  }, [])

  // Listen for storage changes (logout from other tabs)
  React.useEffect(() => {
    const handleStorageChange = () => {
      const token = getAuthToken()
      const isAuth = !!token

      if (!isAuth) {
        setIsAuthenticated(false)
        setLoginOpen(true)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  React.useEffect(() => {
    setActiveTab("mybets")
  }, [setActiveTab])

  const allMatches = useQuery(api.sportsData.listMatches, { limit: 300 })
  const liveCount = React.useMemo(
    () => (allMatches?.items ?? []).filter((match: any) => match.isLive).length,
    [allMatches]
  )

  // Don't render anything until we know auth status
  if (isAuthenticated === null) {
    return null
  }

  // If not authenticated, only show login modal
  if (!isAuthenticated) {
    return (
      <>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
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

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
