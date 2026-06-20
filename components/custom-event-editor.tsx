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
  eventId?: Id<"customEvents">
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
  eventId,
}: CustomEventEditorProps) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 640px)")
  const createEvent = useMutation(api.customEvents.createCustomEvent)

  const [step, setStep] = React.useState<"basic" | "markets" | "review">("basic")
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const handleBasicSubmit = () => {
    if (!formData.title || !formData.homeTeam || !formData.awayTeam || !formData.startTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep("markets");
  }

  const handleCreateEvent = async () => {
    setLoading(true);
    try {
      const startTimeMs = new Date(formData.startTime).getTime();
      if (isNaN(startTimeMs)) {
        toast.error("Invalid date/time");
        return;
      }

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

      // Navigate to the custom event detail page to edit markets and odds
      router.push(`/admin/custom-events/${eventId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <div className="space-y-4">
      {step === "basic" && (
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
            >
              Next: Review Markets
            </Button>
          </div>
        </div>
      )}

      {step === "markets" && (
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm font-semibold mb-1">
              {formData.homeTeam} vs {formData.awayTeam}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.title} • {new Date(formData.startTime).toLocaleString()}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Pre-configured Markets (59)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              All markets are included by default. You can edit odds and deactivate markets after creating the event.
            </p>

            <ScrollArea className="h-64 border border-border rounded-lg p-3 space-y-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground mb-3">
                  Markets will be created from template
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• 1X2 and Double Chance (3 markets)</div>
                  <div>• Over/Under Goals (5 markets)</div>
                  <div>• Both Teams Score</div>
                  <div>• Handicap (-2 to +2)</div>
                  <div>• Correct Score (14 markets)</div>
                  <div>• First Half Markets (4)</div>
                  <div>• HT/FT Combinations (9)</div>
                  <div>• Goals Range (8)</div>
                  <div>• And more...</div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("basic")}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => setStep("review")}
            >
              Review & Create
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Title</div>
                <div className="font-semibold">{formData.title}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Matchup</div>
                <div className="font-semibold">{formData.homeTeam} vs {formData.awayTeam}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date & Time</div>
                <div className="font-semibold font-mono text-xs">
                  {new Date(formData.startTime).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sport / Competition</div>
                <div className="font-semibold text-xs">{formData.sport} / {formData.competition}</div>
              </div>
            </div>
            {formData.description && (
              <div>
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm">{formData.description}</div>
              </div>
            )}
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-400">59 markets</span>
              <span className="text-muted-foreground"> will be created from template. You can edit odds and settings after creation.</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep("basic")}
            >
              Edit Details
            </Button>
            <Button
              size="sm"
              onClick={handleCreateEvent}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex flex-col gap-0 max-h-[85vh]">
          <DrawerHeader className="text-left px-6 pt-6 pb-3 border-b border-border bg-muted/20">
            <DrawerTitle className="text-lg font-bold">
              {eventId ? "Edit Event" : "Create Custom Event"}
            </DrawerTitle>
            <DrawerDescription className="text-xs mt-1">
              {eventId ? "Update event details and markets" : "Set up a new custom betting event"}
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
            {eventId ? "Edit Event" : "Create Custom Event"}
          </SheetTitle>
          <SheetDescription className="text-xs mt-1">
            {eventId ? "Update event details and markets" : "Set up a new custom betting event"}
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
