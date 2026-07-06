"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarketsPanel, type SportsMatchWithOdds, type SportsMatch } from "@/components/markets-panel"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { ListPlus, Search, ChevronDown, Trash2, Star } from "lucide-react"
import { toast } from "sonner"

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

function eventName(match: SportsMatch) {
  return `${match.homeTeam} vs ${match.awayTeam}`
}

function statusLabel(match: SportsMatch) {
  if (match.status === 2 || match.startTime < Date.now()) return "Ended"
  if (match.isLive || match.status === 1) return "Live"
  return "Upcoming"
}

function statusBadgeClass(label: string) {
  if (label === "Live") {
    return "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 rounded-sm text-[9px] font-semibold border border-rose-500/20"
  }
  if (label === "Ended") {
    return "bg-muted text-muted-foreground hover:bg-muted rounded-sm text-[9px] font-semibold border border-border"
  }
  return "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15 rounded-sm text-[9px] font-semibold border border-yellow-500/20"
}

const STATUSES = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
]

type MatchWithId = SportsMatch & { _id: any; featured?: boolean }

export function AdminEventsPanel() {
  const [activeTab, setActiveTab] = React.useState("synced")
  const [search, setSearch] = React.useState("")
  const [sport, setSport] = React.useState("all")
  const [competition, setCompetition] = React.useState("All Leagues")
  const [status, setStatus] = React.useState<"all" | "live" | "upcoming">("all")
  const [selectedMatch, setSelectedMatch] = React.useState<SportsMatch | null>(null)
  const [matchToDelete, setMatchToDelete] = React.useState<MatchWithId | null>(null)
  const [screenWidth, setScreenWidth] = React.useState(1024)
  const [showClearDialog, setShowClearDialog] = React.useState(false)
  const [isClearing, setIsClearing] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [clearProgress, setClearProgress] = React.useState({ deleted: 0, total: 0 })

  const sessionToken =
    typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") : null
  const clearJunkEventsM = useMutation(api.sportsData.clearJunkEvents)
  const toggleFeatured = useMutation(api.sportsData.toggleFeaturedMatch)
  const deleteSportsMatch = useMutation(api.sportsData.deleteSportsMatch)

  const pagination = usePagination({ pageSize: 10 })

  React.useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Reset to page 1 when filters change
  React.useEffect(() => {
    pagination.reset()
  }, [search, sport, competition, status, pagination])

  // Responsive event name length
  const eventMaxLength = screenWidth < 640 ? 20 : screenWidth < 1024 ? 30 : 50

  const competitions = useQuery(api.sportsData.listCompetitions, { sport }) as
    | string[]
    | undefined
  const matchesData = useQuery(api.sportsData.listMatches, {
    sport,
    competition,
    status: status === "all" ? undefined : status,
    search,
    limit: pagination.pageSize,
    offset: pagination.offset,
    includeFirstMarket: false,
  }) as { items: SportsMatch[]; totalCount: number } | undefined
  const featuredMatches = useQuery(
    api.sportsData.listFeaturedMatches,
    activeTab === "featured"
      ? { limit: 100, offset: 0, includeFirstMarket: false }
      : "skip"
  ) as SportsMatch[] | undefined

  // Get all available sports from all matches (for sport list only)
  const allMatches = useQuery(api.sportsData.listMatches, {
    limit: 300,
    includeFirstMarket: false,
  }) as { items: SportsMatch[]; totalCount: number } | undefined

  // Build dynamic sports list from available data
  const availableSports = React.useMemo(() => {
    if (!allMatches?.items) return [{ value: "all", label: "All Sports" }]

    const sports = new Set<string>()
    allMatches.items.forEach((match) => {
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

  const handleClearEvents = async () => {
    try {
      setIsClearing(true)
      setClearProgress({ deleted: 0, total: 0 })

      let totalDeleted = 0
      let hasMore = true

      // Keep calling until no more events to delete
      while (hasMore) {
        const result = await clearJunkEventsM({
          sessionToken: sessionToken || undefined,
        })

        totalDeleted += result.matchesDeleted
        setClearProgress({ deleted: totalDeleted, total: totalDeleted + (result.hasMore ? 10 : 0) })
        hasMore = result.hasMore

        // Small delay between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      setShowClearDialog(false)
      toast.success(`Cleared ${totalDeleted} old events from database!`)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error("Failed to clear events:", error)
      toast.error("Failed to clear events")
    } finally {
      setIsClearing(false)
      setClearProgress({ deleted: 0, total: 0 })
    }
  }

  const handleToggleFeatured = async (match: MatchWithId) => {
    if (!match._id) {
      toast.error("Cannot feature this match — missing ID")
      return
    }
    try {
      const result = await toggleFeatured({
        matchId: match._id,
        sessionToken: sessionToken || undefined,
      })
      toast.success(result.featured ? "Match marked as featured" : "Match removed from featured")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update featured status")
    }
  }

  const handleDeleteFeaturedMatch = async () => {
    if (!matchToDelete?._id) return
    if (!sessionToken) {
      toast.error("Admin session required")
      return
    }

    try {
      setIsDeleting(true)
      let hasMore = true
      let marketsDeleted = 0
      let oddsDeleted = 0

      while (hasMore) {
        const result = await deleteSportsMatch({
          matchId: matchToDelete._id,
          sessionToken,
        })
        marketsDeleted += result.marketsDeleted
        oddsDeleted += result.oddsDeleted
        hasMore = result.hasMore
      }

      toast.success(`Deleted event with ${marketsDeleted} markets and ${oddsDeleted} odds`)
      setMatchToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete event")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">Events</h1>
        <p className="text-xs text-muted-foreground">
          Scraped fixtures with source metadata and full market details.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="synced">Synced Events</TabsTrigger>
          <TabsTrigger value="featured">Featured Events</TabsTrigger>
        </TabsList>

        <TabsContent value="synced" className="space-y-5">
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

          {/* Clear All Events Button */}
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="size-3.5" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Synced Events Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Synced Events</h2>
          <Badge variant="outline" className="text-[10px] font-mono">
            {matchesData?.items?.length ?? 0}
          </Badge>
        </div>

        {!matchesData ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : matchesData.items && matchesData.items.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground text-[9px] font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-center w-8">#</th>
                    <th className="px-3 py-2 text-left">Start</th>
                    <th className="px-3 py-2 text-left">Sport</th>
                    <th className="px-3 py-2 text-left">Event</th>
                    <th className="px-3 py-2 text-left">Competition</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Markets</th>
                    <th className="px-3 py-2 text-center">Featured</th>
                    <th className="px-3 py-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matchesData.items.map((match, index) => (
                    <tr key={match.sourceMatchId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-center text-muted-foreground text-[10px]">
                        {pagination.offset + index + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">
                        {formatStartTime(match.startTime)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-[10px]">
                        {match.sportSlug ? formatSportName(match.sportSlug) : "—"}
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
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleToggleFeatured(match as any)}
                          title={match.featured ? "Remove from featured" : "Mark as featured"}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <Star
                            className={match.featured
                              ? "size-4 fill-amber-400 text-amber-400"
                              : "size-4 text-muted-foreground hover:text-amber-400"
                            }
                          />
                        </button>
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
              {matchesData.items.map((match) => (
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
                      <span>{formatSportName(match.sportSlug || "")}</span>
                      <span>•</span>
                      <span className="font-mono">{match.totalMarkets} markets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFeatured(match as any)}
                        title={match.featured ? "Remove from featured" : "Mark as featured"}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Star
                          className={match.featured
                            ? "size-4 fill-amber-400 text-amber-400"
                            : "size-4 text-muted-foreground hover:text-amber-400"
                          }
                        />
                      </button>
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

      {/* Pagination */}
      {matchesData && matchesData.items && matchesData.items.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={matchesData.totalCount || 0}
          onPageChange={pagination.onPageChange}
        />
      )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-5">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Featured Events</h2>
                <p className="text-[10px] text-muted-foreground">
                  Manage featured sports events, including ended matches.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {featuredMatches?.length ?? 0}
              </Badge>
            </div>

            {!featuredMatches ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            ) : featuredMatches.length > 0 ? (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-muted-foreground text-[9px] font-semibold">
                      <tr>
                        <th className="px-3 py-2 text-left">Start</th>
                        <th className="px-3 py-2 text-left">Event</th>
                        <th className="px-3 py-2 text-left">Competition</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Markets</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {featuredMatches.map((match) => {
                        const label = statusLabel(match)

                        return (
                          <tr key={match.sourceMatchId} className="hover:bg-muted/30 transition-colors">
                            <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">
                              {formatStartTime(match.startTime)}
                            </td>
                            <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap overflow-hidden text-ellipsis" title={eventName(match)}>
                              {truncateEventName(eventName(match), eventMaxLength)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-[10px]">
                              {match.competitionName}
                            </td>
                            <td className="px-3 py-2">
                              <Badge className={statusBadgeClass(label)}>
                                {label}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground text-[10px]">
                              {match.totalMarkets}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 px-2"
                                  onClick={() => setSelectedMatch(match)}
                                >
                                  <ListPlus className="size-3" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 px-2"
                                  onClick={() => handleToggleFeatured(match as MatchWithId)}
                                >
                                  <Star className="size-3 fill-amber-400 text-amber-400" />
                                  Remove
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs gap-1 px-2"
                                  onClick={() => setMatchToDelete(match as MatchWithId)}
                                >
                                  <Trash2 className="size-3" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-2 p-3">
                  {featuredMatches.map((match) => {
                    const label = statusLabel(match)

                    return (
                      <div key={match.sourceMatchId} className="border border-border rounded-lg p-3 bg-card space-y-3">
                        <div className="flex items-start justify-between gap-2">
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
                          <Badge className={statusBadgeClass(label)}>
                            {label}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {match.totalMarkets} markets
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 px-2"
                              onClick={() => setSelectedMatch(match)}
                            >
                              <ListPlus className="size-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={() => handleToggleFeatured(match as MatchWithId)}
                            >
                              Remove
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs px-2"
                              onClick={() => setMatchToDelete(match as MatchWithId)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No sports events are currently featured.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedMatch && (
        <MarketsPanel
          open={selectedMatch !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedMatch(null)
          }}
          match={{ ...selectedMatch, mainOdds: [] }} // Convert to expected type
          readOnly
        />
      )}

      <AlertDialog
        open={matchToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setMatchToDelete(null)
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Featured Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event, its markets, and its odds from the scraper data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {matchToDelete && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <p className="font-semibold text-foreground">{eventName(matchToDelete)}</p>
              <p className="mt-1 text-muted-foreground">{matchToDelete.competitionName}</p>
              <p className="mt-1 font-mono text-muted-foreground">
                {matchToDelete.totalMarkets} markets
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteFeaturedMatch()
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Old Events Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={(open) => {
        // Prevent closing while clearing
        if (!isClearing) {
          setShowClearDialog(open)
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Old Events?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete finished events that are no longer displayed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            {/* Progress Bar */}
            {isClearing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Clearing events...</span>
                  <span className="font-mono">{clearProgress.deleted} deleted</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300 animate-pulse"
                    style={{
                      width: clearProgress.total > 0
                        ? `${(clearProgress.deleted / clearProgress.total) * 100}%`
                        : "50%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Protection Notice */}
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20 space-y-1">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <span>ℹ️</span> Protected
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <div>• Live events will NOT be deleted</div>
                <div>• Recent events (24h) will NOT be deleted</div>
                <div>• Only old finished events are cleared</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearEvents}
              disabled={isClearing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isClearing ? "Clearing..." : "Clear Old Events"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
