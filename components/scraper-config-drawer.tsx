"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/lib/useMediaQuery"

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
  const isDesktop = useMediaQuery("(min-width: 768px)")

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
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">Sport</label>
        <Select value={selectedSport} onValueChange={setSelectedSport} disabled={isLoading}>
          <SelectTrigger className="w-full">
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
        <label className="text-sm font-semibold">Date Range (days)</label>
        <Input
          type="number"
          min="1"
          max="14"
          value={dateWindowDays}
          onChange={(e) => setDateWindowDays(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Match Limit</label>
        <Select value={matchLimit} onValueChange={setMatchLimit} disabled={isLoading}>
          <SelectTrigger className="w-full">
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
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Starting..." : "Start Scrape"}
        </Button>
      </div>
    </div>
  )

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Scraper Configuration</DrawerTitle>
            <DrawerDescription>
              Configure and start a fixture scrape run
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scraper Configuration</DialogTitle>
          <DialogDescription>
            Configure and start a fixture scrape run
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
