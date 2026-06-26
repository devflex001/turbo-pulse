import { Geist_Mono, Figtree, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BetStoreProvider } from "@/hooks/use-bet-store"
import { ConvexProvider } from "@/components/convex-provider"

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
                <div className="flex flex-col">
                  {children}
                </div>
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </BetStoreProvider>
          </ConvexProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
