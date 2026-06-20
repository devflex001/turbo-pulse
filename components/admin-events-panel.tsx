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

function statusLabel(match: SportsMatchWithOdds) {
  if (match.isLive) return "Live"
  return match.statusDesc || "Upcoming"
}

function eventName(match: SportsMatchWithOdds) {
  return `${match.homeTeam} vs ${match.awayTeam}`
}

function sourceLabel(source?: string) {
  if (!source) return "Unknown"
  if (source === "kwikbet") return "KwikBet"
  return source
}

const SPORTS = [
  { value: "football", label: "Football" },
  { value: "all", label: "All Sports" },
]

const STATUSES = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
]

export function AdminEventsPanel() {
  const [search, setSearch] = React.useState("")
  const [sport, setSport] = React.useState("football")
  const [competition, setCompetition] = React.useState("All Leagues")
  const [status, setStatus] = React.useState<"all" | "live" | "upcoming">("all")
  const [selectedMatch, setSelectedMatch] = React.useState<SportsMatchWithOdds | null>(null)

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
                {SPORTS.find((s) => s.value === sport)?.label || "Sport"}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {SPORTS.map((s) => (
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-border text-[10px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Start</th>
                  <th className="px-4 py-2">Event</th>
                  <th className="px-4 py-2">Home</th>
                  <th className="px-4 py-2">Away</th>
                  <th className="px-4 py-2">Competition</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Markets</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matches.map((match) => (
                  <tr key={match.sourceMatchId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{formatStartTime(match.startTime)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {eventName(match)}
                    </td>
                    <td className="px-4 py-3 font-medium">{match.homeTeam}</td>
                    <td className="px-4 py-3 font-medium">{match.awayTeam}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{match.competitionName}</div>
                      <div className="text-muted-foreground">{match.statusDesc}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={match.isLive ? "destructive" : "secondary"}
                        className="text-[10px] uppercase"
                      >
                        {statusLabel(match)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">{match.totalMarkets}</td>
                    <td className="px-4 py-3 font-medium">
                      {sourceLabel(match.source)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <ListPlus className="size-3.5" />
                        Markets
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
