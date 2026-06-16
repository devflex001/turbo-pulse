"use client"

import * as React from "react"
import { useBetStore } from "@/hooks/use-bet-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  PlayCircle, 
  Flame, 
  PenTool, 
  History, 
  HelpCircle, 
  Info, 
  Mail, 
  Trophy, 
  Activity 
} from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { activeTab, setActiveTab, setSelectedSport } = useBetStore()

  const mainNavItems = [
    { id: "home", label: "Homepage", icon: Home },
    { id: "live", label: "Live Matches", icon: PlayCircle, badge: "LIVE", badgeColor: "bg-destructive text-destructive-foreground animate-pulse" },
    { id: "featured", label: "Featured Events", icon: Flame, badge: "NEW", badgeColor: "bg-primary text-primary-foreground" },
    { id: "custom", label: "Custom Events", icon: PenTool },
    { id: "mybets", label: "My Bets", icon: History },
  ]

  const sportsItems = [
    { id: "sport-football", label: "Football", count: 20 },
    { id: "sport-basketball", label: "Basketball", count: 12 },
    { id: "sport-tennis", label: "Tennis", count: 8 },
  ]

  const supportItems = [
    { id: "how-it-works", label: "How It Works", icon: Info },
    { id: "faqs", label: "FAQs", icon: HelpCircle },
    { id: "contact", label: "Contact Us", icon: Mail },
  ]

  const handleTabClick = (id: string) => {
    setActiveTab(id)
    if (id === "home") {
      setSelectedSport("all")
    } else if (id.startsWith("sport-")) {
      const sport = id.replace("sport-", "")
      setSelectedSport(sport)
      setActiveTab("home") // switch back to homepage main area with sport selected
    }
  }

  return (
    <aside className={cn("flex flex-col gap-6 py-6 border-r border-border h-full overflow-y-auto bg-card text-card-foreground shrink-0", className)}>
      <div className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">Navigation</h2>
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-between font-normal text-sm px-3 py-2 h-9",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold" 
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleTabClick(item.id)}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase", item.badgeColor)}>
                    {item.badge}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2 flex items-center gap-1.5">
          <Trophy className="size-3 text-muted-foreground" /> Popular Sports
        </h2>
        <div className="space-y-1">
          {sportsItems.map((sport) => {
            const isSportActive = activeTab === sport.id
            return (
              <Button
                key={sport.id}
                variant="ghost"
                className={cn(
                  "w-full justify-between font-normal text-sm px-3 py-2 h-9",
                  isSportActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold" 
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleTabClick(sport.id)}
              >
                <span className="flex items-center gap-2.5">
                  <Activity className="size-4 text-muted-foreground" />
                  {sport.label}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {sport.count}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="px-4 mt-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">Support</h2>
        <div className="space-y-1">
          {supportItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2.5 font-normal text-sm px-3 py-2 h-9",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold" 
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
