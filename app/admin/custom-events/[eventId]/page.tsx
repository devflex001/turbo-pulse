"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, Trash2, EyeOff } from "lucide-react"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function CustomEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [isSaving, setIsSaving] = React.useState(false)

  const event = useQuery(api.customEvents.getCustomEvent, {
    eventId: eventId as Id<"customEvents">,
  })

  const markets = useQuery(api.customEvents.listCustomMarkets, {
    eventId: eventId as Id<"customEvents">,
  })

  const odds = useQuery(api.customEvents.listCustomOddsByEvent, {
    eventId: eventId as Id<"customEvents">,
  })

  const updateEvent = useMutation(api.customEvents.updateCustomEvent)
  const updateScore = useMutation(api.customEvents.updateCustomEventScore)
  const updateOdds = useMutation(api.customEvents.updateCustomOdds)
  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const unpublishEvent = useMutation(api.customEvents.unpublishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)

  // Form state for editing
  const [formData, setFormData] = React.useState({
    title: "",
    homeTeam: "",
    awayTeam: "",
    sport: "",
    competition: "",
    startTime: "",
    homeScore: 0,
    awayScore: 0,
  })

  // Odds editing state
  const [oddsEdits, setOddsEdits] = React.useState<Record<string, number>>({})

  // Initialize form when event loads
  React.useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        homeTeam: event.homeTeam || "",
        awayTeam: event.awayTeam || "",
        sport: event.sport || "",
        competition: event.competition || "",
        startTime: new Date(event.startTime).toISOString().slice(0, 16),
        homeScore: event.homeScore || 0,
        awayScore: event.awayScore || 0,
      })
    }
  }, [event])

  const handleBack = () => {
    router.push("/admin/custom-events")
  }

  const handleSave = async () => {
    if (
      !formData.title ||
      !formData.homeTeam ||
      !formData.awayTeam ||
      !formData.startTime
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const startTimeMs = new Date(formData.startTime).getTime()
      if (isNaN(startTimeMs)) {
        toast.error("Invalid date/time")
        return
      }

      // Update basic info
      await updateEvent({
        eventId: eventId as Id<"customEvents">,
        title: formData.title,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        sport: formData.sport,
        competition: formData.competition,
        startTime: startTimeMs,
      })

      // Update score if changed
      if (
        formData.homeScore !== (event?.homeScore || 0) ||
        formData.awayScore !== (event?.awayScore || 0)
      ) {
        await updateScore({
          eventId: eventId as Id<"customEvents">,
          homeScore: formData.homeScore,
          awayScore: formData.awayScore,
        })
      }

      // Update odds edits
      const oddEdits = Object.entries(oddsEdits)
      for (const [oddId, oddValue] of oddEdits) {
        await updateOdds({
          oddId: oddId as Id<"customOdds">,
          oddValue,
        })
      }
      setOddsEdits({})

      toast.success("Event updated successfully")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update event"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm("Publish this event? It will be visible to users.")) return

    try {
      await publishEvent({ eventId: eventId as Id<"customEvents"> })
      toast.success("Event published successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish")
    }
  }

  const handleUnpublish = async () => {
    if (
      !confirm("Unpublish this event? It will no longer be visible to users.")
    )
      return

    try {
      await unpublishEvent({ eventId: eventId as Id<"customEvents"> })
      toast.success("Event unpublished")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unpublish"
      )
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return

    try {
      await deleteEvent({ eventId: eventId as Id<"customEvents"> })
      toast.success("Event deleted")
      handleBack()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete")
    }
  }

  if (!event || !markets || !odds) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
          </div>
          <SmallLoader />
        </div>
      </AdminLayout>
    )
  }

  // Group odds by market for easier display
  const oddsbyMarket = markets.reduce(
    (acc, market) => {
      acc[market._id] = odds.filter((o) => o.marketId === market._id)
      return acc
    },
    {} as Record<string, any[]>
  )

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
            <h1 className="text-lg font-bold">Edit Event</h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={event.status === "published" ? "default" : "secondary"}>
              {event.status}
            </Badge>

            {event.status === "published" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={async () => {
                  try {
                    await unpublishEvent({
                      eventId: eventId as Id<"customEvents">,
                    })
                    toast.success("Event unpublished")
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to unpublish"
                    )
                  }
                }}
              >
                <EyeOff className="size-3" />
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={async () => {
                  if (!confirm("Publish this event?")) return
                  try {
                    await publishEvent({
                      eventId: eventId as Id<"customEvents">,
                    })
                    toast.success("Event published")
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to publish"
                    )
                  }
                }}
              >
                <Send className="size-3" />
                Publish
              </Button>
            )}

            {event.status === "draft" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!confirm("Delete this event?")) return
                  try {
                    await deleteEvent({
                      eventId: eventId as Id<"customEvents">,
                    })
                    toast.success("Event deleted")
                    handleBack()
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Failed to delete"
                    )
                  }
                }}
              >
                <Trash2 className="size-3" />
                Delete
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1.5 text-xs"
            >
              <Save className="size-3" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Event Details - Organized Sections */}
        <div className="space-y-6">
          {/* Primary Info */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Event Information</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Title
                </label>
                <Input
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Teams Info */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Teams</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Home Team
                </label>
                <Input
                  placeholder="Home team"
                  value={formData.homeTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, homeTeam: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Away Team
                </label>
                <Input
                  placeholder="Away team"
                  value={formData.awayTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, awayTeam: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sport & Competition */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Category</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Sport
                </label>
                <Input
                  placeholder="Sport"
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Competition
                </label>
                <Input
                  placeholder="Competition"
                  value={formData.competition}
                  onChange={(e) =>
                    setFormData({ ...formData, competition: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Score</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Home Score
                </label>
                <Input
                  type="number"
                  min={0}
                  value={formData.homeScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      homeScore: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-sm text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Away Score
                </label>
                <Input
                  type="number"
                  min={0}
                  value={formData.awayScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      awayScore: parseInt(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-sm text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Markets and Odds */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Markets & Odds</h2>
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="space-y-0">
              {markets.map((market) => {
                const marketOdds = oddsbyMarket[market._id] || []

                return (
                  <div key={market._id} className="border-b last:border-b-0">
                    <div className="bg-muted/50 px-3 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">{market.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {market.marketType}
                          </p>
                        </div>
                      </div>
                    </div>
                    {marketOdds.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        No odds available
                      </div>
                    ) : (
                      <div className="space-y-2 p-3">
                        {marketOdds.map((odd) => (
                          <div
                            key={odd._id}
                            className="flex items-center justify-between gap-2"
                          >
                            <label className="text-xs font-medium min-w-fit">
                              {odd.outcomeName}
                            </label>
                            <Input
                              type="number"
                              step={0.01}
                              min={1}
                              value={
                                oddsEdits[odd._id as any] ?? odd.oddValue
                              }
                              onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val)) {
                                  setOddsEdits({
                                    ...oddsEdits,
                                    [odd._id]: val,
                                  })
                                }
                              }}
                              className="h-7 text-xs text-right w-20"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
