import { Geist_Mono, Figtree, Roboto } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BetStoreProvider } from "@/hooks/use-bet-store"
import { ConvexProvider } from "@/components/convex-provider"
import { SupportChatWidget } from "@/components/support-chat-widget"
import { SuppressBeforeUnload } from "@/components/suppress-beforeunload"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://betflexx.com"

export const metadata: Metadata = {
  title: "Betflexx",
  description: "Your premier sports betting platform",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      {
        url: "/images/logo.png",
        sizes: "any",
      },
    ],
    apple: "/images/logo.png",
  },
  themeColor: "#008060",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Betflexx",
    description: "Your premier sports betting platform",
    url: siteUrl,
    siteName: "Betflexx",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "Betflexx",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Betflexx",
    description: "Your premier sports betting platform",
    images: ["/images/logo.png"],
  },
}

const robotoHeading = Roboto({ subsets: ['latin'], variable: '--font-heading' })

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable, robotoHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <ConvexProvider>
            <BetStoreProvider>
              <TooltipProvider>
                <SuppressBeforeUnload />
                <div className="flex flex-col">
                  {children}
                </div>
                <SupportChatWidget />
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </BetStoreProvider>
          </ConvexProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
