"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { PlayCircle } from "lucide-react"
import { ScraperConfigDrawer, type ScraperConfig } from "@/components/scraper-config-drawer"
import { StatCard } from "@/components/stat-card"

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

export function AdminScraperPanel() {
  const overview = useQuery(api.scraper.getAdminOverview)
  const triggerNow = useMutation(api.scraper.triggerNow)

  const [configOpen, setConfigOpen] = React.useState(false)
  const [selectedSport, setSelectedSport] = React.useState<string>("1")
  const [dateWindowDays, setDateWindowDays] = React.useState<string>("2")
  const [matchLimit, setMatchLimit] = React.useState<string>("10")
  const [running, setRunning] = React.useState(false)

  const settings = overview?.settings as any
  const currentRun = overview?.runs?.[0]
  const isCurrentlyRunning = currentRun?.status === "running"

  React.useEffect(() => {
    if (settings) {
      setSelectedSport(String(settings.selectedSports?.[0] ?? 1))
      setDateWindowDays(String(settings.dateWindowDays ?? 2))
      setMatchLimit(String(settings.matchLimit ?? 50))
    }
  }, [settings])

  const handleConfigStart = async (config: ScraperConfig) => {
    setRunning(true)
    setConfigOpen(false)
    try {
      await triggerNow({
        dateWindowDays: Number(config.dateWindowDays),
        selectedSports: [config.selectedSport],
        matchLimit: Number(config.matchLimit),
      })
      toast.success("Scraper started")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start")
    } finally {
      setRunning(false)
    }
  }

  if (!overview) {
    return <SmallLoader />
  }

  // Calculate metrics
  const totalRuns = overview.runs.length
  const successfulRuns = overview.runs.filter((r: any) => r.status === "success").length
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
          disabled={running || isCurrentlyRunning}
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

      {/* Live Logs (when running) */}
      {isCurrentlyRunning && (
        <div className="flex flex-col gap-3 border border-border rounded-lg bg-card p-3 sm:p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Live Logs</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Running</span>
            </span>
          </div>
          <div className="bg-black/5 dark:bg-black/20 font-mono text-[10px] sm:text-[11px] h-32 overflow-y-auto space-y-1 rounded-md p-2 sm:p-3">
            <div className="text-muted-foreground">[INFO] Starting run for Soccer...</div>
            <div className="text-muted-foreground">[INFO] Fetching matches...</div>
            <div className="text-muted-foreground">[INFO] Discovered 247 matches</div>
          </div>
        </div>
      )}

      {/* Runs Table */}
      {overview.runs.length > 0 && (
        <div className="space-y-3 border border-border rounded-lg bg-card p-3 sm:p-4 shadow-sm">
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
                {overview.runs.slice(0, 10).map((run: any) => {
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
            {overview.runs.slice(0, 10).map((run: any) => {
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
    </div>
  )
}
