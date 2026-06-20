"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CustomEventEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventToEdit?: any
  onSuccess?: () => void
}

interface MarketRow {
  id: Id<"customMarkets">
  name: string
  marketType: string
  marketTypes: string[]
  priority: number
  isActive: boolean
}

export function CustomEventEditor({
  open,
  onOpenChange,
  eventToEdit,
  onSuccess,
}: CustomEventEditorProps) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const createEvent = useMutation(api.customEvents.createCustomEvent)
  const updateEvent = useMutation(api.customEvents.updateCustomEvent)

  const [step, setStep] = React.useState<"basic">("basic")
  const [loading, setLoading] = React.useState(false)

  // Form state
  const [formData, setFormData] = React.useState({
    title: "",
    homeTeam: "",
    awayTeam: "",
    sport: "football",
    competition: "Custom League",
    description: "",
    startTime: "",
  })

  // Initialize form with event data when editing
  React.useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title || "",
        homeTeam: eventToEdit.homeTeam || "",
        awayTeam: eventToEdit.awayTeam || "",
        sport: eventToEdit.sport || "football",
        competition: eventToEdit.competition || "Custom League",
        description: eventToEdit.description || "",
        startTime: new Date(eventToEdit.startTime).toISOString().slice(0, 16),
      })
    } else {
      setFormData({
        title: "",
        homeTeam: "",
        awayTeam: "",
        sport: "football",
        competition: "Custom League",
        description: "",
        startTime: "",
      })
    }
  }, [eventToEdit, open])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const handleBasicSubmit = async () => {
    if (!formData.title || !formData.homeTeam || !formData.awayTeam || !formData.startTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const startTimeMs = new Date(formData.startTime).getTime();
      if (isNaN(startTimeMs)) {
        toast.error("Invalid date/time");
        return;
      }

      if (eventToEdit) {
        // Edit existing event
        await updateEvent({
          eventId: eventToEdit._id,
          title: formData.title,
          description: formData.description || undefined,
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          startTime: startTimeMs,
          sport: formData.sport,
          competition: formData.competition,
        });
        toast.success("Event updated successfully");
      } else {
        // Create new event
        const eventId = await createEvent({
          title: formData.title,
          description: formData.description || undefined,
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          startTime: startTimeMs,
          sport: formData.sport,
          competition: formData.competition,
        });
        toast.success("Event created successfully");
        // Navigate to the custom event detail page to configure markets and odds
        router.push(`/admin/custom-events/${eventId}`);
      }

      onOpenChange(false);
      setStep("basic");
      setFormData({
        title: "",
        homeTeam: "",
        awayTeam: "",
        sport: "football",
        competition: "Custom League",
        description: "",
        startTime: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold">Event Title *</label>
        <Input
          placeholder="e.g., Cup Final 2024"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold">Home Team *</label>
          <Input
            placeholder="e.g., Manchester United"
            value={formData.homeTeam}
            onChange={(e) => handleInputChange("homeTeam", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold">Away Team *</label>
          <Input
            placeholder="e.g., Arsenal"
            value={formData.awayTeam}
            onChange={(e) => handleInputChange("awayTeam", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold">Start Time *</label>
        <Input
          type="datetime-local"
          value={formData.startTime}
          onChange={(e) => handleInputChange("startTime", e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold">Sport</label>
          <Input
            placeholder="e.g., football"
            value={formData.sport}
            onChange={(e) => handleInputChange("sport", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold">Competition</label>
          <Input
            placeholder="e.g., Premier League"
            value={formData.competition}
            onChange={(e) => handleInputChange("competition", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold">Description</label>
        <Textarea
          placeholder="Optional event description..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className="h-20 text-sm resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleBasicSubmit}
          disabled={loading}
        >
          {loading ? (eventToEdit ? "Updating..." : "Creating...") : (eventToEdit ? "Update Event" : "Create Event")}
        </Button>
      </div>
    </div>
  );

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex flex-col gap-0 max-h-[85vh]">
          <DrawerHeader className="text-left px-6 pt-6 pb-3 border-b border-border bg-muted/20">
            <DrawerTitle className="text-lg font-bold">
              {eventToEdit ? "Edit Event" : "Create Custom Event"}
            </DrawerTitle>
            <DrawerDescription className="text-xs mt-1">
              {eventToEdit ? "Update event details and markets" : "Set up a new custom betting event"}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 pt-4 pb-8">
              {content}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop sheet (right-side modal)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 flex flex-col gap-0 p-0 border-l border-border">
        <SheetHeader className="px-6 pt-6 pb-3 border-b border-border bg-muted/20">
          <SheetTitle className="text-lg font-bold">
            {eventToEdit ? "Edit Event" : "Create Custom Event"}
          </SheetTitle>
          <SheetDescription className="text-xs mt-1">
            {eventToEdit ? "Update event details and markets" : "Set up a new custom betting event"}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pt-4 pb-8">
            {content}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
