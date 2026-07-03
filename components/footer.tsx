'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Brand */}
          <div className="space-y-2">
            <h3 className="font-bold text-foreground">Betflexx</h3>
            <p className="text-xs text-muted-foreground">
              Fast deposits, instant withdrawals. Play responsibly.
            </p>
          </div>

          {/* Center: Links */}
          <div className="flex gap-6 text-xs">
            <Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/responsible-gambling" className="text-muted-foreground hover:text-foreground transition-colors">
              Responsible Gaming
            </Link>
            <a href="mailto:support@betflexx.com" className="text-muted-foreground hover:text-foreground transition-colors">
              Support
            </a>
          </div>

          {/* Right: Copyright */}
          <p className="text-xs text-muted-foreground">
            © {currentYear} Betflexx. 18+
          </p>
        </div>
      </div>
    </footer>
  );
}
