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
import { CustomEventDetail } from "@/components/custom-event-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {sortedEvents.length > 0 ? (
          <>
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
                {sortedEvents.map((event) => (
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
                      <Badge
                        className={cn(
                          "text-[9px] font-bold",
                          event.status === "draft"
                            ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/20"
                            : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                        )}
                      >
                        {event.status}
                      </Badge>
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
                            className="cursor-pointer gap-2 text-[9px]"
                          >
                            <Eye className="size-3" />
                            View Markets
                          </DropdownMenuItem>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {events && events.items && events.items.length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <Pagination
                  currentPage={pagination.currentPage}
                  pageSize={pagination.pageSize}
                  totalItems={events.totalCount || 0}
                  onPageChange={pagination.onPageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <p className="text-sm font-semibold">No events found</p>
            <p className="mt-1 text-xs">
              Create your first custom event to get started
            </p>
          </div>
        )}
      </div>

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
    </div>
  )
}
