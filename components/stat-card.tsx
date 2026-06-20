import { Card, CardContent } from "@/components/ui/card"
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
    <Card size="sm">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
            {label}
          </p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className="text-xl font-semibold">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        {badge && (
          <Badge variant={badge.variant ?? "default"} className="w-fit text-[9px] uppercase">
            {badge.label}
          </Badge>
        )}
      </div>
    </Card>
  )
}
