"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { PlayCircle } from "lucide-react"
import { ScraperConfigDrawer, type ScraperConfig } from "@/components/scraper-config-drawer"

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

export function AdminScraperPanel() {
  const overview = useQuery(api.scraper.getAdminOverview)
  const updateSettings = useMutation(api.scraper.updateSettings)
  const triggerNow = useMutation(api.scraper.triggerNow)

  const [configOpen, setConfigOpen] = React.useState(false)
  const [selectedSport, setSelectedSport] = React.useState<string>("1")
  const [dateWindowDays, setDateWindowDays] = React.useState<string>("2")
  const [matchLimit, setMatchLimit] = React.useState<string>("50")
  const [saving, setSaving] = React.useState(false)
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

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        enabled: true,
        cadenceMinutes: 5,
        dateWindowDays: Number(dateWindowDays),
        selectedSports: [selectedSport],
        matchLimit: Number(matchLimit),
      })
      toast.success("Settings saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

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

  const sportLabel = AVAILABLE_SPORTS.find(s => String(s.id) === selectedSport)?.label || "Soccer"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">Sports Scraper</h1>
          <p className="text-xs text-muted-foreground">Manage KwikBet fixture ingestion</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isCurrentlyRunning ? "secondary" : "outline"} className="text-[10px] uppercase">
            {isCurrentlyRunning ? "● Running" : "● Idle"}
          </Badge>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5"
            onClick={() => setConfigOpen(true)}
            disabled={running || isCurrentlyRunning}
          >
            <PlayCircle className="size-3.5" />
            Run
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border rounded-md p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Last Run</p>
          <p className="text-xs font-medium">{formatTime(overview.settings.lastRunAt)}</p>
        </div>

        <div className="border rounded-md p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Sport</p>
          <p className="text-xs font-medium">{sportLabel}</p>
        </div>

        <div className="border rounded-md p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Date Range</p>
          <p className="text-xs font-medium">{dateWindowDays} day(s)</p>
        </div>

        <div className="border rounded-md p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Mode</p>
          <p className="text-xs font-medium">On-Demand</p>
        </div>
      </div>

      {/* Latest Run Summary */}
      {currentRun && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50">
            <p className="text-sm font-semibold">Latest Run</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Started {formatTime(currentRun.startedAt)}
                </span>
                <Badge
                  variant={
                    currentRun.status === "success"
                      ? "default"
                      : currentRun.status === "running"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-[10px] uppercase"
                >
                  {currentRun.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="border rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Discovered</p>
                  <p className="text-sm font-semibold font-mono">{currentRun.matchesDiscovered}</p>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Saved</p>
                  <p className="text-sm font-semibold font-mono">{currentRun.matchesUpserted}</p>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Markets</p>
                  <p className="text-sm font-semibold font-mono">{currentRun.marketsUpserted}</p>
                </div>
                <div className="border rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Odds</p>
                  <p className="text-sm font-semibold font-mono">{currentRun.oddsUpserted}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Runs */}
      {overview.runs.length > 1 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/50">
            <p className="text-sm font-semibold">Recent Runs</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b bg-muted/30 text-muted-foreground text-[10px] uppercase">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Time</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Sport</th>
                  <th className="px-4 py-2 text-right font-semibold">Matches</th>
                  <th className="px-4 py-2 text-right font-semibold">Markets</th>
                  <th className="px-4 py-2 text-right font-semibold">Odds</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {overview.runs.slice(1, 10).map((run: any) => {
                  const sportNames = (run.selectedSports || [])
                    .map((sportId: string | number) => {
                      const sport = AVAILABLE_SPORTS.find(s => String(s.id) === String(sportId))
                      return sport?.label || String(sportId)
                    })
                    .join(", ")

                  return (
                    <tr key={run._id} className="hover:bg-muted/30">
                      <td className="px-4 py-2.5 font-mono">{formatTime(run.startedAt)}</td>
                      <td className="px-4 py-2.5">
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
                      <td className="px-4 py-2.5">{sportNames || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {run.matchesUpserted}/{run.matchesDiscovered}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{run.marketsUpserted}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{run.oddsUpserted}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
