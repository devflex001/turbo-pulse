"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { openSupportChat } from "@/lib/support-chat"

export function Footer() {
  const pathname = usePathname()

  // Don't show footer in admin routes
  if (pathname?.startsWith("/admin")) {
    return null
  }

  return (
    <footer className="border-t border-border bg-card/50 px-4 py-8 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-7xl">
        {/* Main content - clean and compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Left: Brand info */}
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-foreground">BetFlexx</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Sports betting simulation. Always play responsibly.
            </p>
          </div>

          {/* Right: Quick links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <Link href="/#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="/#faqs" className="transition-colors hover:text-foreground">
              FAQs
            </Link>
            <button
              type="button"
              onClick={() => openSupportChat()}
              className="transition-colors hover:text-foreground"
            >
              Contact
            </button>
            <Link href="/" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/" className="transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="mt-6 border-t border-border/50 pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 BetFlexx. Simulated platform for demo and analytics.
          </p>
        </div>
      </div>
    </footer>
  )
}
