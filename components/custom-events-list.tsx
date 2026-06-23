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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Search,
  Trash2,
  ListPlus,
  ChevronDown,
  MoreVertical,
  Edit2,
  CheckCircle,
  EyeOff,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

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
  const isMobile = useMediaQuery("(max-width: 768px)")

  const pagination = usePagination({ pageSize: 10 })

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
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
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
    <div className="space-y-5">
      {/* Filters Card - matches events page pattern */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              className="h-8 bg-muted/50 pl-8 text-xs focus-visible:ring-primary"
            />
          </div>

          {/* Status Dropdown */}
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

          {/* Sort Dropdown */}
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
      </div>

      {/* Custom Events Table - standalone without outer card */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold">Custom Events</h2>
          <Badge variant="outline" className="font-mono text-[10px]">
            {sortedEvents.length}
          </Badge>
        </div>

        {sortedEvents.length > 0 ? (
          <>
            {/* Desktop Cards - Clean Admin View */}
            <div className="hidden grid-cols-1 gap-2 p-3 md:grid lg:grid-cols-2 xl:grid-cols-3">
              {sortedEvents.map((event) => (
                <div
                  key={event._id}
                  className="relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/40 transition-all group"
                >
                  <div className="p-3 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">
                          {event.homeTeam} vs {event.awayTeam}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {event.competition}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-[9px] font-semibold shrink-0",
                          event.status === "draft"
                            ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/20"
                            : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                        )}
                      >
                        {event.status}
                      </Badge>
                    </div>

                    {/* Time */}
                    <p className="text-[9px] text-muted-foreground font-mono">
                      {formatTime(event.startTime)}
                    </p>

                    {/* Markets */}
                    <div className="text-[9px] text-muted-foreground">
                      {event.totalMarkets} markets
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 px-2 text-[9px] flex-1"
                        onClick={() => {
                          setSelectedEvent(event)
                          setDetailOpen(true)
                        }}
                      >
                        <ListPlus className="size-3" />
                        View
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1"
                          >
                            <MoreVertical className="size-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {event.status === "draft" && (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => handleEdit(event, e as any)}
                                className="cursor-pointer gap-2 text-[9px]"
                              >
                                <Edit2 className="size-3" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handlePublish(event._id, e as any)
                                }
                                className="cursor-pointer gap-2 text-[9px]"
                              >
                                <CheckCircle className="size-3" />
                                Publish
                              </DropdownMenuItem>
                            </>
                          )}
                          {event.status === "published" && (
                            <DropdownMenuItem
                              onClick={(e) =>
                                handleUnpublish(event._id, e as any)
                              }
                              className="cursor-pointer gap-2 text-[9px]"
                            >
                              <EyeOff className="size-3" />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(event._id, e as any)}
                            className="cursor-pointer gap-2 text-[9px] text-destructive"
                          >
                            <Trash2 className="size-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-3 md:hidden">
              {sortedEvents.map((event) => (
                <CustomEventCard
                  key={event._id}
                  eventId={event._id}
                  homeTeam={event.homeTeam}
                  awayTeam={event.awayTeam}
                  homeScore={event.homeScore || 0}
                  awayScore={event.awayScore || 0}
                  startTime={event.startTime}
                  competition={event.competition}
                  title={event.title}
                  totalMarkets={event.totalMarkets}
                  onClick={() => {
                    setSelectedEvent(event)
                    setDetailOpen(true)
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <p className="text-sm">No events found</p>
            <p className="mt-1 text-xs">
              Create your first custom event to get started
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {events && events.items && events.items.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={events.totalCount || 0}
          onPageChange={pagination.onPageChange}
        />
      )}

      {/* Event Detail Modal */}
      {isMobile ? (
        <Drawer open={detailOpen} onOpenChange={setDetailOpen}>
          <DrawerContent className="flex h-[90vh] flex-col overflow-hidden bg-card p-0">
            <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
              <DrawerTitle className="truncate text-sm font-semibold">
                {selectedEvent
                  ? `${selectedEvent.homeTeam} vs ${selectedEvent.awayTeam}`
                  : "Event Details"}
              </DrawerTitle>
              <p className="truncate text-xs text-muted-foreground">
                {selectedEvent?.competition}
              </p>
            </DrawerHeader>
            <div className="flex flex-1 flex-col overflow-hidden">
              {selectedEvent && (
                <CustomEventDetail
                  eventId={selectedEvent._id}
                  adminControls
                  onBack={() => setDetailOpen(false)}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
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
      )}
    </div>
  )
}
