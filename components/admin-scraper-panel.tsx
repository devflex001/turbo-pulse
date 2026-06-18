"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { PlayCircle, Save, Terminal } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScraperTerminal } from "@/components/scraper-terminal"

const AVAILABLE_SPORTS = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
  { id: "volleyball", label: "Volleyball" },
  { id: "american_football", label: "American Football" },
  { id: "ice_hockey", label: "Ice Hockey" },
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

  const [enabledOverride, setEnabledOverride] = React.useState<boolean | null>(null)
  const [cadenceMinutesOverride, setCadenceMinutesOverride] = React.useState<string | null>(null)
  const [dateWindowDaysOverride, setDateWindowDaysOverride] = React.useState<string | null>(null)
  const [selectedSportsOverride, setSelectedSportsOverride] = React.useState<string[] | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("settings")

  const settings = overview?.settings
  const enabled = enabledOverride ?? settings?.enabled ?? true
  const cadenceMinutes =
    cadenceMinutesOverride ?? String(settings?.cadenceMinutes ?? 5)
  const dateWindowDays =
    dateWindowDaysOverride ?? String(settings?.dateWindowDays ?? 2)
  const selectedSports = selectedSportsOverride ?? (settings as any)?.selectedSports ?? ["football"]

  const currentRun = overview?.runs?.[0]
  const isCurrentlyRunning = currentRun?.status === "running"

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({
        enabled,
        cadenceMinutes: Number(cadenceMinutes),
        dateWindowDays: Number(dateWindowDays),
        selectedSports,
      })
      setEnabledOverride(null)
      setCadenceMinutesOverride(null)
      setDateWindowDaysOverride(null)
      setSelectedSportsOverride(null)
      toast.success("Scraper settings saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    setActiveTab("logs")
    try {
      await triggerNow({})
      toast.success("Scraper run queued")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to queue scraper")
    } finally {
      setRunning(false)
    }
  }

  const toggleSport = (sportId: string) => {
    const current = selectedSports as string[]
    if (current.includes(sportId)) {
      setSelectedSportsOverride(current.filter((s: string) => s !== sportId))
    } else {
      setSelectedSportsOverride([...current, sportId])
    }
  }

  if (!overview) {
    return <SmallLoader />
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">Sports Scraper</h1>
        <p className="text-xs text-muted-foreground">
          Manage fixture ingestion and real-time monitoring.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="settings" className="text-xs h-8">Settings</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs h-8 flex items-center gap-1.5">
            <Terminal className="size-3" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs h-8">History</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="border border-border rounded-lg bg-card p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Configuration</h2>
                <p className="text-xs text-muted-foreground">Manage scraper behavior and scheduling.</p>
              </div>
              <Badge variant={enabled ? "default" : "secondary"} className="text-[10px] uppercase">
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            {/* Main Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="scraper-enabled">
                  Status
                </label>
                <Button
                  id="scraper-enabled"
                  type="button"
                  variant={enabled ? "default" : "outline"}
                  className="w-full h-9 text-xs font-semibold"
                  onClick={() => setEnabledOverride(!enabled)}
                >
                  {enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="cadence">
                  Cadence (min)
                </label>
                <Input
                  id="cadence"
                  type="number"
                  min="1"
                  max="120"
                  value={cadenceMinutes}
                  onChange={(event) => setCadenceMinutesOverride(event.target.value)}
                  className="h-9 text-xs focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="window">
                  Window (days)
                </label>
                <Input
                  id="window"
                  type="number"
                  min="1"
                  max="14"
                  value={dateWindowDays}
                  onChange={(event) => setDateWindowDaysOverride(event.target.value)}
                  className="h-9 text-xs focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Sports Selection */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="text-xs font-semibold">Sports</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_SPORTS.map((sport) => (
                  <Button
                    key={sport.id}
                    type="button"
                    variant={selectedSports.includes(sport.id) ? "default" : "outline"}
                    className="h-8 text-xs font-semibold"
                    onClick={() => toggleSport(sport.id)}
                  >
                    {sport.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current State */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Last Run</p>
                <p className="text-xs font-mono font-semibold mt-0.5">{formatTime(overview.settings.lastRunAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Next Run</p>
                <p className="text-xs font-mono font-semibold mt-0.5">{formatTime(overview.settings.nextRunAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Source</p>
                <p className="text-xs font-mono font-semibold mt-0.5">{overview.settings.source}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <Button 
                size="sm" 
                className="h-8 text-xs font-semibold gap-1.5" 
                onClick={handleSave} 
                disabled={saving}
              >
                <Save className="size-3.5" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs font-semibold gap-1.5" 
                onClick={handleRunNow} 
                disabled={running || isCurrentlyRunning}
              >
                <PlayCircle className="size-3.5" />
                {running || isCurrentlyRunning ? "Running..." : "Run Now"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="space-y-2">
            <h2 className="text-sm font-bold">Live Activity Log</h2>
            <p className="text-xs text-muted-foreground">
              Real-time monitoring of scraper operations.
            </p>
          </div>
          <ScraperTerminal runId={currentRun?._id ?? null} isRunning={isCurrentlyRunning} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-bold">Recent Runs</h2>
            </div>

            {overview.runs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead className="border-b border-border text-muted-foreground text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-2">Started</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Trigger</th>
                      <th className="px-4 py-2">Sports</th>
                      <th className="px-4 py-2">Matches</th>
                      <th className="px-4 py-2">Markets</th>
                      <th className="px-4 py-2">Odds</th>
                      <th className="px-4 py-2">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {overview.runs.map((run) => (
                      <tr key={run._id}>
                        <td className="px-4 py-3 font-medium">{formatTime(run.startedAt)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={run.status === "success" ? "default" : run.status === "running" ? "secondary" : "destructive"}
                            className="text-[10px] uppercase"
                          >
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">{run.triggeredBy}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex gap-1 flex-wrap">
                            {run.selectedSports?.map((sport) => (
                              <Badge key={sport} variant="outline" className="text-[10px]">
                                {sport}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{run.matchesUpserted}/{run.matchesDiscovered}</td>
                        <td className="px-4 py-3 font-mono text-xs">{run.marketsUpserted}</td>
                        <td className="px-4 py-3 font-mono text-xs">{run.oddsUpserted}</td>
                        <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground text-xs">
                          {run.errorSummary || (run.failedMatches ? `${run.failedMatches} failed` : "None")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No scrape runs recorded yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
