"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

export default function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const redirectTo = searchParams.get("redirect") || "/"

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!phone.trim()) {
      toast.error("Please enter your phone number")
      return
    }

    if (!isValidKenyanPhone(phone)) {
      toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      setIsSubmitting(true)
      const role = await login(phone, password)
      toast.success("Welcome back!")

      if (role === "admin") {
        router.replace("/admin")
        return
      }

      router.replace(redirectTo)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to log in. Please check your credentials."
      )
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-block">
            <img src="/images/logo.png" alt="BetFlexx Logo" className="mx-auto h-12 w-auto" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Log in to BetFlexx</h1>
          <p className="text-sm text-muted-foreground">
            Enter your phone number and password to access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="login-phone"
              className="block text-xs font-semibold text-muted-foreground"
            >
              Phone Number <span className="text-destructive">*</span>
            </label>
            <Input
              id="login-phone"
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isSubmitting}
              required
              className="focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-muted-foreground"
            >
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                required
                className="pr-10 focus-visible:ring-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-9 hover:bg-transparent"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/" className="font-semibold text-primary hover:underline">
            Sign up on the homepage
          </Link>
        </p>
      </div>
    </div>
  )
}
