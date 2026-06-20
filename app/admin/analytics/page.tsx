"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Sparkles } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
        <div className="p-4 bg-muted rounded-full">
          <Sparkles className="size-8 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Analytics Panel</h2>
        <p className="text-xs max-w-sm">
          This section is under construction. View detailed analytics and insights here.
        </p>
      </div>
    </AdminLayout>
  )
}
