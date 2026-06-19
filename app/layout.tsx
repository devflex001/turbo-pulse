import { Geist_Mono, Figtree, Roboto } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BetStoreProvider } from "@/hooks/use-bet-store"
import { AuthProvider } from "@/components/auth-provider"
import { ConvexProvider } from "@/components/convex-provider"
import { RoleRedirectHandler } from "@/components/role-redirect-handler"
import { AuthErrorBoundary } from "@/components/auth-error-boundary"

const robotoHeading = Roboto({subsets:['latin'],variable:'--font-heading'});

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'})

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
          <AuthErrorBoundary>
            <AuthProvider>
              <ConvexProvider>
                <BetStoreProvider>
                  <RoleRedirectHandler />
                  <TooltipProvider>
                    {children}
                    <Toaster richColors position="top-right"/>
                  </TooltipProvider>
                </BetStoreProvider>
              </ConvexProvider>
            </AuthProvider>
          </AuthErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
