"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { calculateEventTimer } from "@/lib/event-timer"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Search,
  Trash2,
  ChevronDown,
  MoreVertical,
  Edit2,
  CheckCircle,
  EyeOff,
  Eye,
} from "lucide-react"

interface CustomEventsListProps {
  onSelectEvent?: (eventId: string) => void
  status?: "draft" | "published" | "all"
}

type SortOption = "newest" | "oldest" | "matchup-asc" | "matchup-desc"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "matchup-asc", label: "Matchup (A-Z)" },
  { value: "matchup-desc", label: "Matchup (Z-A)" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
]

function getLiveStatusLabel(lifecycle: string) {
  switch (lifecycle) {
    case "first_half":
      return "LIVE (1st Half)"
    case "halftime":
      return "LIVE (Halftime)"
    case "second_half":
      return "LIVE (2nd Half)"
    default:
      return "LIVE"
  }
}


export function CustomEventsList({
  onSelectEvent,
  status,
}: CustomEventsListProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<SortOption>("newest")
  const [filterStatus, setFilterStatus] = React.useState<
    "draft" | "published" | "all"
  >(status || "all")
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null)

  // Timer for checking live matches & Dialog score update state
  const [now, setNow] = React.useState(() => Date.now())
  const [scoreDialogOpen, setScoreDialogOpen] = React.useState(false)
  const [dialogHomeScore, setDialogHomeScore] = React.useState<string>("")
  const [dialogAwayScore, setDialogAwayScore] = React.useState<string>("")
  const [savingScore, setSavingScore] = React.useState(false)

  // Resolve modal state
  const [resolveModalOpen, setResolveModalOpen] = React.useState(false)
  const [eventToResolve, setEventToResolve] = React.useState<any>(null)
  const [selectedMarketId, setSelectedMarketId] = React.useState<string | null>(null)
  const [selectedOutcomeId, setSelectedOutcomeId] = React.useState<string | null>(null)
  const [isResolving, setIsResolving] = React.useState(false)
  const [marketSearch, setMarketSearch] = React.useState("")

  // Update timer every second
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Pre-fill score inputs when selectedEvent changes
  React.useEffect(() => {
    if (selectedEvent) {
      setDialogHomeScore(String(selectedEvent.homeScore ?? 0))
      setDialogAwayScore(String(selectedEvent.awayScore ?? 0))
    }
  }, [selectedEvent])

  const pagination = usePagination({ pageSize: 15 })

  // Reset to page 1 when filters change
  React.useEffect(() => {
    pagination.reset()
  }, [search, filterStatus, pagination])

  const events = useQuery(api.customEvents.listCustomEvents, {
    status: filterStatus === "all" ? undefined : filterStatus,
    search: search || undefined,
    limit: pagination.pageSize,
    offset: pagination.offset,
  })

  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)
  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const unpublishEvent = useMutation(api.customEvents.unpublishCustomEvent)
  const updateScore = useMutation(api.customEvents.updateCustomEventScore)
  const settleEvent = useMutation(api.customEvents.settleCustomEvent)

  const handleResolveEvent = async () => {
    if (!selectedMarketId || !selectedOutcomeId || !eventToResolve) {
      toast.error("Please select a market and winning outcome")
      return
    }

    setIsResolving(true)
    try {
      await settleEvent({
        eventId: eventToResolve._id,
        winningOutcomeId: selectedOutcomeId,
        marketId: selectedMarketId as any,
      })
      toast.success("Event resolved! Bets settled and users notified.")
      setResolveModalOpen(false)
      setEventToResolve(null)
      setSelectedMarketId(null)
      setSelectedOutcomeId(null)
      setMarketSearch("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resolve event")
    } finally {
      setIsResolving(false)
    }
  }

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure? This cannot be undone.")) return

    try {
      await deleteEvent({ eventId: eventId as any })
      toast.success("Event deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  const handlePublish = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await publishEvent({ eventId: eventId as any })
      toast.success("Event published")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish")
    }
  }

  const handleUnpublish = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await unpublishEvent({ eventId: eventId as any })
      toast.success("Event unpublished")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unpublish"
      )
    }
  }

  const handleScoreSave = async () => {
    if (!selectedEvent) return
    const h = Number(dialogHomeScore)
    const a = Number(dialogAwayScore)
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      toast.error("Invalid scores")
      return
    }
    setSavingScore(true)
    try {
      await updateScore({ eventId: selectedEvent._id, homeScore: h, awayScore: a })
      toast.success("Score updated successfully")
      setScoreDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update score")
    } finally {
      setSavingScore(false)
    }
  }

  const handleEdit = (event: any, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/admin/custom-events/${event._id}`)
  }

  const sortedEvents = React.useMemo(() => {
    if (!events) return []

    const list = events.items || []
    const sorted = [...list]
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => b.startTime - a.startTime)
        break
      case "oldest":
        sorted.sort((a, b) => a.startTime - b.startTime)
        break
      case "matchup-asc":
        sorted.sort((a, b) => {
          const aMatch = `${a.homeTeam} vs ${a.awayTeam}`
          const bMatch = `${b.homeTeam} vs ${b.awayTeam}`
          return aMatch.localeCompare(bMatch)
        })
        break
      case "matchup-desc":
        sorted.sort((a, b) => {
          const aMatch = `${a.homeTeam} vs ${a.awayTeam}`
          const bMatch = `${b.homeTeam} vs ${b.awayTeam}`
          return bMatch.localeCompare(aMatch)
        })
        break
    }
    return sorted
  }, [events, sort])

  if (!events) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  const formatTime = (ms: number) => {
    return new Date(ms).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-8 bg-muted/50 pl-8 text-xs focus-visible:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border text-xs"
            >
              {STATUS_OPTIONS.find((s) => s.value === filterStatus)?.label ||
                "Status"}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s.value}
                onClick={() =>
                  setFilterStatus(s.value as "draft" | "published" | "all")
                }
                className={filterStatus === s.value ? "bg-accent" : ""}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-border text-xs"
            >
              {SORT_OPTIONS.find((s) => s.value === sort)?.label || "Sort"}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {SORT_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s.value}
                onClick={() => setSort(s.value as SortOption)}
                className={sort === s.value ? "bg-accent" : ""}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Responsive View: Table on Desktop/Tablet, Cards on Mobile */}
      {sortedEvents.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop/Tablet Table view */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="h-10 font-semibold text-xs text-foreground">
                    Matchup
                  </TableHead>
                  <TableHead className="h-10 font-semibold text-xs text-foreground">
                    Competition
                  </TableHead>
                  <TableHead className="h-10 font-semibold text-xs text-foreground">
                    Start Time
                  </TableHead>
                  <TableHead className="h-10 font-semibold text-xs text-foreground">
                    Markets
                  </TableHead>
                  <TableHead className="h-10 font-semibold text-xs text-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-10 text-right font-semibold text-xs text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEvents.map((event) => {
                  const timer = calculateEventTimer(event.startTime, now)
                  const isLive = event.status === "published" && timer.isLive
                  const isFinished = event.status === "published" && timer.isFinished

                  return (
                    <TableRow
                      key={event._id}
                      className="border-border hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-2 text-xs font-semibold text-foreground">
                        {event.homeTeam} vs {event.awayTeam}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {event.competition}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground font-mono">
                        {formatTime(event.startTime)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        <button
                          onClick={() => {
                            setSelectedEvent(event)
                            setDetailOpen(true)
                          }}
                          className="text-primary hover:text-primary/80 font-semibold transition-colors cursor-pointer"
                        >
                          {event.totalMarkets}
                        </button>
                      </TableCell>
                      <TableCell className="py-2">
                        {(() => {
                          if (event.status === "draft") {
                            return (
                              <Badge className="bg-yellow-500/15 text-yellow-600 border border-yellow-500/20 text-[9px] font-bold">
                                draft
                              </Badge>
                            )
                          }
                          if (isLive) {
                            return (
                              <Badge
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(event)
                                  setScoreDialogOpen(true)
                                }}
                                className="bg-primary text-white text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm select-none border-none"
                                title="Click to update score"
                              >
                                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                                {getLiveStatusLabel(timer.lifecycle)}
                              </Badge>
                            )
                          }
                          if (isFinished) {
                            return (
                              <Badge className="bg-gray-500/15 text-gray-600 border border-gray-500/20 text-[9px] font-bold">
                                finished
                              </Badge>
                            )
                          }
                          return (
                            <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold">
                              published
                            </Badge>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-muted"
                            >
                              <MoreVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEvent(event)
                                setDetailOpen(true)
                              }}
                              className="cursor-pointer gap-2 text-sm"
                            >
                              <Eye className="size-4" />
                              View Markets
                            </DropdownMenuItem>
                            {isLive && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEvent(event)
                                  setScoreDialogOpen(true)
                                }}
                                className="cursor-pointer gap-2 text-sm text-primary"
                              >
                                <Edit2 className="size-4" />
                                Update Score
                              </DropdownMenuItem>
                            )}
                            {isFinished && !event.winningOutcomeId && event.status === "published" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEventToResolve(event)
                                  setResolveModalOpen(true)
                                }}
                                className="cursor-pointer gap-2 text-sm text-blue-600"
                              >
                                <CheckCircle className="size-4" />
                                Resolve
                              </DropdownMenuItem>
                            )}
                            {event.status === "draft" && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => handleEdit(event, e as any)}
                                  className="cursor-pointer gap-2 text-sm"
                                >
                                  <Edit2 className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handlePublish(event._id, e as any)
                                  }
                                  className="cursor-pointer gap-2 text-sm"
                                >
                                  <CheckCircle className="size-4" />
                                  Publish
                                </DropdownMenuItem>
                              </>
                            )}
                            {event.status === "published" && (
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleUnpublish(event._id, e as any)
                                }
                                className="cursor-pointer gap-2 text-sm"
                              >
                                <EyeOff className="size-4" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => handleDelete(event._id, e as any)}
                              className="cursor-pointer gap-2 text-sm text-destructive"
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card view */}
          <div className="block md:hidden space-y-3">
            {sortedEvents.map((event) => {
              const timer = calculateEventTimer(event.startTime, now)
              const isLive = event.status === "published" && timer.isLive
              const isFinished = event.status === "published" && timer.isFinished

              const renderStatusBadge = () => {
                if (event.status === "draft") {
                  return (
                    <Badge className="bg-yellow-500/15 text-yellow-600 border border-yellow-500/20 text-[9px] font-bold">
                      draft
                    </Badge>
                  )
                }
                if (isLive) {
                  return (
                    <Badge
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedEvent(event)
                        setScoreDialogOpen(true)
                      }}
                      className="bg-primary text-white text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm select-none border-none"
                      title="Click to update score"
                    >
                      <span className="size-1.5 rounded-full bg-white animate-pulse" />
                      {getLiveStatusLabel(timer.lifecycle)}
                    </Badge>
                  )
                }
                if (isFinished) {
                  return (
                    <Badge className="bg-gray-500/15 text-gray-600 border border-gray-500/20 text-[9px] font-bold">
                      finished
                    </Badge>
                  )
                }
                return (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold">
                    published
                  </Badge>
                )
              }

              return (
                <div
                  key={event._id}
                  className="rounded-lg border border-border bg-card p-3 space-y-2.5 hover:border-primary/30 transition-colors shadow-xs"
                >
                  {/* Header: Matchup & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      {event.homeTeam} vs {event.awayTeam}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-muted shrink-0"
                        >
                          <MoreVertical className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEvent(event)
                            setDetailOpen(true)
                          }}
                          className="cursor-pointer gap-2 text-sm"
                        >
                          <Eye className="size-4" />
                          View Markets
                        </DropdownMenuItem>
                        {isLive && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(event)
                              setScoreDialogOpen(true)
                            }}
                            className="cursor-pointer gap-2 text-sm text-primary"
                          >
                            <Edit2 className="size-4" />
                            Update Score
                          </DropdownMenuItem>
                        )}
                        {isFinished && !event.winningOutcomeId && event.status === "published" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEventToResolve(event)
                              setResolveModalOpen(true)
                            }}
                            className="cursor-pointer gap-2 text-sm text-blue-600"
                          >
                            <CheckCircle className="size-4" />
                            Resolve
                          </DropdownMenuItem>
                        )}
                        {event.status === "draft" && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => handleEdit(event, e as any)}
                              className="cursor-pointer gap-2 text-sm"
                            >
                              <Edit2 className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) =>
                                handlePublish(event._id, e as any)
                              }
                              className="cursor-pointer gap-2 text-sm"
                            >
                              <CheckCircle className="size-4" />
                              Publish
                            </DropdownMenuItem>
                          </>
                        )}
                        {event.status === "published" && (
                          <DropdownMenuItem
                            onClick={(e) =>
                              handleUnpublish(event._id, e as any)
                            }
                            className="cursor-pointer gap-2 text-sm"
                          >
                            <EyeOff className="size-4" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(event._id, e as any)}
                          className="cursor-pointer gap-2 text-sm text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Info Row: Competition & Status */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{event.competition}</span>
                    {renderStatusBadge()}
                  </div>

                  {/* Footer row: Start Time & Markets */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
                    <span>{formatTime(event.startTime)}</span>
                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setDetailOpen(true)
                      }}
                      className="text-primary hover:text-primary/80 font-bold transition-colors cursor-pointer font-sans text-xs"
                    >
                      {event.totalMarkets} Markets
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {events && events.items && events.items.length > 0 && (
            <div className="border border-border/40 rounded-lg bg-card px-4 py-3 shadow-xs">
              <Pagination
                currentPage={pagination.currentPage}
                pageSize={pagination.pageSize}
                totalItems={events.totalCount || 0}
                onPageChange={pagination.onPageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card p-8 text-center text-xs text-muted-foreground">
          <p className="text-sm font-semibold">No events found</p>
          <p className="mt-1 text-xs">
            Create your first custom event to get started
          </p>
        </div>
      )}

      {/* Event Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="flex h-dvh !w-[min(50vw,720px)] !max-w-none flex-col overflow-hidden bg-card p-0"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="truncate text-sm font-semibold">
              {selectedEvent
                ? `${selectedEvent.homeTeam} vs ${selectedEvent.awayTeam}`
                : "Event Details"}
            </SheetTitle>
            <p className="truncate text-xs text-muted-foreground">
              {selectedEvent?.competition}
            </p>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-hidden">
            {selectedEvent && (
              <CustomEventDetail
                eventId={selectedEvent._id}
                adminControls
                onBack={() => setDetailOpen(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Score Update Dialog */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Update Live Score</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedEvent ? `${selectedEvent.homeTeam} vs ${selectedEvent.awayTeam}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {selectedEvent?.homeTeam || "Home Score"}
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={dialogHomeScore}
                onChange={(e) => setDialogHomeScore(e.target.value)}
                className="h-9 text-xs focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                {selectedEvent?.awayTeam || "Away Score"}
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={dialogAwayScore}
                onChange={(e) => setDialogAwayScore(e.target.value)}
                className="h-9 text-xs focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-border"
              onClick={() => setScoreDialogOpen(false)}
              disabled={savingScore}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 font-semibold"
              onClick={handleScoreSave}
              disabled={savingScore}
            >
              {savingScore ? "Saving..." : "Save Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Modal - Side panel on desktop, dialog on mobile */}
      <ResolveModal
        open={resolveModalOpen}
        onOpenChange={setResolveModalOpen}
        event={eventToResolve}
        isResolving={isResolving}
        selectedMarketId={selectedMarketId}
        selectedOutcomeId={selectedOutcomeId}
        marketSearch={marketSearch}
        onMarketSearchChange={setMarketSearch}
        onMarketSelect={setSelectedMarketId}
        onOutcomeSelect={setSelectedOutcomeId}
        onResolve={handleResolveEvent}
      />
    </div>
  )
}

// Resolve Modal Component
interface ResolveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any | null
  isResolving: boolean
  selectedMarketId: string | null
  selectedOutcomeId: string | null
  marketSearch: string
  onMarketSearchChange: (search: string) => void
  onMarketSelect: (marketId: string) => void
  onOutcomeSelect: (outcomeId: string) => void
  onResolve: () => Promise<void>
}

function ResolveModal({
  open,
  onOpenChange,
  event,
  isResolving,
  selectedMarketId,
  selectedOutcomeId,
  marketSearch,
  onMarketSearchChange,
  onMarketSelect,
  onOutcomeSelect,
  onResolve,
}: ResolveModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [activeCategory, setActiveCategory] = React.useState("All")

  // Fetch markets and odds for the event
  const markets = useQuery(
    api.customEvents.listCustomMarkets,
    event ? { eventId: event._id } : "skip"
  )

  const allOdds = useQuery(
    api.customEvents.listCustomOddsByEvent,
    event ? { eventId: event._id } : "skip"
  )

  // Group odds by market
  const oddsByMarket = React.useMemo(() => {
    const groups = new Map<string, any[]>()
    if (allOdds) {
      for (const odd of allOdds) {
        const key = odd.marketId
        const list = groups.get(key) ?? []
        list.push(odd)
        groups.set(key, list)
      }
      for (const list of groups.values()) {
        list.sort((a, b) => a.priority - b.priority || a.outcomeName.localeCompare(b.outcomeName))
      }
    }
    return groups
  }, [allOdds])

  // Filter markets based on search
  const filteredMarkets = React.useMemo(() => {
    if (!markets) return []
    const query = marketSearch.trim().toLowerCase()
    return markets
      .filter((market: any) => {
        if (!query) return true
        return `${market.name} ${market.marketType}`.toLowerCase().includes(query)
      })
      .sort((a: any, b: any) => a.priority - b.priority || a.name.localeCompare(b.name))
  }, [markets, marketSearch])

  // Get selected market and outcomes
  const selectedMarket = markets?.find((m: any) => m._id === selectedMarketId)
  const selectedOutcomes = selectedMarketId ? oddsByMarket.get(selectedMarketId) || [] : []

  const content = (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {/* Search & Title */}
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        <h3 className="font-semibold text-sm">Select Market & Outcome</h3>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={marketSearch}
            onChange={(e) => onMarketSearchChange(e.target.value)}
            placeholder="Search markets..."
            className="h-9 bg-muted/50 pl-8 text-xs focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Markets & Outcomes Grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Markets List */}
        <ScrollArea className="min-h-0 border-b border-border lg:h-full lg:border-b-0 lg:border-r">
          {!markets && (
            <div className="space-y-2 p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {markets && filteredMarkets.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No markets found
            </div>
          )}

          {filteredMarkets.map((market: any) => (
            <button
              key={market._id}
              onClick={() => onMarketSelect(market._id)}
              className={cn(
                "w-full text-left border-b border-border/50 px-3 py-2.5 hover:bg-muted/50 transition-colors",
                selectedMarketId === market._id && "bg-primary/10 border-primary"
              )}
            >
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground line-clamp-2">
                  {market.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {market.marketTypes?.join(", ") || market.marketType}
                </p>
              </div>
            </button>
          ))}
        </ScrollArea>

        {/* Outcomes Grid */}
        <ScrollArea className="min-h-0 lg:h-full">
          {!allOdds && (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {selectedMarket && selectedOutcomes.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No outcomes available
            </div>
          )}

          {selectedMarket && selectedOutcomes.length > 0 && (
            <div className="space-y-3 p-4">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground">
                  {selectedMarket.name}
                </h4>
                <p className="text-[10px] text-muted-foreground">
                  {selectedMarket.marketTypes?.join(", ") || selectedMarket.marketType}
                </p>
              </div>

              <div className={cn(
                "grid gap-2",
                selectedOutcomes.length === 2 || selectedOutcomes.length === 4 ? "grid-cols-2" : "grid-cols-3"
              )}>
                {selectedOutcomes.map((outcome: any) => (
                  <button
                    key={outcome._id}
                    onClick={() => onOutcomeSelect(outcome.outcomeId)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 h-12 py-1 px-2 rounded-md border transition-all text-center min-w-0",
                      selectedOutcomeId === outcome.outcomeId
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-muted-foreground/30 text-foreground"
                    )}
                  >
                    <span className="truncate text-[9px] font-semibold leading-none">
                      {outcome.outcomeName}
                    </span>
                    <span className="font-mono text-[10px] font-bold leading-none">
                      {outcome.oddValue.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Action Buttons */}
      <div className="shrink-0 border-t border-border bg-muted/30 p-4 flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 border-border"
          onClick={() => onOpenChange(false)}
          disabled={isResolving}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="text-xs h-8 font-semibold"
          onClick={onResolve}
          disabled={isResolving || !selectedMarketId || !selectedOutcomeId}
        >
          {isResolving ? "Resolving..." : "Resolve Event"}
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-card flex flex-col h-[80vh] p-0 gap-0">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <DialogTitle className="text-sm font-semibold">
              {event ? `${event.homeTeam} vs ${event.awayTeam}` : "Resolve Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the winning market and outcome
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-[min(50vw,720px)] !max-w-none flex h-dvh flex-col overflow-hidden bg-card p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <SheetTitle className="truncate text-sm font-semibold">
            {event ? `Resolve: ${event.homeTeam} vs ${event.awayTeam}` : "Resolve Event"}
          </SheetTitle>
          <p className="truncate text-xs text-muted-foreground">
            Select the winning market and outcome
          </p>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
