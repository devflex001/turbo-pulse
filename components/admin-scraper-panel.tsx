"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@/lib/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { toast } from "sonner"
import { PlayCircle } from "lucide-react"
import { ScraperConfigDrawer, type ScraperConfig } from "@/components/scraper-config-drawer"
import { StatCard } from "@/components/stat-card"
import { ScraperLiveLogs } from "@/components/scraper-live-logs"
import { kwikbetAdapter } from "@/convex/scrapers/kwikbet"
import type { Id } from "@/convex/_generated/dataModel"

// 8 Most popular sports from KwikBet
const AVAILABLE_SPORTS = [
  { id: 1, label: "Soccer" },
  { id: 2, label: "Basketball" },
  { id: 5, label: "Tennis" },
  { id: 16, label: "American Football" },
  { id: 21, label: "Cricket" },
  { id: 10, label: "Boxing" },
  { id: 117, label: "MMA" },
  { id: 12, label: "Rugby" },
]

const DEFAULT_PAGE_LIMIT = 50
const DEFAULT_MAX_PAGES = 20
const DETAIL_CONCURRENCY = 4

function formatTime(value: number | null) {
  if (!value) return "Never"
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(ms: number | null) {
  if (!ms) return "—"
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${seconds % 60}s`
}

function todayIsoDate(offsetDays: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function dateWindow(dateWindowDays: number) {
  const days = Math.max(1, Math.min(14, Math.floor(dateWindowDays)))
  const dates = Array.from({ length: days }, (_, index) => todayIsoDate(index))
  return {
    dates,
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results: R[] = []
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex++
      results[index] = await mapper(items[index])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )

  return results
}

export function AdminScraperPanel() {
  const { sessionToken } = useAuth()
  const [configOpen, setConfigOpen] = React.useState(false)
  const [logsOpen, setLogsOpen] = React.useState(false)
  const [selectedSport, setSelectedSport] = React.useState<string>("1")
  const [dateWindowDays, setDateWindowDays] = React.useState<string>("2")
  const [matchLimit, setMatchLimit] = React.useState<string>("10")
  const [running, setRunning] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])
  const [currentRunId, setCurrentRunId] = React.useState<Id<"scrapeRuns"> | null>(null)

  const pagination = usePagination({ pageSize: 10 })

  const overview = useQuery(api.scraper.getAdminOverview, {
    limit: pagination.pageSize,
    offset: pagination.offset,
  })
  const startRun = useMutation(api.scraper.startRun)
  const finishRun = useMutation(api.scraper.finishRun)
  const noteDiscovery = useMutation(api.scraper.noteDiscovery)
  const noteMatchFailure = useMutation(api.scraper.noteMatchFailure)
  const upsertMatchDetail = useMutation(api.scraper.upsertMatchDetail)
  const updateRunStats = useMutation(api.scraper.updateRunStats)

  const settings = overview?.settings as any
  const runs = overview?.runs ?? []
  const totalRuns = overview?.totalRuns ?? 0

  React.useEffect(() => {
    if (settings) {
      setSelectedSport(String(settings.selectedSports?.[0] ?? 1))
      setDateWindowDays(String(settings.dateWindowDays ?? 2))
      setMatchLimit(String(settings.matchLimit ?? 5))
    }
  }, [settings])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  const handleConfigStart = async (config: ScraperConfig) => {
    setRunning(true)
    setConfigOpen(false)
    setLogs([])
    setLogsOpen(true)

    const window = dateWindow(Number(config.dateWindowDays))
    const sportIds = [Number(config.selectedSport)]
    const sportNames = AVAILABLE_SPORTS.find(s => s.id === sportIds[0])?.label || String(sportIds[0])

    try {
      const runId = await startRun({
        triggeredBy: "admin",
        dateFrom: window.dateFrom,
        dateTo: window.dateTo,
        selectedSports: [config.selectedSport],
        sessionToken: sessionToken || undefined,
      })
      setCurrentRunId(runId)

      addLog(`[INFO] Starting run for: ${sportNames}`)
      addLog(`[INFO] Fetching matches from ${window.dateFrom} to ${window.dateTo}`)

      const discovered = new Map<string, unknown>()
      let totalFetched = 0

      for (const date of window.dates) {
        const pageMatches = await kwikbetAdapter.fetchMatchPages({
          date,
          live: false,
          limit: Number(config.matchLimit),
          maxPages: DEFAULT_MAX_PAGES,
          sportIds,
        })

        totalFetched += pageMatches.length
        addLog(`[INFO] ${date}: found ${pageMatches.length} matches`)

        for (const match of pageMatches) {
          const normalized = kwikbetAdapter.normalizeMatch(match)
          discovered.set(normalized.sourceMatchId, match)
        }
      }

      const sourceMatchIds = Array.from(discovered.keys())
      await noteDiscovery({
        runId,
        matchesDiscovered: sourceMatchIds.length,
      })

      addLog(`[SUCCESS] Total API results: ${totalFetched}, Unique ${sportNames} matches: ${sourceMatchIds.length}. Fetching details...`)

      let successCount = 0
      let failureCount = 0
      let totalMarketsUpserted = 0
      let totalOddsUpserted = 0

      await mapConcurrent(sourceMatchIds, DETAIL_CONCURRENCY, async (sourceMatchId) => {
        try {
          const detail = await kwikbetAdapter.fetchMatchDetails(sourceMatchId)
          const normalized = kwikbetAdapter.normalizeDetail(detail)

          const result = await upsertMatchDetail({
            runId,
            match: normalized.match,
            markets: normalized.markets,
            odds: normalized.odds,
          })

          successCount++
          totalMarketsUpserted += result.marketsUpserted
          totalOddsUpserted += result.oddsUpserted

          addLog(`[SUCCESS] Processed ${sourceMatchId}`)
        } catch (error) {
          failureCount++
          const errorMsg = error instanceof Error ? error.message : "Unknown error"
          addLog(`[ERROR] Failed ${sourceMatchId}: ${errorMsg}`)
          await noteMatchFailure({ runId })
        }
      })

      await updateRunStats({
        runId,
        matchesUpserted: successCount,
        marketsUpserted: totalMarketsUpserted,
        oddsUpserted: totalOddsUpserted,
      })

      addLog(`[SUCCESS] Done: ${successCount} succeeded, ${failureCount} failed`)

      await finishRun({
        runId,
        status: "success",
        sessionToken: sessionToken || undefined,
      })

      toast.success("Scraper completed successfully")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown scrape error"
      addLog(`[ERROR] Run failed: ${errorMsg}`)
      if (currentRunId) {
        await finishRun({
          runId: currentRunId,
          status: "failed",
          sessionToken: sessionToken || undefined,
        })
      }
      toast.error(errorMsg)
    } finally {
      setRunning(false)
    }
  }

  if (!overview) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Calculate metrics based on totalRuns from overview
  const successfulRuns = runs.filter((r: any) => r.status === "success").length
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight">API Scrape</h1>
          <p className="text-xs text-muted-foreground">Manage KwikBet fixture ingestion</p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5"
          onClick={() => setConfigOpen(true)}
          disabled={running}
        >
          <PlayCircle className="size-3.5" />
          Scrape
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
        />
        <StatCard label="Total Runs" value={totalRuns} />
        <StatCard
          label="Last Run"
          value={formatTime(overview.settings.lastRunAt)}
        />
      </div>

      {/* Live Logs Indicator (when running) */}
      {running && (
        <button
          onClick={() => setLogsOpen(true)}
          className="w-full flex items-center gap-3 border border-border rounded-lg bg-card p-3 sm:p-4 hover:bg-accent transition-colors cursor-pointer"
        >
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold">Live Logs</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Running</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Click to view real-time logs</p>
          </div>
          <div className="text-xs text-muted-foreground">→</div>
        </button>
      )}

      {/* Runs Table */}
      {runs.length > 0 && (
        <div className="space-y-3 border border-border rounded-lg bg-card p-2 sm:px-2 shadow-sm">
          <span className="text-sm font-semibold">Run History</span>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[10px] font-semibold">
                  <th className="py-2 px-3 text-left">Time</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Sport</th>
                  <th className="py-2 px-3 text-right">Duration</th>
                  <th className="py-2 px-3 text-right">Discovered</th>
                  <th className="py-2 px-3 text-right">Saved</th>
                  <th className="py-2 px-3 text-right">Markets</th>
                  <th className="py-2 px-3 text-right">Odds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run: any) => {
                  const sportNames = (run.selectedSports || [])
                    .map((sportId: string | number) => {
                      const sport = AVAILABLE_SPORTS.find(s => String(s.id) === String(sportId))
                      return sport?.label || String(sportId)
                    })
                    .join(", ")

                  return (
                    <tr key={run._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-[10px]">
                        {formatTime(run.startedAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          className={
                            run.status === "success"
                              ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 rounded-sm text-[9px] font-semibold border border-emerald-500/20"
                              : run.status === "running"
                                ? "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15 rounded-sm text-[9px] font-semibold border border-yellow-500/20"
                                : "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 rounded-sm text-[9px] font-semibold border border-rose-500/20"
                          }
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground text-[10px]">{sportNames || "—"}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground text-[10px]">
                        {formatDuration(run.durationMs)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[10px]">
                        {run.matchesDiscovered}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[10px]">
                        {run.matchesUpserted}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[10px]">
                        {run.marketsUpserted}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-[10px]">
                        {run.oddsUpserted}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {runs.map((run: any) => {
              const sportNames = (run.selectedSports || [])
                .map((sportId: string | number) => {
                  const sport = AVAILABLE_SPORTS.find(s => String(s.id) === String(sportId))
                  return sport?.label || String(sportId)
                })
                .join(", ")

              return (
                <div key={run._id} className="border border-border rounded-lg p-3 bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-muted-foreground mb-1">
                        {formatTime(run.startedAt)}
                      </div>
                      <div className="text-xs text-foreground truncate">{sportNames || "—"}</div>
                    </div>
                    <Badge
                      className={
                        run.status === "success"
                          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 rounded-sm text-[9px] font-semibold border border-emerald-500/20"
                          : run.status === "running"
                            ? "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/15 rounded-sm text-[9px] font-semibold border border-yellow-500/20"
                            : "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 rounded-sm text-[9px] font-semibold border border-rose-500/20"
                      }
                    >
                      {run.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">Duration</div>
                      <div className="font-mono text-[10px] font-medium">{formatDuration(run.durationMs)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">Found</div>
                      <div className="font-mono text-[10px] font-medium">{run.matchesDiscovered}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">Saved</div>
                      <div className="font-mono text-[10px] font-medium">{run.matchesUpserted}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground mb-0.5">Odds</div>
                      <div className="font-mono text-[10px] font-medium">{run.oddsUpserted}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalRuns > pagination.pageSize && (
        <Pagination
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalItems={totalRuns}
          onPageChange={pagination.onPageChange}
        />
      )}

      {/* Config Dialog/Drawer */}
      <ScraperConfigDrawer
        open={configOpen}
        onOpenChange={setConfigOpen}
        onStart={handleConfigStart}
        isLoading={running}
        initialValues={{
          selectedSport,
          dateWindowDays,
          matchLimit,
        }}
      />

      {/* Live Logs Modal/Drawer */}
      <ScraperLiveLogs
        open={logsOpen}
        onOpenChange={setLogsOpen}
        logs={logs}
        running={running}
      />
    </div>
  )
}
