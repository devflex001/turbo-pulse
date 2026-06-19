"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthClient } from "@/lib/auth-client";

export default function AuthPage() {
  const router = useRouter();
  const { signIn } = useAuthClient();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || !password) {
      toast.error("Phone and password are required");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(phone, password);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Signed in successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border border-border rounded-lg bg-card p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Sign In
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your phone number and password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Phone Input */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-semibold text-muted-foreground block"
            >
              Phone Number <span className="text-destructive">*</span>
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              className="w-full focus-visible:ring-primary"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-muted-foreground block"
            >
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pr-9 focus-visible:ring-primary"
                required
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

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-semibold h-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>By signing in, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}
