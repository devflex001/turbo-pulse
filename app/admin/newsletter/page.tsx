"use client"

import { AdminLayout } from "@/components/admin-layout"
import { Sparkles } from "lucide-react"

export default function NewsletterPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
        <div className="p-4 bg-muted rounded-full">
          <Sparkles className="size-8 text-primary" />
        </div>
        <h2 className="text-sm font-bold text-foreground">Newsletter Panel</h2>
        <p className="text-xs max-w-sm">
          This section is under construction. Manage newsletters and communications here.
        </p>
      </div>
    </AdminLayout>
  )
}
