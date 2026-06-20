"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ScraperConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStart: (config: ScraperConfig) => void
  isLoading?: boolean
  initialValues?: Partial<ScraperConfig>
}

export interface ScraperConfig {
  selectedSport: string
  dateWindowDays: string
  matchLimit: string
}

const AVAILABLE_SPORTS = [
  { id: "1", label: "Soccer" },
  { id: "2", label: "Basketball" },
  { id: "5", label: "Tennis" },
  { id: "16", label: "American Football" },
  { id: "21", label: "Cricket" },
  { id: "10", label: "Boxing" },
  { id: "117", label: "MMA" },
  { id: "12", label: "Rugby" },
]

const MATCH_LIMITS = [10, 20, 50, 100, 200, 300, 500]

export function ScraperConfigDrawer({
  open,
  onOpenChange,
  onStart,
  isLoading = false,
  initialValues,
}: ScraperConfigDrawerProps) {
  const [selectedSport, setSelectedSport] = React.useState(initialValues?.selectedSport ?? "1")
  const [dateWindowDays, setDateWindowDays] = React.useState(initialValues?.dateWindowDays ?? "2")
  const [matchLimit, setMatchLimit] = React.useState(initialValues?.matchLimit ?? "10")
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  React.useEffect(() => {
    if (initialValues) {
      setSelectedSport(initialValues.selectedSport ?? "1")
      setDateWindowDays(initialValues.dateWindowDays ?? "2")
      setMatchLimit(initialValues.matchLimit ?? "10")
    }
  }, [initialValues, open])

  const handleStart = () => {
    onStart({
      selectedSport,
      dateWindowDays,
      matchLimit,
    })
  }

  const content = (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold">Sport</label>
        <Select value={selectedSport} onValueChange={setSelectedSport} disabled={isLoading}>
          <SelectTrigger className="w-full h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_SPORTS.map((sport) => (
              <SelectItem key={sport.id} value={sport.id}>
                {sport.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold">Date Range (days)</label>
        <Input
          type="number"
          min="1"
          max="14"
          value={dateWindowDays}
          onChange={(e) => setDateWindowDays(e.target.value)}
          disabled={isLoading}
          className="w-full h-9"
        />
        <p className="text-[10px] text-muted-foreground">Number of days from today to fetch matches</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold">Match Limit (per day)</label>
        <Select value={matchLimit} onValueChange={setMatchLimit} disabled={isLoading}>
          <SelectTrigger className="w-full h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MATCH_LIMITS.map((limit) => (
              <SelectItem key={limit} value={String(limit)}>
                {limit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">Maximum matches to fetch per day</p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          size="sm"
          className="flex-1 h-9 text-xs"
        >
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          disabled={isLoading}
          size="sm"
          className="flex-1 h-9 text-xs font-semibold"
        >
          {isLoading ? "Starting..." : "Start Scrape"}
        </Button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-96 flex flex-col">
          <SheetHeader>
            <SheetTitle>Scraper Configuration</SheetTitle>
            <SheetDescription>
              Configure and start a fixture scrape run
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Scraper Configuration</DrawerTitle>
          <DrawerDescription>
            Configure and start a fixture scrape run
          </DrawerDescription>
        </DrawerHeader>
        <div className="pb-6">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
