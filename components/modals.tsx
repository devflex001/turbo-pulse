"use client"

import * as React from "react"
import { useBetStore } from "@/hooks/use-bet-store"
import { useAuth } from "@/lib/auth/AuthContext"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CopyIcon, CheckIcon, Loader2, Eye, EyeOff } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Validation helpers for Kenyan numbers (supports 07..., 01..., +254..., 254...)
function isValidKenyanPhone(phone: string): boolean {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  return regex.test(phone.trim())
}

function normalizeKenyanPhone(phone: string): string {
  const regex = /^(?:\+254|254|0)?([71]\d{8})$/
  const match = phone.trim().match(regex)
  if (match) {
    return `+254${match[1]}`
  }
  return phone.trim()
}

export function LoginModal({ open, onOpenChange }: ModalProps) {
  const { login } = useAuth()
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Success! Close modal
      toast.success("Welcome back!")
      onOpenChange(false)
      setPhone("")
      setPassword("")

      // Redirect admins to admin panel
      if (role === "admin" && typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/admin"
        }, 500)
      }
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : "Failed to log in. Please check your credentials."
      toast.error(errMsg)
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Login to BetFlexx"
      description="Enter your registered phone number and password to access your account."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-muted-foreground"
            htmlFor="login-phone"
          >
            Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="login-phone"
            type="tel"
            placeholder="e.g. 0712345678"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
            disabled={isSubmitting}
            required
            className="focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              className="block text-xs font-semibold text-muted-foreground"
              htmlFor="login-password"
            >
              Password <span className="text-destructive">*</span>
            </label>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-[11px] text-muted-foreground hover:text-foreground hover:no-underline"
              onClick={() => {
                toast.info(
                  "Password reset request simulated. If this number is registered, you will receive an SMS."
                )
              }}
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              disabled={isSubmitting}
              required
              className="pr-9 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary font-semibold text-primary-foreground hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

export function RegisterModal({ open, onOpenChange }: ModalProps) {
  const { register } = useAuth()
  const [phone, setPhone] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error("Please enter a phone number")
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
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    try {
      setIsSubmitting(true)
      const role = await register(phone, password)

      toast.success("Account created successfully! Welcome to BetFlexx.")
      onOpenChange(false)
      setPhone("")
      setPassword("")
      setConfirmPassword("")
      // Don't reload or redirect - auth context is already updated
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : "Failed to create account. Phone number might be already registered."
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Join BetFlexx"
      description="Create an account to start tracking your bets and managing your insights."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-muted-foreground"
            htmlFor="reg-phone"
          >
            M-Pesa Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="reg-phone"
            type="tel"
            placeholder="e.g. 0712345678"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
            disabled={isSubmitting}
            required
            className="focus-visible:ring-primary"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="block text-xs font-semibold text-muted-foreground"
              htmlFor="reg-password"
            >
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                disabled={isSubmitting}
                required
                className="pr-9 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label
              className="block text-xs font-semibold text-muted-foreground"
              htmlFor="reg-confirm-password"
            >
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={isSubmitting}
                required
                className="pr-9 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 pt-1">
          <input
            id="reg-terms"
            type="checkbox"
            required
            className="mt-0.5 size-3.5 cursor-pointer rounded border-muted bg-muted/40 accent-primary focus:ring-primary"
          />
          <label
            htmlFor="reg-terms"
            className="cursor-pointer text-[11px] leading-normal text-muted-foreground select-none"
          >
            I agree to the{" "}
            <Button
              type="button"
              variant="link"
              className="inline h-auto p-0 text-[11px] font-semibold text-foreground hover:underline"
              onClick={() =>
                toast.info(
                  "Terms of Service: Play responsibly. Mock platform is for testing purposes only."
                )
              }
            >
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button
              type="button"
              variant="link"
              className="inline h-auto p-0 text-[11px] font-semibold text-foreground hover:underline"
              onClick={() =>
                toast.info(
                  "Privacy Policy: Your data is secure and will never be shared."
                )
              }
            >
              Privacy Policy
            </Button>
            .
          </label>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary font-semibold text-primary-foreground hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

export function DepositModal({ open, onOpenChange }: ModalProps) {
  const [amount, setAmount] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      toast.error("Minimum deposit amount is KES 10")
      return
    }
    if (!isValidKenyanPhone(phone)) {
      toast.error("Please enter a valid M-Pesa phone number (e.g. 0712345678)")
      return
    }

    setIsSubmitting(true)
    onOpenChange(false)
    setAmount("")
    setIsSubmitting(false)
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="M-Pesa Deposit"
      description="Enter your M-Pesa details. You will receive an STK push prompt on your mobile phone."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-muted-foreground"
            htmlFor="dep-amount"
          >
            Amount (KES) <span className="text-destructive">*</span>
          </label>
          <Input
            id="dep-amount"
            type="number"
            min="10"
            placeholder="e.g. 500"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
            disabled={isSubmitting}
            required
            className="focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-muted-foreground"
            htmlFor="dep-phone"
          >
            M-Pesa Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            id="dep-phone"
            type="tel"
            placeholder="e.g. 0712345678"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
            disabled={isSubmitting}
            required
            className="focus-visible:ring-primary"
          />
        </div>
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary font-semibold text-primary-foreground hover:opacity-90"
          >
            {isSubmitting ? "Processing..." : "Deposit Instantly"}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

export function WithdrawModal({ open, onOpenChange }: ModalProps) {
  const { walletBalance, user } = useBetStore()
  const [amount, setAmount] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const createTx = useMutation(api.bets.createTransaction)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 50) {
      toast.error("Minimum withdrawal is KES 50")
      return
    }
    if (parsedAmount > walletBalance) {
      toast.error("Insufficient balance in wallet")
      return
    }

    try {
      setIsSubmitting(true)
      await createTx({
        type: "withdrawal",
        amount: parsedAmount,
        phone: user?.username || "Self",
        status: "success"
      })
      toast.success(
        `Successfully withdrew KES ${parsedAmount.toLocaleString()} to your registered number!`
      )
      onOpenChange(false)
      setAmount("")
    } catch {
      toast.error("Failed to process withdrawal. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Withdraw Winnings"
      description={`Withdraw your winnings directly to your M-Pesa mobile number. (Available: KES ${walletBalance.toLocaleString()})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-2">
          <label
            className="block text-xs font-semibold text-muted-foreground"
            htmlFor="with-amount"
          >
            Amount (KES) <span className="text-destructive">*</span>
          </label>
          <Input
            id="with-amount"
            type="number"
            min="50"
            placeholder="e.g. 250"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAmount(e.target.value)
            }
            disabled={isSubmitting}
            required
            className="focus-visible:ring-primary"
          />
        </div>
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary font-semibold text-primary-foreground hover:opacity-90"
          >
            {isSubmitting ? "Processing..." : "Withdraw Now"}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

interface ShareModalProps extends ModalProps {
  matchName: string
}

export function ShareModal({ open, onOpenChange, matchName }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false)
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://betflexx.com/user"

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl + "?ref=share_match")
    setCopied(true)
    toast.success("Match link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Share Match Details"
      description={`Share the live odds and details for ${matchName} with your friends.`}
    >
      <div className="space-y-4 py-2">
        <div className="flex items-center space-x-2">
          <Input
            value={`${shareUrl}?ref=share_match`}
            readOnly
            className="flex-1 text-xs focus-visible:ring-primary"
          />
          <Button onClick={handleCopy} size="icon" variant="outline">
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="pt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}
