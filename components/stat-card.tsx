import { Badge } from "@/components/ui/badge"
import { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  icon?: ReactNode
}

export function StatCard({ label, value, subtitle, badge, icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 p-2 sm:p-3 rounded-lg bg-card border border-border shadow-sm min-w-0">
      <div className="flex items-start justify-between gap-1 min-w-0">
        <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate">
          {label}
        </span>
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1 flex-wrap min-w-0">
        <span className="text-sm sm:text-xl font-bold font-mono leading-none truncate text-foreground">
          {value}
        </span>
        {badge && (
          <Badge
            variant="outline"
            className={`text-[8px] sm:text-[9px] font-semibold bg-blue-500/10 text-blue-600 border-none px-1 rounded-sm flex-shrink-0 ${badge.variant === "secondary" ? "bg-yellow-500/10 text-yellow-600" : ""
              } ${badge.variant === "destructive" ? "bg-red-500/10 text-red-600" : ""
              } ${badge.variant === "default" ? "bg-green-500/10 text-green-600" : ""
              }`}
          >
            {badge.label}
          </Badge>
        )}
      </div>
    </div>
  )
}
