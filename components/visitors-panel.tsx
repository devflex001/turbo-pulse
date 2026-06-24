"use client"

import * as React from "react"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Globe,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"

// ─── Types ────────────────────────────────────────────────────────────────────

type Visitor = {
  _id: string
  _creationTime: number
  ip: string
  userId?: string
  location: {
    country: string
    countryCode: string
    state?: string
    city?: string
    timezone?: string
    latitude?: number
    longitude?: number
  }
  device: {
    userAgent: string
    browserName?: string
    browserVersion?: string
    osName?: string
    osVersion?: string
    deviceType?: string
  }
  visitedAt: number
  isBot: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function getDeviceIcon(deviceType?: string) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="size-3.5" />
    case "tablet":
      return <Tablet className="size-3.5" />
    case "desktop":
      return <Monitor className="size-3.5" />
    default:
      return <Smartphone className="size-3.5 text-muted-foreground" />
  }
}

function getBrowserIcon(browserName?: string) {
  switch (browserName?.toLowerCase()) {
    case "chrome":
      return "🌐"
    case "firefox":
      return "🦊"
    case "safari":
      return "🧭"
    default:
      return null
  }
}

function LocationBadge({ visitor }: { visitor: Visitor }) {
  const city = visitor.location.city || visitor.location.state
  const display = city
    ? `${city}, ${visitor.location.country}`
    : visitor.location.country

  return (
    <Badge variant="outline" className="text-[10px] font-semibold">
      <MapPin className="size-3 mr-1" />
      {display}
    </Badge>
  )
}

// ─── Details Modal ───────────────────────────────────────────────────────────

interface VisitorDetailsModalProps {
  visitor: Visitor | null
  open: boolean
  onClose: () => void
}

function VisitorDetailsModal({
  visitor,
  open,
  onClose,
}: VisitorDetailsModalProps) {
  if (!visitor) return null

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Visitor Details"
      description="Complete visitor information including location and device details."
    >
      <div className="space-y-4 py-2 text-xs">
        {/* Basic Info */}
        <div className="grid grid-cols-3 gap-y-3 gap-x-2 py-1">
          <span className="font-semibold text-muted-foreground">Visit ID:</span>
          <span className="col-span-2 font-mono break-all text-foreground select-all">
            {visitor._id}
          </span>

          <span className="font-semibold text-muted-foreground">Visited At:</span>
          <span className="col-span-2 text-foreground">
            {formatDate(visitor.visitedAt)} at {formatTime(visitor.visitedAt)}
          </span>

          <span className="font-semibold text-muted-foreground">Status:</span>
          <div className="col-span-2">
            {visitor.isBot ? (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                Bot
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Visitor
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        {/* IP & Location */}
        <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <h3 className="font-bold text-primary flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            Location Information
          </h3>

          <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-[11px]">
            <span className="font-semibold text-muted-foreground">IP Address:</span>
            <span className="col-span-2 font-mono text-foreground">{visitor.ip}</span>

            <span className="font-semibold text-muted-foreground">Country:</span>
            <span className="col-span-2 text-foreground">
              {visitor.location.country} ({visitor.location.countryCode})
            </span>

            {visitor.location.city && (
              <>
                <span className="font-semibold text-muted-foreground">City:</span>
                <span className="col-span-2 text-foreground">
                  {visitor.location.city}
                </span>
              </>
            )}

            {visitor.location.state && (
              <>
                <span className="font-semibold text-muted-foreground">State:</span>
                <span className="col-span-2 text-foreground">
                  {visitor.location.state}
                </span>
              </>
            )}

            {visitor.location.timezone && (
              <>
                <span className="font-semibold text-muted-foreground">Timezone:</span>
                <span className="col-span-2 text-foreground">
                  {visitor.location.timezone}
                </span>
              </>
            )}

            {visitor.location.latitude && visitor.location.longitude && (
              <>
                <span className="font-semibold text-muted-foreground">
                  Coordinates:
                </span>
                <span className="col-span-2 font-mono text-foreground">
                  {visitor.location.latitude.toFixed(4)}, {visitor.location.longitude.toFixed(4)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Device Info */}
        <div className="space-y-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <h3 className="font-bold text-blue-600 flex items-center gap-1.5">
            <Smartphone className="size-3.5" />
            Device Information
          </h3>

          <div className="grid grid-cols-3 gap-y-2 gap-x-2 text-[11px]">
            {visitor.device.deviceType && (
              <>
                <span className="font-semibold text-muted-foreground">Type:</span>
                <span className="col-span-2 text-foreground capitalize">
                  {visitor.device.deviceType}
                </span>
              </>
            )}

            {visitor.device.osName && (
              <>
                <span className="font-semibold text-muted-foreground">OS:</span>
                <span className="col-span-2 text-foreground">
                  {visitor.device.osName}
                  {visitor.device.osVersion ? ` ${visitor.device.osVersion}` : ""}
                </span>
              </>
            )}

            {visitor.device.browserName && (
              <>
                <span className="font-semibold text-muted-foreground">Browser:</span>
                <span className="col-span-2 text-foreground">
                  {visitor.device.browserName}
                  {visitor.device.browserVersion ? ` ${visitor.device.browserVersion}` : ""}
                </span>
              </>
            )}

            <span className="font-semibold text-muted-foreground">User Agent:</span>
            <span className="col-span-2 font-mono text-[10px] text-foreground break-all">
              {visitor.device.userAgent}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}

// ─── Main Visitors Panel ───────────────────────────────────────────────────────

const PAGE_SIZE = 15

export function VisitorsPanel() {
  const { user } = useAuthClient()
  const [filterBot, setFilterBot] = React.useState<"all" | "visitors" | "bots">(
    "visitors"
  )

  const { results: allVisitors, status, loadMore, isLoading } = usePaginatedQuery(
    api.ipTracking.listVisitors,
    { adminUserId: user?._id as Id<"users"> | undefined },
    { initialNumItems: PAGE_SIZE }
  )

  // Filter out bots if needed
  const visitors = React.useMemo(() => {
    return allVisitors.filter((v: any) => {
      if (filterBot === "visitors") return !v.isBot
      if (filterBot === "bots") return v.isBot
      return true
    })
  }, [allVisitors, filterBot])

  const [detailTarget, setDetailTarget] = React.useState<Visitor | null>(null)

  const displayName = (v: Visitor) =>
    v.location.city || v.location.state || v.location.country || v.ip

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            Visitors
          </h1>
          <p className="text-xs text-muted-foreground">
            Track homepage visitors — view IP addresses, locations, and device info.
          </p>
        </div>

        {/* Back to Users */}
        <Link href="/admin/users" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full gap-2 text-xs font-semibold h-9">
            <ChevronRight className="size-4 -rotate-180" />
            Back to Users
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filterBot === "all" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setFilterBot("all")}
        >
          All Visitors
        </Button>
        <Button
          variant={filterBot === "visitors" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setFilterBot("visitors")}
        >
          Real Visitors
        </Button>
        <Button
          variant={filterBot === "bots" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setFilterBot("bots")}
        >
          Bots
        </Button>
      </div>

      {/* ── Mobile Card List (< sm) ── */}
      <div className="sm:hidden space-y-2">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && visitors.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-xs">
            No visitors found.
          </div>
        )}

        {visitors.map((visitor: any) => {
          const v = {
            ...visitor,
            _id: visitor._id,
            _creationTime: visitor._creationTime ?? 0,
          } as Visitor

          return (
            <div
              key={v._id}
              className="rounded-lg border border-border bg-card p-3 space-y-2.5 cursor-pointer hover:bg-muted/10 transition-colors"
              onClick={() => setDetailTarget(v)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    {getDeviceIcon(v.device.deviceType)}
                  </div>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {v.ip}
                  </span>
                </div>
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
              </div>

              <LocationBadge visitor={v} />

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  {formatTime(v.visitedAt)}
                </span>
                {v.device.browserName && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {getBrowserIcon(v.device.browserName)}
                    {v.device.browserName}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop Table (≥ sm) ── */}
      <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 hidden md:table-cell">Location</th>
                <th className="py-3 px-4 hidden lg:table-cell">Device</th>
                <th className="py-3 px-4 hidden lg:table-cell">Browser</th>
                <th className="py-3 px-4">Visited</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-8">
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && visitors.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground text-xs">
                    No visitors found.
                  </td>
                </tr>
              )}

              {visitors.map((visitor: any) => {
                const v = {
                  ...visitor,
                  _id: visitor._id,
                  _creationTime: visitor._creationTime ?? 0,
                } as Visitor

                return (
                  <tr key={v._id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold font-mono text-foreground">
                      {v.ip}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs">
                          {v.location.city || v.location.state || "Unknown"},
                          <br />
                          {v.location.country}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        {getDeviceIcon(v.device.deviceType)}
                        <span className="text-xs capitalize">
                          {v.device.deviceType || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        {getBrowserIcon(v.device.browserName)}
                        <span className="text-xs">
                          {v.device.browserName || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {formatTime(v.visitedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 hover:bg-muted"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuItem
                            onClick={() => setDetailTarget(v)}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-[11px] text-muted-foreground">
              Showing {visitors.length} visitor{visitors.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => loadMore(PAGE_SIZE)}
              disabled={status === "LoadingMore"}
            >
              {status === "LoadingMore" ? (
                <>
                  <Loader2 className="size-3 animate-spin" /> Loading...
                </>
              ) : (
                <>
                  <ChevronRight className="size-3.5" /> Load More
                </>
              )}
            </Button>
          </div>
        )}

        {status === "Exhausted" && visitors.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border bg-muted/10">
            <span className="text-[11px] text-muted-foreground">
              All {visitors.length} visitor{visitors.length !== 1 ? "s" : ""} loaded
            </span>
          </div>
        )}
      </div>

      {/* Mobile Load More (below cards) */}
      <div className="sm:hidden">
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <Button
            variant="outline"
            className="w-full h-9 text-xs gap-1.5"
            onClick={() => loadMore(PAGE_SIZE)}
            disabled={status === "LoadingMore"}
          >
            {status === "LoadingMore" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Loading...
              </>
            ) : (
              <>
                <ChevronRight className="size-3.5" /> Load More
              </>
            )}
          </Button>
        )}
        {status === "Exhausted" && visitors.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-2">
            All {visitors.length} visitor{visitors.length !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>

      {/* Modals */}
      <VisitorDetailsModal
        visitor={detailTarget}
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  )
}
