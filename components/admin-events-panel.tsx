"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SmallLoader } from "@/components/small-loader"
import { MarketsPanel, type SportsMatchWithOdds } from "@/components/markets-panel"
import { ListPlus, Search, ChevronDown } from "lucide-react"

function formatStartTime(startTime: number) {
  if (!startTime) return "TBA"
  return new Date(startTime).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatSportName(sportSlug: string) {
  return sportSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function truncateEventName(name: string, maxLength: number) {
  if (name.length <= maxLength) return name
  return name.slice(0, maxLength) + "…"
}

function eventName(match: SportsMatchWithOdds) {
  return `${match.homeTeam} vs ${match.awayTeam}`
}

const STATUSES = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
]

export function AdminEventsPanel() {
  const [search, setSearch] = React.useState("")
  const [sport, setSport] = React.useState("all")
  const [competition, setCompetition] = React.useState("All Leagues")
  const [status, setStatus] = React.useState<"all" | "live" | "upcoming">("all")
  const [selectedMatch, setSelectedMatch] = React.useState<SportsMatchWithOdds | null>(null)
  const [screenWidth, setScreenWidth] = React.useState(1024)

  React.useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Responsive event name length
  const eventMaxLength = screenWidth < 640 ? 20 : screenWidth < 1024 ? 30 : 50

  const competitions = useQuery(api.sportsData.listCompetitions, { sport }) as
    | string[]
    | undefined
  const matches = useQuery(api.sportsData.listMatches, {
    sport,
    competition,
    status: status === "all" ? undefined : status,
    search,
    limit: 100,
  }) as SportsMatchWithOdds[] | undefined

  // Get all available sports from all matches
  const allMatches = useQuery(api.sportsData.listMatches, {
    limit: 300,
  }) as SportsMatchWithOdds[] | undefined

  // Build dynamic sports list from available data
  const availableSports = React.useMemo(() => {
    if (!allMatches) return [{ value: "all", label: "All Sports" }]

    const sports = new Set<string>()
    allMatches.forEach((match) => {
      if (match.sportSlug) sports.add(match.sportSlug)
    })

    const sportsList = Array.from(sports)
      .map((slug) => ({
        value: slug,
        label: formatSportName(slug),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return [
      { value: "all", label: "All Sports" },
      ...sportsList,
    ]
  }, [allMatches])

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">Events</h1>
        <p className="text-xs text-muted-foreground">
          Scraped fixtures with source metadata and full market details.
        </p>
      </div>

      {/* Filters */}
      <div className="border border-border rounded-lg bg-card p-3 space-y-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="h-8 pl-8 text-xs focus-visible:ring-primary bg-muted/50"
            />
          </div>

          {/* Sport Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border"
              >
                {availableSports.find((s) => s.value === sport)?.label || "Sport"}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {availableSports.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => {
                    setSport(s.value)
                    setCompetition("All Leagues")
                  }}
                  className={sport === s.value ? "bg-accent" : ""}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border"
              >
                {STATUSES.find((s) => s.value === status)?.label || "Status"}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => setStatus(s.value as "all" | "live" | "upcoming")}
                  className={status === s.value ? "bg-accent" : ""}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Competition Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border truncate max-w-[150px]"
              >
                {competition}
                <ChevronDown className="size-3 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
              {(competitions ?? ["All Leagues"]).map((name) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() => setCompetition(name)}
                  className={competition === name ? "bg-accent" : ""}
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Synced Events Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Synced Events</h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {matches?.length ?? 0}
          </Badge>
        </div>

        {!matches ? (
          <div className="p-4">
            <SmallLoader />
          </div>
        ) : matches.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground text-[9px] font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Start</th>
                    <th className="px-3 py-2 text-left">Sport</th>
                    <th className="px-3 py-2 text-left">Event</th>
                    <th className="px-3 py-2 text-left">Competition</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Markets</th>
                    <th className="px-3 py-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matches.map((match) => (
                    <tr key={match.sourceMatchId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">
                        {formatStartTime(match.startTime)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">
                        {formatSportName(match.sportSlug)}
                      </td>
                      <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis" title={eventName(match)}>
                        {truncateEventName(eventName(match), eventMaxLength)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">
                        {match.competitionName}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className={
                            match.isLive
                              ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 rounded-sm text-[9px] font-semibold border border-rose-500/20"
                              : "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15 rounded-sm text-[9px] font-semibold border border-yellow-500/20"
                          }
                        >
                          {match.isLive ? "Live" : "Upcoming"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground text-[10px]">
                        {match.totalMarkets}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 px-2"
                          onClick={() => setSelectedMatch(match)}
                        >
                          <ListPlus className="size-3" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2 p-3">
              {matches.map((match) => (
                <div key={match.sourceMatchId} className="border border-border rounded-lg p-3 bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
                        {eventName(match)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">
                        {match.competitionName}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {formatStartTime(match.startTime)}
                      </div>
                    </div>
                    <Badge
                      className={
                        match.isLive
                          ? "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 rounded-sm text-[9px] font-semibold border border-rose-500/20"
                          : "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15 rounded-sm text-[9px] font-semibold border border-yellow-500/20"
                      }
                    >
                      {match.isLive ? "Live" : "Upcoming"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{formatSportName(match.sportSlug)}</span>
                      <span>•</span>
                      <span className="font-mono">{match.totalMarkets} markets</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => setSelectedMatch(match)}
                    >
                      <ListPlus className="size-3" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No events are stored yet. Run the scraper from the Scraper tab.
          </div>
        )}
      </div>

      {selectedMatch && (
        <MarketsPanel
          open={selectedMatch !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedMatch(null)
          }}
          match={selectedMatch}
          readOnly
        />
      )}
    </div>
  )
}
