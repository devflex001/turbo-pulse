"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Eye, EyeOff, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function CustomEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [isSaving, setIsSaving] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

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

  // Form state
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

      await updateEvent({
        eventId: eventId as Id<"customEvents">,
        title: formData.title,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        sport: formData.sport,
        competition: formData.competition,
        startTime: startTimeMs,
      })

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

  const togglePublish = async () => {
    const isPublished = event?.status === "published"
    try {
      if (isPublished) {
        await unpublishEvent({ eventId: eventId as Id<"customEvents"> })
        toast.success("Event unpublished")
      } else {
        await publishEvent({ eventId: eventId as Id<"customEvents"> })
        toast.success("Event published")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    }
  }

  const handleDelete = async () => {
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
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  const oddsbyMarket = markets.reduce(
    (acc, market) => {
      acc[market._id] = odds.filter((o) => o.marketId === market._id)
      return acc
    },
    {} as Record<string, any[]>
  )

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 -ml-2"
              onClick={handleBack}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{formData.title || "Event"}</h1>
              <p className="text-xs text-muted-foreground">
                {formData.homeTeam} vs {formData.awayTeam}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {event.status === "published" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-2 text-xs"
                onClick={togglePublish}
              >
                <EyeOff className="size-3.5" />
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-2 text-xs"
                onClick={togglePublish}
              >
                <Eye className="size-3.5" />
                Publish
              </Button>
            )}

            {event.status === "draft" && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The event will be permanently deleted.
                  </AlertDialogDescription>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel className="h-8">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-2 text-xs"
            >
              <Save className="size-3.5" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Event Basics */}
          <div className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Title *</label>
                <Input
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Home Team *</label>
                <Input
                  placeholder="Home team"
                  value={formData.homeTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, homeTeam: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Away Team *</label>
                <Input
                  placeholder="Away team"
                  value={formData.awayTeam}
                  onChange={(e) =>
                    setFormData({ ...formData, awayTeam: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Sport</label>
                <Input
                  placeholder="e.g. football"
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value })
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Competition</label>
                <Input
                  placeholder="e.g. Premier League"
                  value={formData.competition}
                  onChange={(e) =>
                    setFormData({ ...formData, competition: e.target.value })
                  }
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Score</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Home</label>
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
                  className="h-9 text-center text-lg font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Away</label>
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
                  className="h-9 text-center text-lg font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Markets and Odds */}
          {markets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Markets & Odds</h3>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {markets.map((market) => {
                  const marketOdds = oddsbyMarket[market._id] || []
                  if (marketOdds.length === 0) return null

                  return (
                    <div key={market._id} className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {market.name}
                      </p>
                      <div className="grid gap-2">
                        {marketOdds.map((odd) => (
                          <div
                            key={odd._id}
                            className="flex items-center gap-3 bg-background rounded p-2.5 border"
                          >
                            <label className="text-xs font-medium flex-1 min-w-0">
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
                              className="h-8 text-sm text-right w-20 font-semibold"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 mt-2" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
