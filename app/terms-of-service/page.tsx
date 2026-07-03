import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Betflexx',
  description: 'Comprehensive terms of service governing the use of Betflexx platform and services.',
};

export default function TermsOfService() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">Legal Document</span>
            </div>
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-4">Terms of Service</h1>
              <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-3xl">
                Comprehensive terms governing your use of Betflexx platform, services, and all associated features.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">Updated</span>
                <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="h-4 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">Effective</span>
                <span>January 1, 2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border/50 bg-accent/20 backdrop-blur-sm p-8">
          <h2 className="text-lg font-bold text-foreground mb-6">Table of Contents</h2>
          <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <a href="#agreement" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 1. Agreement to Terms</a>
            <a href="#license" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 2. Use License</a>
            <a href="#restrictions" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 3. Restrictions</a>
            <a href="#betting" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 4. Betting Terms</a>
            <a href="#accounts" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 5. User Accounts</a>
            <a href="#conduct" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 6. User Conduct</a>
            <a href="#liability" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 7. Liability</a>
            <a href="#termination" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 8. Termination</a>
            <a href="#governing" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 9. Governing Law</a>
            <a href="#contact" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 10. Contact</a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {/* Section 1 */}
          <section id="agreement" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">1. Agreement to Terms</h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              By accessing and using Betflexx, you agree to be bound by these Terms of Service. If you do not agree to abide by these Terms in their entirety, you are not authorized to use Betflexx.
            </p>
            <div className="border-l-4 border-primary/50 pl-4 py-2">
              <h3 className="font-semibold text-foreground text-sm mb-2">Legal Capacity</h3>
              <p className="text-xs text-muted-foreground">You must be at least 18 years of age and have the legal capacity to enter into this agreement.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="license" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">2. Use License</h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              Permission is granted to use Betflexx for personal, non-commercial purposes only. You may not:
            </p>
            <div className="grid gap-2">
              {[
                "Modify or copy materials without authorization",
                "Use materials for commercial purposes",
                "Attempt to reverse engineer any software",
                "Remove copyright or proprietary notations",
                "Transfer or mirror materials on other servers"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section id="restrictions" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">3. User Restrictions</h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              Betflexx cannot be used by persons prohibited by law from using online gambling services.
            </p>
            <div className="rounded-lg border border-border/50 bg-accent/20 p-6">
              <div className="space-y-2">
                {[
                  "Persons under 18 years of age",
                  "Residents of prohibited jurisdictions",
                  "Persons subject to sanctions or on watchlists",
                  "Persons with active self-exclusion orders",
                  "Persons previously banned from Betflexx"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-primary font-bold">✕</span>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="betting" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">4. Betting Terms & Conditions</h2>
            </div>
            <div className="grid gap-4">
              {[
                {
                  title: "Bet Finality",
                  desc: "All bets are final once placed and confirmed. No modifications or cancellations allowed."
                },
                {
                  title: "Odds & Pricing",
                  desc: "Odds are guaranteed only at the moment you place your bet and are subject to change."
                },
                {
                  title: "Deposits",
                  desc: "Non-refundable except where required by law. Processed immediately upon authorization."
                },
                {
                  title: "Withdrawals",
                  desc: "Processed to original payment method within 24-48 hours. Subject to verification holds."
                }
              ].map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground mb-2 text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section id="accounts" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">5. User Accounts</h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              Your account is personal to you. You are responsible for maintaining confidentiality of credentials and all account activity.
            </p>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground text-sm mb-3">Account Security Requirements</h3>
                {[
                  "Provide accurate and complete information",
                  "Pass identity verification and KYC checks",
                  "Maintain password confidentiality",
                  "Accept responsibility for all account activities",
                  "One account per person only"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="conduct" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">6. User Conduct & Prohibited Activities</h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              You agree not to engage in the following prohibited activities:
            </p>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Fraud or collusion",
                  "Market manipulation",
                  "Automated betting systems",
                  "Money laundering",
                  "Harassment or abuse",
                  "Security attacks",
                  "Account sharing",
                  "Bonus exploitation"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-destructive font-bold">✕</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="liability" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">7. Disclaimers & Liability Limitations</h2>
            </div>
            <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 p-4 rounded">
              <p className="text-sm text-muted-foreground leading-6">
                The materials on Betflexx are provided on an "AS IS" basis. We disclaim all warranties and are not liable for damages arising from your use of the service.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="termination" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">8. Termination of Access</h2>
            </div>
            <p className="text-base leading-7 text-muted-foreground">
              Betflexx may terminate or suspend your account immediately for violation of these terms or any applicable law.
            </p>
          </section>

          {/* Section 9 */}
          <section id="governing" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">9. Governing Law</h2>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-6">
              <p className="text-sm text-muted-foreground mb-4">
                These Terms are governed by the laws of Kenya. You irrevocably submit to the exclusive jurisdiction of courts in Nairobi.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="contact" className="scroll-mt-20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-3xl font-bold text-foreground">10. Contact Information</h2>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { label: "Email", value: "legal@betflexx.com" },
                  { label: "Support", value: "support@betflexx.com" },
                  { label: "Phone", value: "+254 700 000 000" },
                  { label: "Address", value: "Nairobi, Kenya" }
                ].map((item, idx) => (
                  <div key={idx}>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">{item.label}</span>
                    <p className="text-sm text-foreground font-medium mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-border pt-8 mt-12">
            <p className="text-xs text-muted-foreground leading-6">
              © {currentYear} Betflexx. All rights reserved. This Terms of Service is a binding legal document between you and Betflexx. By using Betflexx, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions contained herein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
