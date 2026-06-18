"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SmallLoader } from "@/components/small-loader"
import { MarketsPanel, type SportsMatchWithOdds } from "@/components/markets-panel"
import { ListPlus, Search } from "lucide-react"

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

      <div className="border border-border rounded-lg bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team, competition, or source ID"
              className="h-9 pl-8 text-xs focus-visible:ring-primary"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {[
              ["football", "Football"],
              ["all", "All"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={sport === value ? "default" : "outline"}
                className="h-9 text-xs shrink-0"
                onClick={() => {
                  setSport(value)
                  setCompetition("All Leagues")
                }}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {[
              ["all", "All"],
              ["upcoming", "Upcoming"],
              ["live", "Live"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={status === value ? "default" : "outline"}
                className="h-9 text-xs shrink-0"
                onClick={() => setStatus(value as "all" | "live" | "upcoming")}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {(competitions ?? ["All Leagues"]).slice(0, 12).map((name) => (
              <Button
                key={name}
                size="sm"
                variant={competition === name ? "secondary" : "ghost"}
                className="h-9 text-xs shrink-0"
                onClick={() => setCompetition(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      </div>

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
