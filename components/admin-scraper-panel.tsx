"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
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
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          subtitle={`${successfulRuns} of ${totalRuns}`}
        />
        <StatCard label="Total Runs" value={totalRuns} subtitle="All time" />
        <StatCard
          label="Last Run"
          value={formatTime(overview.settings.lastRunAt)}
          badge={
            currentRun
              ? {
                label: currentRun.status,
                variant:
                  currentRun.status === "success"
                    ? "default"
                    : currentRun.status === "running"
                      ? "secondary"
                      : "destructive",
              }
              : undefined
          }
        />
      </div>

      {/* Live Logs (when running) */}
      {isCurrentlyRunning && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Live Logs</CardTitle>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Running</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-black/5 dark:bg-black/20 font-mono text-[11px] h-32 overflow-y-auto space-y-1 rounded-md p-3">
              <div className="text-muted-foreground">[INFO] Starting run for Soccer...</div>
              <div className="text-muted-foreground">[INFO] Fetching matches...</div>
              <div className="text-muted-foreground">[INFO] Discovered 247 matches</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Runs Table */}
      {overview.runs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Run History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/30 text-muted-foreground text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">Time</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold">Sport</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Duration</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Discovered</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Saved</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Markets</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Odds</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {overview.runs.slice(0, 10).map((run: any) => {
                    const sportNames = (run.selectedSports || [])
                      .map((sportId: string | number) => {
                        const sport = AVAILABLE_SPORTS.find(s => String(s.id) === String(sportId))
                        return sport?.label || String(sportId)
                      })
                      .join(", ")

                    return (
                      <tr key={run._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          {formatTime(run.startedAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              run.status === "success"
                                ? "default"
                                : run.status === "running"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-[9px] uppercase"
                          >
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{sportNames || "—"}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                          {formatDuration(run.durationMs)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium">
                          {run.matchesDiscovered}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium">
                          {run.matchesUpserted}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium">
                          {run.marketsUpserted}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium">
                          {run.oddsUpserted}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
