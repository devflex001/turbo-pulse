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
import { ArrowLeft, Save, Send, Trash2, EyeOff, Calendar, Trophy, MapPin } from "lucide-react"
import { SmallLoader } from "@/components/small-loader"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CustomEventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  const [isEditing, setIsEditing] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const event = useQuery(api.customEvents.getCustomEvent, {
    eventId: eventId as Id<"customEvents">,
  })

  const updateEvent = useMutation(api.customEvents.updateCustomEvent)
  const updateScore = useMutation(api.customEvents.updateCustomEventScore)
  const publishEvent = useMutation(api.customEvents.publishCustomEvent)
  const unpublishEvent = useMutation(api.customEvents.unpublishCustomEvent)
  const deleteEvent = useMutation(api.customEvents.deleteCustomEvent)

  // Form state for editing
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    homeTeam: "",
    awayTeam: "",
    sport: "",
    competition: "",
    startTime: "",
    homeScore: 0,
    awayScore: 0,
  })

  // Initialize form when event loads
  React.useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
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
        description: formData.description || undefined,
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

      toast.success("Event updated successfully")
      setIsEditing(false)
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

  if (!event) {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with back button and title only */}
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
            <div>
              <h1 className="text-lg font-bold tracking-tight">Edit Event</h1>
              <p className="text-xs text-muted-foreground">
                Modify event details and settings
              </p>
            </div>
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
                onClick={handleUnpublish}
              >
                <EyeOff className="size-3" />
                Unpublish
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handlePublish}
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
                onClick={handleDelete}
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
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Compact, visually impressive edit form */}
        <div className="rounded-lg border border-border bg-card">
          {/* Event Title - Prominent */}
          <div className="border-b border-border bg-muted/20 p-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Event Title</label>
              <Input
                placeholder="e.g., Champions League Final 2024"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="text-lg font-semibold h-12"
              />
            </div>
          </div>

          {/* Main event data in a grid layout */}
          <div className="p-6 space-y-6">
            {/* Teams and Score Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Trophy className="size-4" />
                Match Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Home Team</label>
                    <Input
                      placeholder="e.g., Manchester United"
                      value={formData.homeTeam}
                      onChange={(e) =>
                        setFormData({ ...formData, homeTeam: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Home Score</label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.homeScore}
                      onChange={(e) =>
                        setFormData({ ...formData, homeScore: parseInt(e.target.value) || 0 })
                      }
                      className="text-center text-lg font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Away Team</label>
                    <Input
                      placeholder="e.g., Arsenal"
                      value={formData.awayTeam}
                      onChange={(e) =>
                        setFormData({ ...formData, awayTeam: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Away Score</label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.awayScore}
                      onChange={(e) =>
                        setFormData({ ...formData, awayScore: parseInt(e.target.value) || 0 })
                      }
                      className="text-center text-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Visual score display */}
              <div className="flex items-center justify-center p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-4 text-2xl font-mono font-bold">
                  <span className="text-muted-foreground">{formData.homeTeam || "Home"}</span>
                  <span className="px-4 py-2 rounded-md bg-primary/10 text-primary">
                    {formData.homeScore} - {formData.awayScore}
                  </span>
                  <span className="text-muted-foreground">{formData.awayTeam || "Away"}</span>
                </div>
              </div>
            </div>

            {/* Event Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="size-4" />
                Event Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sport</label>
                  <Input
                    placeholder="e.g., Football"
                    value={formData.sport}
                    onChange={(e) =>
                      setFormData({ ...formData, sport: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Competition</label>
                  <Input
                    placeholder="e.g., Premier League"
                    value={formData.competition}
                    onChange={(e) =>
                      setFormData({ ...formData, competition: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="size-3" />
                    Start Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Optional event description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="min-h-20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
