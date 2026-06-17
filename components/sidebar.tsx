"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Home, PlayCircle, History, Trophy, Activity, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface SidebarProps {
  className?: string
}

type MatchRecord = {
  sportSlug: string
  competitionName: string
  isLive: boolean
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function Sidebar({ className }: SidebarProps) {
  const { activeTab, setActiveTab, setSelectedSport, selectedSport, selectedLeague, setSelectedLeague } =
    useBetStore()
  const router = useRouter()

  const allMatches = useQuery(api.sportsData.listMatches, { limit: 300 }) as
    | MatchRecord[]
    | undefined
  const competitions = useQuery(api.sportsData.listCompetitions, {
    sport: selectedSport,
  }) as string[] | undefined

  const liveCount = React.useMemo(
    () => (allMatches ?? []).filter((match) => match.isLive).length,
    [allMatches]
  )

  const sportItems = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const match of allMatches ?? []) {
      const key = match.sportSlug || "all"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return [
      { id: "all", label: "All Sports", count: allMatches?.length ?? 0 },
      ...Array.from(counts.entries())
        .filter(([key]) => key !== "all")
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: titleCase(id), count })),
    ]
  }, [allMatches])

  const mainNavItems = [
    { id: "home", label: "Homepage", icon: Home },
    { id: "live", label: "Live Matches", icon: PlayCircle, count: liveCount },
    { id: "mybets", label: "My Bets", icon: History },
  ]

  const handleTabClick = (id: string) => {
    setActiveTab(id)
    if (id === "home") {
      setSelectedSport("all")
      setSelectedLeague("All Leagues")
      return
    }

    if (id === "live") {
      setSelectedLeague("All Leagues")
      return
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-card text-card-foreground",
        className
      )}
    >
      <div className="px-4 pt-6">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </h2>
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "h-9 w-full justify-between px-3 text-sm font-normal",
                  isActive
                    ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => handleTabClick(item.id)}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </span>
                {"count" in item && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {item.count}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="px-4">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Services
        </h2>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2.5 px-3 text-sm font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            onClick={() => router.push("/deposit")}
          >
            <ArrowUpRight className="size-4 text-emerald-500" />
            <span>Deposit Funds</span>
          </Button>
        </div>
      </div>

      <div className="px-4">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sports
        </h2>
        <div className="space-y-1">
          {!allMatches ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : (
            sportItems.map((sport) => {
              const isActive = selectedSport === sport.id || (sport.id === "all" && selectedSport === "all")
              return (
                <Button
                  key={sport.id}
                  variant="ghost"
                  className={cn(
                    "h-9 w-full justify-between px-3 text-sm font-normal",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => {
                    setSelectedSport(sport.id)
                    setSelectedLeague("All Leagues")
                    setActiveTab("home")
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <Activity className="size-4 text-muted-foreground" />
                    {sport.label}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {sport.count}
                  </span>
                </Button>
              )
            })
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Competitions
        </h2>
        <div className="space-y-1">
          {!competitions ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : (
            competitions.map((competition) => {
              const isActive = selectedLeague === competition
              return (
                <Button
                  key={competition}
                  variant="ghost"
                  className={cn(
                    "h-9 w-full justify-between px-3 text-left text-sm font-normal",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => {
                    setSelectedLeague(competition)
                    setActiveTab("home")
                  }}
                >
                  <span className="min-w-0 truncate">{competition}</span>
                  {competition === "All Leagues" && (
                    <Trophy className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </Button>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
