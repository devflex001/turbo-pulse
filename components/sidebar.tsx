"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useBetStore } from "@/hooks/use-bet-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Home,
  PlayCircle,
  History,
  Trophy,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDashed,
  Circle,
  Swords,
  CircleDot,
  LayoutGrid,
  Users,
} from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { useRouter, usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
  onClose?: () => void
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

// Helper to map sport slugs to specific icons
function getSportIcon(slug: string) {
  switch (slug.toLowerCase()) {
    case "football": return Circle;
    case "basketball": return CircleDashed;
    case "tennis": return CircleDot;
    case "mma":
    case "boxing": return Swords;
    case "all": return LayoutGrid;
    default: return Activity;
  }
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const { activeTab, setActiveTab, setSelectedSport, selectedSport, selectedLeague, setSelectedLeague } =
    useBetStore()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const allMatches = useQuery(api.sportsData.listMatches, { limit: 300 }) as
    | MatchRecord[]
    | undefined
  const competitions = useQuery(api.sportsData.listCompetitions, {
    sport: selectedSport,
  }) as string[] | undefined

  const allMatchItems = React.useMemo(() => {
    if (Array.isArray(allMatches)) {
      return allMatches
    }

    if (allMatches && typeof allMatches === "object" && Array.isArray((allMatches as { page?: unknown }).page)) {
      return (allMatches as { page: MatchRecord[] }).page
    }

    return []
  }, [allMatches])

  const liveCount = React.useMemo(
    () => allMatchItems.filter((match) => match.isLive).length,
    [allMatchItems]
  )

  const sportItems = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const match of allMatchItems) {
      const key = match.sportSlug || "all"
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return [
      { id: "all", label: "All Sports", count: allMatchItems.length },
      ...Array.from(counts.entries())
        .filter(([key]) => key !== "all")
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([id, count]) => ({ id, label: titleCase(id), count })),
    ]
  }, [allMatchItems])

  const mainNavItems = [
    { id: "home", label: "Homepage", icon: Home },
    { id: "live", label: "Live Matches", icon: PlayCircle, count: liveCount },
    { id: "mybets", label: "My Bets", icon: History },
  ]

  const handleTabClick = (id: string) => {
    onClose?.()
    if (id === "mybets") {
      router.push("/my-bets")
      return
    }

    if (pathname !== "/") {
      setActiveTab(id)
      if (id === "home") {
        setSelectedSport("all")
        setSelectedLeague("All Leagues")
      } else if (id === "live") {
        setSelectedLeague("All Leagues")
      }
      router.push("/")
      return
    }

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
        "flex flex-col gap-6 shrink-0 border-r border-border bg-card text-card-foreground overflow-y-auto w-64",
        className
      )}
    >
      <div className="pt-4 px-4">
        <div className="space-y-1 w-full">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === "mybets" ? pathname === "/my-bets" : (pathname === "/" && activeTab === item.id)
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "h-9 w-full text-sm font-normal justify-between px-3",
                  isActive
                    ? "bg-[#4b9f71]/10 font-semibold text-[#4b9f71] hover:bg-[#4b9f71]/15 hover:text-[#4b9f71]"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => handleTabClick(item.id)}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={cn("size-4 shrink-0", isActive ? "text-[#4b9f71]" : "text-muted-foreground")} />
                  <span>{item.label}</span>
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
        <div className="space-y-1 w-full">
          {user && (
            <>
              <Button
                variant="ghost"
                className="h-9 w-full text-sm font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground justify-start gap-2.5 px-3"
                onClick={() => {
                  onClose?.()
                  router.push("/deposit")
                }}
              >
                <ArrowDownToLine className="size-4 shrink-0 text-emerald-500" />
                <span>Deposit</span>
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-full text-sm font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground justify-start gap-2.5 px-3"
                onClick={() => {
                  onClose?.()
                  router.push("/withdraw")
                }}
              >
                <ArrowUpFromLine className="size-4 shrink-0 text-amber-500" />
                <span>Withdraw</span>
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-full text-sm font-normal text-muted-foreground hover:bg-accent/50 hover:text-foreground justify-start gap-2.5 px-3"
                onClick={() => {
                  onClose?.()
                  router.push("/referrals")
                }}
              >
                <Users className="size-4 shrink-0 text-cyan-500" />
                <span>Referrals</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="px-4">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sports
        </h2>
        <div className="space-y-1 w-full">
          {!allMatches ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : (
            sportItems.map((sport) => {
              const isActive = selectedSport === sport.id || (sport.id === "all" && selectedSport === "all")
              const SportIcon = getSportIcon(sport.id)

              return (
                <Button
                  key={sport.id}
                  variant="ghost"
                  className={cn(
                    "h-9 w-full text-sm font-normal justify-between px-3",
                    isActive
                      ? "bg-[#4b9f71]/10 font-semibold text-[#4b9f71] hover:bg-[#4b9f71]/15 hover:text-[#4b9f71]"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => {
                    onClose?.()
                    setSelectedSport(sport.id)
                    setSelectedLeague("All Leagues")
                    setActiveTab("home")
                    if (pathname !== "/") {
                      router.push("/")
                    }
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <SportIcon className={cn("size-4 shrink-0", isActive ? "text-[#4b9f71]" : "text-muted-foreground")} />
                    <span className="truncate">{sport.label}</span>
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

      <div className="pb-6 px-4">
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Competitions
        </h2>
        <div className="space-y-1 w-full">
          {!competitions ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : (
            competitions.map((competition) => {
              const isActive = selectedLeague === competition
              const isAllLeagues = competition === "All Leagues"

              return (
                <Button
                  key={competition}
                  variant="ghost"
                  className={cn(
                    "h-9 w-full text-sm font-normal justify-between px-3 text-left",
                    isActive
                      ? "bg-[#4b9f71]/10 font-semibold text-[#4b9f71] hover:bg-[#4b9f71]/15 hover:text-[#4b9f71]"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => {
                    onClose?.()
                    setSelectedLeague(competition)
                    setActiveTab("home")
                    if (pathname !== "/") {
                      router.push("/")
                    }
                  }}
                >
                  <span className="min-w-0 truncate">{competition}</span>
                  {isAllLeagues && (
                    <Trophy className={cn("size-4 shrink-0", isActive ? "text-[#4b9f71]" : "text-muted-foreground")} />
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
