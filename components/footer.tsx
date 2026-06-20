import Link from "next/link"

const sections = [
  {
    title: "Product",
    links: [
      { label: "Live Markets", href: "/markets" },
      { label: "My Bets", href: "/my-bets" },
      { label: "Deposit", href: "/deposit" },
      { label: "Withdraw", href: "/withdraw" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "FAQs", href: "/#faqs" },
      { label: "Contact", href: "mailto:support@betflexx.com" },
      { label: "Security", href: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/" },
      { label: "Privacy", href: "/" },
      { label: "Responsible Gaming", href: "/" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-10 sm:px-6 lg:px-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))] items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">BetFlexx</h2>
              <p className="max-w-xl leading-7 text-muted-foreground">
                A polished sports betting simulation platform built for reliable market access, intuitive account management,
                and transparent settlement workflows.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                "Live odds",
                "Fast deposits",
                "Secure wallets",
                "Smart bet history",
                "Mobile-first UX",
                "Data-driven insight",
              ].map((item) => (
                <span key={item} className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-foreground"
                      target={link.href.startsWith("mailto:") ? "_self" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-muted-foreground">
            © 2026 BetFlexx. Simulated sportsbook interface for demo and analytics. Always play responsibly.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/" className="transition-colors hover:text-foreground">
              Site map
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
