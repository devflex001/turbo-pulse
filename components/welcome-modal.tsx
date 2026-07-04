"use client"

import * as React from "react"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Karibu BetFlexx!"
      description="Welcome to your winning journey"
    >
      <div className="space-y-6 py-4">
        {/* Decorative top accent */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">New Member</span>
          </div>
        </div>

        {/* Main message */}
        <div className="space-y-4 text-center">
          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
              Big wins start with bold picks
            </h2>
            <p className="text-sm text-muted-foreground">
              Your next bet could be the one that changes everything.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Main CTA message */}
          <p className="text-base font-medium text-foreground leading-relaxed">
            All the best!
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <FeatureItem icon="⚡" label="Fast" />
          <FeatureItem icon="🎯" label="Accurate" />
          <FeatureItem icon="🏆" label="Rewarding" />
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onOpenChange(false)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
        >
          Let's Get Started
        </Button>

        {/* Footer message */}
        <p className="text-xs text-center text-muted-foreground">
          Powered by <span className="font-semibold">FLexx</span> Systems
        </p>
      </div>
    </ResponsiveModal>
  )
}

function FeatureItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  )
}
