"use client"

import * as React from "react"
import { usePaginatedQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuthClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Loader2,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  ChevronRight,
  Eye,
} from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { useMediaQuery } from "@/hooks/use-media-query"

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
    org?: string
  }
  device: {
    userAgent: string
    browserName?: string
    browserVersion?: string
    osName?: string
    osVersion?: string
    deviceType?: string
  }
  visitCount?: number
  firstVisitedAt?: number
  lastVisitedAt?: number
  visitedAt?: number
  isBot: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskIp(ip: string): string {
  // IPv4
  const v4 = ip.split(".")
  if (v4.length === 4) {
    return `${v4[0]}.${v4[1]}.***.***`
  }
  // IPv6 — show first two groups only
  const v6 = ip.split(":")
  if (v6.length >= 2) {
    return `${v6[0]}:${v6[1]}:****:****`
  }
  return ip
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Strip AS number prefix like "AS12345 " from org name
function cleanOrg(org?: string): string | undefined {
  if (!org) return undefined
  return org.replace(/^AS\d+\s*/, "").trim() || undefined
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DeviceIcon({ deviceType }: { deviceType?: string }) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className="size-3.5 text-muted-foreground shrink-0" />
    case "tablet":
      return <Tablet className="size-3.5 text-muted-foreground shrink-0" />
    default:
      return <Monitor className="size-3.5 text-muted-foreground shrink-0" />
  }
}

function BrowserIcon({ browserName }: { browserName?: string }) {
  const name = browserName?.toLowerCase()
  if (name === "chrome") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="4" fill="#4285F4" />
        <path d="M12 8h8.66A10 10 0 1 0 12 22V8z" fill="#34A853" opacity=".5" />
        <path d="M3.34 17A10 10 0 0 0 20.66 17L16.33 12A4 4 0 0 1 12 16L3.34 17z" fill="#FBBC05" opacity=".5" />
        <path d="M12 8l4.33-7.5A10 10 0 0 0 3.34 7L8 12A4 4 0 0 1 12 8z" fill="#EA4335" opacity=".5" />
        <circle cx="12" cy="12" r="4" fill="#4285F4" />
      </svg>
    )
  }
  if (name === "firefox") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#FF9500" />
        <circle cx="12" cy="12" r="5" fill="#FF3750" />
      </svg>
    )
  }
  if (name === "safari") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#006CFF" opacity=".15" />
        <circle cx="12" cy="12" r="10" stroke="#006CFF" strokeWidth="1.5" fill="none" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="#006CFF" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15 9l-4 4-1-3 5-1z" fill="#FF3B30" />
        <path d="M9 15l4-4 1 3-5 1z" fill="#006CFF" />
      </svg>
    )
  }
  if (name === "edge") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#0078D4" opacity=".15" />
        <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8c1.5 0 2.9-.42 4.1-1.14" stroke="#0078D4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M20 12c0 1.1-.9 2-2 2H8c0 2.2 1.8 4 4 4 1.1 0 2.1-.45 2.83-1.17" stroke="#0078D4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === "opera") {
    return (
      <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#FF1B2D" opacity=".15" />
        <ellipse cx="12" cy="12" rx="10" ry="10" stroke="#FF1B2D" strokeWidth="1.5" fill="none" />
        <ellipse cx="12" cy="12" rx="4" ry="7" stroke="#FF1B2D" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }
  return <Globe className="size-3.5 text-muted-foreground shrink-0" />
}

// ─── Details Sheet ────────────────────────────────────────────────────────────

function VisitorDetailsSheet({
  visitor,
  open,
  onClose,
}: {
  visitor: Visitor | null
  open: boolean
  onClose: () => void
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (!visitor) return null

  const firstVisit = visitor.firstVisitedAt || visitor.visitedAt || visitor._creationTime
  const lastVisit = visitor.lastVisitedAt || visitor.visitedAt || visitor._creationTime
  const isReturning = (visitor.visitCount ?? 1) > 1
  const org = cleanOrg(visitor.location.org)

  const content = (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-3 gap-y-3 gap-x-2">
        <span className="font-semibold text-muted-foreground">IP Address</span>
        <span className="col-span-2 font-mono text-foreground select-all break-all">{visitor.ip}</span>

        <span className="font-semibold text-muted-foreground">Status</span>
        <div className="col-span-2">
          {isReturning ? (
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">Returning</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">New User</Badge>
          )}
        </div>

        <span className="font-semibold text-muted-foreground">Total Visits</span>
        <span className="col-span-2 font-bold text-foreground">{visitor.visitCount ?? 1}</span>

        <span className="font-semibold text-muted-foreground">First Visit</span>
        <span className="col-span-2 text-foreground">{formatDateTime(firstVisit)}</span>

        <span className="font-semibold text-muted-foreground">Last Visit</span>
        <span className="col-span-2 text-foreground">{formatDateTime(lastVisit)}</span>
      </div>

      <Separator />

      <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <h3 className="font-bold text-primary flex items-center gap-1.5 text-xs">
          <MapPin className="size-3.5" /> Location
        </h3>
        <div className="grid grid-cols-3 gap-y-2 gap-x-2">
          <span className="font-semibold text-muted-foreground">Country</span>
          <span className="col-span-2">{visitor.location.country} ({visitor.location.countryCode})</span>

          {visitor.location.city && (
            <>
              <span className="font-semibold text-muted-foreground">City</span>
              <span className="col-span-2">{visitor.location.city}</span>
            </>
          )}

          {visitor.location.state && (
            <>
              <span className="font-semibold text-muted-foreground">State</span>
              <span className="col-span-2">{visitor.location.state}</span>
            </>
          )}

          {org && (
            <>
              <span className="font-semibold text-muted-foreground">ISP</span>
              <span className="col-span-2">{org}</span>
            </>
          )}

          {visitor.location.timezone && (
            <>
              <span className="font-semibold text-muted-foreground">Timezone</span>
              <span className="col-span-2">{visitor.location.timezone}</span>
            </>
          )}

          {visitor.location.latitude && visitor.location.longitude && (
            <>
              <span className="font-semibold text-muted-foreground">Coords</span>
              <span className="col-span-2 font-mono">
                {visitor.location.latitude.toFixed(4)}, {visitor.location.longitude.toFixed(4)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        <h3 className="font-bold text-blue-600 flex items-center gap-1.5 text-xs">
          <Monitor className="size-3.5" /> Device
        </h3>
        <div className="grid grid-cols-3 gap-y-2 gap-x-2">
          {visitor.device.deviceType && (
            <>
              <span className="font-semibold text-muted-foreground">Type</span>
              <span className="col-span-2 capitalize">{visitor.device.deviceType}</span>
            </>
          )}
          {visitor.device.osName && (
            <>
              <span className="font-semibold text-muted-foreground">OS</span>
              <span className="col-span-2">{visitor.device.osName}{visitor.device.osVersion ? ` ${visitor.device.osVersion}` : ""}</span>
            </>
          )}
          {visitor.device.browserName && (
            <>
              <span className="font-semibold text-muted-foreground">Browser</span>
              <span className="col-span-2">{visitor.device.browserName}{visitor.device.browserVersion ? ` ${visitor.device.browserVersion}` : ""}</span>
            </>
          )}
          <span className="font-semibold text-muted-foreground">User Agent</span>
          <span className="col-span-2 font-mono text-[10px] break-all">{visitor.device.userAgent}</span>
        </div>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={isDesktop ? "w-96" : "rounded-t-lg max-h-[85vh]"}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">Visitor Details</SheetTitle>
          <SheetDescription className="text-xs font-mono">
            {maskIp(visitor.ip)}
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function VisitorCard({ v, onSelect }: { v: Visitor; onSelect: () => void }) {
  const isReturning = (v.visitCount ?? 1) > 1
  const org = cleanOrg(v.location.org)
  const city = v.location.city || v.location.state
  const firstVisit = v.firstVisitedAt || v.visitedAt || v._creationTime
  const lastVisit = v.lastVisitedAt || v.visitedAt || v._creationTime

  return (
    <div
      className="rounded-lg border border-border bg-card p-3.5 space-y-3 cursor-pointer hover:bg-muted/10 active:bg-muted/20 transition-colors"
      onClick={onSelect}
    >
      {/* Row 1: IP + status */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono font-semibold text-xs text-foreground truncate">
          {maskIp(v.ip)}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {isReturning ? (
            <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/20">
              Returning
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-semibold">
              New User
            </Badge>
          )}
        </div>
      </div>

      {/* Row 2: location */}
      <div>
        <p className="text-xs font-semibold text-foreground">
          {city ? `${city}, ${v.location.country}` : v.location.country}
        </p>
        {org && <p className="text-[11px] text-primary mt-0.5">{org}</p>}
      </div>

      {/* Row 3: stats */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
        <div className="flex items-center gap-3">
          <span>
            Visits:{" "}
            <span className={`font-bold ${isReturning ? "text-emerald-500" : "text-foreground"}`}>
              {v.visitCount ?? 1}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <BrowserIcon browserName={v.device.browserName} />
            <span>{v.device.browserName || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-1">
            <DeviceIcon deviceType={v.device.deviceType} />
            <span className="capitalize">{v.device.deviceType || "Unknown"}</span>
          </div>
        </div>
        <ChevronRight className="size-3.5 shrink-0" />
      </div>

      {/* Row 4: timestamps */}
      <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
        <div>
          <span className="font-semibold block">First Visit</span>
          {formatDateTime(firstVisit)}
        </div>
        <div>
          <span className="font-semibold block">Last Visit</span>
          {formatDateTime(lastVisit)}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export function VisitorsPanel() {
  const { user } = useAuthClient()
  const [filterBot, setFilterBot] = React.useState<"all" | "visitors" | "bots">("visitors")
  const [detailTarget, setDetailTarget] = React.useState<Visitor | null>(null)

  const { results: allVisitors, status, loadMore, isLoading } = usePaginatedQuery(
    api.ipTracking.listVisitors,
    { adminUserId: user?._id as Id<"users"> | undefined },
    { initialNumItems: PAGE_SIZE }
  )

  const visitors = React.useMemo(() => {
    return (allVisitors as Visitor[]).filter((v) => {
      if (filterBot === "visitors") return !v.isBot
      if (filterBot === "bots") return v.isBot
      return true
    })
  }, [allVisitors, filterBot])

  const loadMoreBtn = (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs gap-1.5"
      onClick={() => loadMore(PAGE_SIZE)}
      disabled={status === "LoadingMore"}
    >
      {status === "LoadingMore" ? (
        <><Loader2 className="size-3 animate-spin" /> Loading...</>
      ) : (
        <><ChevronRight className="size-3.5" /> Load More</>
      )}
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <Globe className="size-5 text-primary" />
          Visitors
        </h1>
        <p className="text-xs text-muted-foreground">
          Track homepage visitors — IP addresses, locations, and device info.
        </p>
      </div>

      <Separator />

      {/* Filter */}
      <div className="flex gap-2">
        {(["visitors", "bots", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filterBot === f ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setFilterBot(f)}
          >
            {f === "visitors" ? "Real Visitors" : f === "bots" ? "Bots" : "All"}
          </Button>
        ))}
      </div>

      {/* ── Mobile: Cards ── */}
      <div className="lg:hidden space-y-2">
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}

        {!isLoading && visitors.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-xs border border-dashed border-border rounded-lg">
            No visitors found.
          </div>
        )}

        {visitors.map((v) => (
          <VisitorCard key={v._id} v={v} onSelect={() => setDetailTarget(v)} />
        ))}

        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <div className="pt-1">{loadMoreBtn}</div>
        )}
        {status === "Exhausted" && visitors.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground py-2">
            All {visitors.length} loaded
          </p>
        )}
      </div>

      {/* ── Desktop: Table ── */}
      <div className="hidden lg:block rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]" style={{ minWidth: 860 }}>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <th className="py-3 px-4 w-36">IP Address</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 w-16 text-center">Visits</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 w-40">First Visit</th>
                <th className="py-3 px-4 w-40">Last Visit</th>
                <th className="py-3 px-4 w-28">Browser</th>
                <th className="py-3 px-4 w-28">Device</th>
                <th className="py-3 px-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-8 px-4">
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && visitors.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground text-xs">
                    No visitors found.
                  </td>
                </tr>
              )}

              {visitors.map((v) => {
                const isReturning = (v.visitCount ?? 1) > 1
                const org = cleanOrg(v.location.org)
                const city = v.location.city || v.location.state
                const firstVisit = v.firstVisitedAt || v.visitedAt || v._creationTime
                const lastVisit = v.lastVisitedAt || v.visitedAt || v._creationTime

                return (
                  <tr key={v._id} className="hover:bg-muted/30 transition-colors group">
                    {/* IP — masked, no wrap */}
                    <td className="py-2.5 px-4 font-mono font-semibold text-[11px] text-foreground whitespace-nowrap">
                      {maskIp(v.ip)}
                    </td>

                    {/* Location — city+country on one line, ISP below */}
                    <td className="py-2.5 px-4 min-w-0">
                      <p className="font-semibold text-[11px] text-foreground whitespace-nowrap">
                        {city ? `${city}, ${v.location.country}` : v.location.country}
                      </p>
                      {org && (
                        <p className="text-[10px] text-primary mt-0.5 whitespace-nowrap">{org}</p>
                      )}
                    </td>

                    {/* Visits */}
                    <td className="py-2.5 px-4 text-center">
                      <span className={`font-bold text-[11px] tabular-nums ${isReturning ? "text-emerald-500" : "text-foreground"}`}>
                        {v.visitCount ?? 1}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {isReturning ? (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/20">
                          Returning
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-muted text-muted-foreground">
                          New User
                        </Badge>
                      )}
                    </td>

                    {/* First Visit */}
                    <td className="py-2.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDateTime(firstVisit)}
                    </td>

                    {/* Last Visit */}
                    <td className="py-2.5 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDateTime(lastVisit)}
                    </td>

                    {/* Browser */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <BrowserIcon browserName={v.device.browserName} />
                        <span>{v.device.browserName || "Unknown"}</span>
                      </div>
                    </td>

                    {/* Device */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground capitalize">
                        <DeviceIcon deviceType={v.device.deviceType} />
                        <span>{v.device.deviceType || "Unknown"}</span>
                      </div>
                    </td>

                    {/* Row action */}
                    <td className="py-2.5 px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDetailTarget(v)}
                        aria-label="View details"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <span className="text-[11px] text-muted-foreground">
              Showing {visitors.length} visitor{visitors.length !== 1 ? "s" : ""}
            </span>
            {loadMoreBtn}
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

      {/* Detail sheet */}
      <VisitorDetailsSheet
        visitor={detailTarget}
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  )
}
