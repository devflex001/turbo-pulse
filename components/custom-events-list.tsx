"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
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
  const { sessionToken } = useAuth()
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
  const [selectedOutcomesByMarket, setSelectedOutcomesByMarket] = React.useState<Map<string, Set<string>>>(new Map()) // marketId -> Set of outcomeIds
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
  const toggleFeatured = useMutation(api.customEvents.toggleFeaturedEvent)

  const handleResolveEvent = async (passphrase?: string) => {
    if (selectedOutcomesByMarket.size === 0 || !eventToResolve) {
      toast.error("Please select at least one outcome in a market")
      throw new Error("Please select at least one outcome in a market")
    }

    setIsResolving(true)
    try {
      // Build market outcomes array for the mutation
      const marketOutcomes = Array.from(selectedOutcomesByMarket.entries()).map(([marketId, outcomeIds]) => ({
        marketId: marketId as any,
        winningOutcomeIds: Array.from(outcomeIds),
      }))

      await settleEvent({
        eventId: eventToResolve._id,
        marketOutcomes,
        passphrase, // Include passphrase if provided
        sessionToken: sessionToken || undefined,
      })

      const totalOutcomes = Array.from(selectedOutcomesByMarket.values()).reduce((sum, set) => sum + set.size, 0)
      toast.success(`Event resolved! ${selectedOutcomesByMarket.size} market(s) with ${totalOutcomes} outcome(s) settled.`)
      setResolveModalOpen(false)
      setEventToResolve(null)
      setSelectedOutcomesByMarket(new Map())
      setMarketSearch("")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to resolve event"

      // If error indicates event is already settled and no passphrase was provided, 
      // rethrow so the modal can handle it
      if (errorMsg.includes("Event already settled") && !passphrase) {
        setIsResolving(false)
        throw error
      }

      // For other errors, show toast and don't rethrow
      toast.error(errorMsg)
      setIsResolving(false)
      throw error
    }
  }

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure? This cannot be undone.")) return

    try {
      await deleteEvent({ eventId: eventId as any, sessionToken: sessionToken || undefined })
      toast.success("Event deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  const handlePublish = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await publishEvent({ eventId: eventId as any, sessionToken: sessionToken || undefined })
      toast.success("Event published")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish")
    }
  }

  const handleUnpublish = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await unpublishEvent({ eventId: eventId as any, sessionToken: sessionToken || undefined })
      toast.success("Event unpublished")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unpublish")
    }
  }

  const handleToggleFeatured = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const result = await toggleFeatured({ eventId: event._id as any, sessionToken: sessionToken || undefined })
      toast.success(result.featured ? "Event marked as featured" : "Event removed from featured")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update featured status")
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
      await updateScore({ eventId: selectedEvent._id, homeScore: h, awayScore: a, sessionToken: sessionToken || undefined })
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
                        <span className="flex items-center gap-1.5">
                          {event.featured && (
                            <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
                          )}
                          {event.homeTeam} vs {event.awayTeam}
                        </span>
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
                          // Check if event has been resolved/settled
                          if (event.settledAt) {
                            return (
                              <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/20 text-[9px] font-bold">
                                resolved
                              </Badge>
                            )
                          }
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
                            {isFinished && event.status === "published" && (
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
                            {event.status === "published" && (
                              <DropdownMenuItem
                                onClick={(e) => handleToggleFeatured(event, e as any)}
                                className={cn(
                                  "cursor-pointer gap-2 text-sm",
                                  event.featured ? "text-amber-500" : ""
                                )}
                              >
                                <Star className={cn("size-4", event.featured && "fill-amber-500 text-amber-500")} />
                                {event.featured ? "Unmark Featured" : "Mark as Featured"}
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
                // Check if event has been resolved/settled
                if (event.settledAt) {
                  return (
                    <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/20 text-[9px] font-bold">
                      resolved
                    </Badge>
                  )
                }
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
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {event.featured && (
                        <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
                      )}
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
                        {isFinished && event.status === "published" && (
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
                        {event.status === "published" && (
                          <DropdownMenuItem
                            onClick={(e) => handleToggleFeatured(event, e as any)}
                            className={cn(
                              "cursor-pointer gap-2 text-sm",
                              event.featured ? "text-amber-500" : ""
                            )}
                          >
                            <Star className={cn("size-4", event.featured && "fill-amber-500 text-amber-500")} />
                            {event.featured ? "Unmark Featured" : "Mark as Featured"}
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
        selectedOutcomesByMarket={selectedOutcomesByMarket}
        marketSearch={marketSearch}
        onMarketSearchChange={setMarketSearch}
        onOutcomeToggle={(marketId, outcomeId) => {
          const newSelected = new Map(selectedOutcomesByMarket)
          const marketOutcomes = newSelected.get(marketId) || new Set()

          if (marketOutcomes.has(outcomeId)) {
            marketOutcomes.delete(outcomeId)
          } else {
            marketOutcomes.add(outcomeId)
          }

          if (marketOutcomes.size === 0) {
            newSelected.delete(marketId)
          } else {
            newSelected.set(marketId, marketOutcomes)
          }

          setSelectedOutcomesByMarket(newSelected)
        }}
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
  selectedOutcomesByMarket: Map<string, Set<string>> // marketId -> Set of outcomeIds
  marketSearch: string
  onMarketSearchChange: (search: string) => void
  onOutcomeToggle: (marketId: string, outcomeId: string) => void
  onResolve: (passphrase?: string) => Promise<void>
}

function ResolveModal({
  open,
  onOpenChange,
  event,
  isResolving,
  selectedOutcomesByMarket,
  marketSearch,
  onMarketSearchChange,
  onOutcomeToggle,
  onResolve,
}: ResolveModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [showPassphraseDialog, setShowPassphraseDialog] = React.useState(false)
  const [passphraseInput, setPassphraseInput] = React.useState("")
  const [passphraseError, setPassphraseError] = React.useState("")
  const [showPassphrase, setShowPassphrase] = React.useState(false)

  const handlePassphraseSubmit = async () => {
    if (!passphraseInput) {
      setPassphraseError("Passphrase is required")
      return
    }

    // Get passphrase from environment variable (must be NEXT_PUBLIC to be accessible in client)
    const correctPassphrase = process.env.NEXT_PUBLIC_SYSTEM_OVERRIDE_PASSPHRASE

    if (passphraseInput !== correctPassphrase) {
      setPassphraseError("Invalid passphrase")
      return
    }

    // Passphrase is correct, proceed with override
    setShowPassphraseDialog(false)
    setPassphraseInput("")
    setPassphraseError("")
    setShowPassphrase(false)

    // Call resolve with passphrase
    try {
      await onResolve(correctPassphrase)
      toast.success(`Event override successful!`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to override settlement")
    }
  }

  // Fetch markets and odds for the event
  const markets = useQuery(
    api.customEvents.listCustomMarkets,
    event ? { eventId: event._id } : "skip"
  )

  const allOdds = useQuery(
    api.customEvents.listCustomOddsByEvent,
    event ? { eventId: event._id } : "skip"
  )

  // Fetch settlement summary when outcomes are selected
  const settlementSummary = useQuery(
    api.customEvents.calculateSettlementSummary,
    event && selectedOutcomesByMarket.size > 0
      ? {
        eventId: event._id,
        marketOutcomes: Array.from(selectedOutcomesByMarket.entries()).map(([marketId, outcomeIds]) => ({
          marketId: marketId as any,
          winningOutcomeIds: Array.from(outcomeIds),
        })),
      }
      : "skip"
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

  // Filter and sort markets
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

  // Count total selected outcomes
  const totalSelected = React.useMemo(() => {
    return Array.from(selectedOutcomesByMarket.values()).reduce((sum, set) => sum + set.size, 0)
  }, [selectedOutcomesByMarket])

  const content = (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Select Winning Outcomes</h3>
          {totalSelected > 0 && (
            <Badge className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
              {totalSelected} selected
            </Badge>
          )}
        </div>
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

      {/* Markets & Outcomes */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 p-4">
          {!markets && (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {markets && filteredMarkets.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-8">
              No markets found
            </div>
          )}

          {filteredMarkets.map((market: any) => {
            const marketOutcomes = oddsByMarket.get(market._id) || []
            const selectedInMarket = selectedOutcomesByMarket.get(market._id) || new Set()
            const hasSelection = selectedInMarket.size > 0

            return (
              <section key={market._id} className="rounded-lg border border-border bg-card">
                <div className={cn(
                  "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 transition-colors",
                  hasSelection && "bg-primary/5"
                )}>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {market.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {market.marketTypes?.join(", ") || market.marketType}
                    </p>
                  </div>
                  {hasSelection && (
                    <Badge className="shrink-0 text-[9px] font-bold bg-primary text-primary-foreground border-none">
                      {selectedInMarket.size}
                    </Badge>
                  )}
                </div>

                {marketOutcomes.length === 0 && (
                  <div className="px-4 py-3 text-center text-[10px] text-muted-foreground">
                    No outcomes available
                  </div>
                )}

                {marketOutcomes.length > 0 && (
                  <div className={cn(
                    "grid gap-2 p-3",
                    marketOutcomes.length === 2 || marketOutcomes.length === 4 ? "grid-cols-2" : "grid-cols-3"
                  )}>
                    {marketOutcomes.map((outcome: any) => {
                      const isSelected = selectedInMarket.has(outcome.outcomeId)
                      return (
                        <button
                          key={outcome._id}
                          onClick={() => onOutcomeToggle(market._id, outcome.outcomeId)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 h-12 py-1 px-2 rounded-md border transition-all text-center min-w-0",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
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
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="shrink-0 border-t border-border bg-muted/30 p-4 space-y-3">
        {/* Settlement Summary */}
        {settlementSummary && selectedOutcomesByMarket.size > 0 && (
          <div className="grid grid-cols-4 gap-2 bg-card border border-border rounded-lg p-3">
            <div className="space-y-1">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Bets to Settle</p>
              <p className="text-sm font-bold text-foreground">{settlementSummary.totalBets}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Winners</p>
              <p className="text-sm font-bold text-emerald-600">{settlementSummary.winningBets}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Payouts</p>
              <p className="text-sm font-bold text-foreground font-mono">
                {(settlementSummary.totalPayouts / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase">Gain</p>
              <p className={cn(
                "text-sm font-bold font-mono",
                settlementSummary.systemGain > 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {(settlementSummary.systemGain / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
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
            onClick={async () => {
              try {
                // Try to resolve without passphrase first
                await onResolve()
              } catch (error) {
                // If event is already settled, show confirmation dialog
                const errorMsg = error instanceof Error ? error.message : ""
                if (errorMsg.includes("Event already settled")) {
                  setShowConfirmDialog(true)
                }
                // Don't show toast here - handleResolveEvent already showed it
              }
            }}
            disabled={isResolving || totalSelected === 0}
          >
            {isResolving ? "Resolving..." : `Resolve ${totalSelected > 0 ? `(${totalSelected})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog - Step 1 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-destructive">Override Already-Settled Event?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This event has already been settled. Do you want to override the existing settlement and re-settle with new outcomes?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 my-4">
            <p className="text-xs font-semibold text-destructive">
              This action is irreversible. All previous bet settlements will be recalculated and wallets will be updated accordingly.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-border"
              onClick={() => {
                setShowConfirmDialog(false)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 font-semibold bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setShowConfirmDialog(false)
                setShowPassphraseDialog(true)
              }}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passphrase Input Dialog - Step 2 */}
      <Dialog open={showPassphraseDialog} onOpenChange={setShowPassphraseDialog}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Enter System Passphrase</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter the system passphrase to confirm the override.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                System Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? "text" : "password"}
                  value={passphraseInput}
                  onChange={(e) => {
                    setPassphraseInput(e.target.value)
                    setPassphraseError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePassphraseSubmit()
                    }
                  }}
                  placeholder="Enter passphrase"
                  autoFocus
                  className="w-full h-9 px-3 pr-10 rounded-md border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                >
                  {showPassphrase ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {passphraseError && (
                <p className="text-[10px] text-destructive font-medium">{passphraseError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 border-border"
              onClick={() => {
                setShowPassphraseDialog(false)
                setPassphraseInput("")
                setPassphraseError("")
                setShowPassphrase(false)
              }}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 font-semibold"
              onClick={handlePassphraseSubmit}
              disabled={isResolving || !passphraseInput}
            >
              {isResolving ? "Overriding..." : "Override & Settle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-card flex flex-col h-[85vh] p-0 gap-0">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <DialogTitle className="text-sm font-semibold">
              {event ? `Resolve: ${event.homeTeam} vs ${event.awayTeam}` : "Resolve Event"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select winning outcomes for each market
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
            Select winning outcomes for each market
          </p>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
