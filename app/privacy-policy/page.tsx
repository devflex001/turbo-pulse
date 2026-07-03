import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Betflexx',
  description: 'Comprehensive privacy policy explaining how Betflexx handles your personal data.',
};

export default function PrivacyPolicy() {
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
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground mb-4">Privacy Policy</h1>
              <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-3xl">
                We are committed to protecting your privacy. This comprehensive policy explains how we collect, use, and safeguard your personal information.
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
            <a href="#intro" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 1. Introduction</a>
            <a href="#collection" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 2. Information We Collect</a>
            <a href="#usage" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 3. How We Use Information</a>
            <a href="#legal" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 4. Legal Basis</a>
            <a href="#sharing" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 5. Data Sharing</a>
            <a href="#security" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 6. Data Security</a>
            <a href="#retention" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 7. Data Retention</a>
            <a href="#cookies" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 8. Cookies</a>
            <a href="#rights" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 9. Your Rights</a>
            <a href="#contact" className="text-primary hover:text-primary/80 transition-colors font-medium">→ 10. Contact Us</a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {/* Section 1 */}
          <section id="intro" className="scroll-mt-20 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">1. Introduction</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                Betflexx ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process your personal data in connection with our website, mobile applications, and related services (collectively, the "Service").
              </p>
            </div>
            <div className="bg-accent/30 border border-border/50 rounded-lg p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                We take your privacy seriously and have implemented comprehensive measures to protect your personal information. This policy is designed to be transparent about our data practices while explaining your rights and choices.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="collection" className="scroll-mt-20 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">2. Information We Collect</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                Betflexx collects various types of information to provide our services, improve your experience, and comply with legal obligations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Information You Provide Directly</h3>
                <p className="text-sm text-muted-foreground mb-3">We collect information that you voluntarily provide to us, including:</p>
                <div className="grid gap-2">
                  {[
                    { label: "Account Information", desc: "Name, email, phone, date of birth, address, country, nationality" },
                    { label: "Identification Documents", desc: "Government-issued ID, proof of address, passport information" },
                    { label: "Payment Information", desc: "Bank account, M-Pesa number, payment card information (PCI-compliant)" },
                    { label: "Profile Data", desc: "Username, profile picture, betting preferences, account settings" }
                  ].map((item, idx) => (
                    <div key={idx} className="border border-border/30 rounded-lg p-4 bg-background/50">
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.label}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Information Collected Automatically</h3>
                <p className="text-sm text-muted-foreground mb-3">When you use Betflexx, we automatically collect certain technical and behavioral information:</p>
                <div className="grid gap-2">
                  {[
                    { label: "Device Information", desc: "Device type, OS, device ID, unique identifiers, hardware model" },
                    { label: "Connection Data", desc: "IP address, ISP, browser type, connection speed, network type" },
                    { label: "Usage Information", desc: "Pages visited, time spent, links clicked, search queries" },
                    { label: "Behavioral Data", desc: "Betting patterns, sports preferences, wager amounts, bet types" }
                  ].map((item, idx) => (
                    <div key={idx} className="border border-border/30 rounded-lg p-4 bg-background/50">
                      <h4 className="font-semibold text-foreground text-sm mb-1">{item.label}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="usage" className="scroll-mt-20 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">3. How We Use Your Information</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                We use the information we collect for legitimate business purposes and to provide you with the best possible service.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Service Delivery",
                  items: ["Account management", "Processing payments", "Settling bets", "Customer support"]
                },
                {
                  title: "Security & Compliance",
                  items: ["Identity verification", "Fraud prevention", "KYC/AML checks", "Regulatory compliance"]
                },
                {
                  title: "Service Improvement",
                  items: ["Usage analytics", "Personalization", "Feature testing", "Technical support"]
                },
                {
                  title: "Marketing",
                  items: ["Promotional emails", "Feature updates", "Offer notifications", "Campaign measurement"]
                }
              ].map((category, idx) => (
                <div key={idx} className="border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground mb-3 text-sm">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-primary/50"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section id="legal" className="scroll-mt-20 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">4. Legal Basis for Processing</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                We process your personal data based on one or more of the following legal grounds.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                { title: "Contract Performance", desc: "Providing services, executing bets, processing payments" },
                { title: "Legal Obligation", desc: "Compliance with KYC, AML, and gambling regulations" },
                { title: "Legitimate Interest", desc: "Fraud prevention, security, service improvement" },
                { title: "Consent", desc: "Marketing, analytics, non-essential cookies" }
              ].map((item, idx) => (
                <div key={idx} className="border-l-4 border-primary/50 pl-4 py-2">
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section id="sharing" className="scroll-mt-20 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">5. Data Sharing & Disclosure</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                We may share your personal information with third parties in limited circumstances.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-accent/20 p-6 space-y-4">
              {[
                { icon: "🔄", title: "Service Providers", desc: "Payment processors, hosting, analytics, customer support" },
                { icon: "⚖️", title: "Legal Authorities", desc: "Government agencies, regulators, law enforcement when required" },
                { icon: "🤝", title: "Business Partners", desc: "Affiliates, sports data providers, marketing partners" }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6 */}
          <section id="security" className="scroll-mt-20 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">6. Data Security</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                Betflexx implements comprehensive security measures to protect your personal data.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Encryption", value: "256-bit TLS/SSL & AES-256" },
                  { label: "Access Control", value: "RBAC, MFA, audit logs" },
                  { label: "Infrastructure", value: "Firewalls, DDoS protection, WAF" },
                  { label: "Monitoring", value: "24/7 threat detection & response" }
                ].map((item, idx) => (
                  <div key={idx}>
                    <h4 className="font-semibold text-foreground">{item.label}</h4>
                    <p className="text-muted-foreground text-xs mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="retention" className="scroll-mt-20 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">7. Data Retention</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                We retain your personal information for as long as necessary to provide services and comply with legal obligations.
              </p>
            </div>
            <div className="space-y-2">
              {[
                { category: "Account Information", period: "7 years after closure" },
                { category: "Transaction Data", period: "7 years for compliance" },
                { category: "Verification Documents", period: "7 years for AML" },
                { category: "Analytics Data", period: "12 months" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/50">
                  <span className="font-medium text-sm text-foreground">{item.category}</span>
                  <span className="text-xs text-primary font-semibold">{item.period}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 8 */}
          <section id="cookies" className="scroll-mt-20 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">8. Cookies & Tracking</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                We use cookies and similar technologies to enhance your experience.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="rights" className="scroll-mt-20 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">9. Your Privacy Rights</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                Depending on your location, you may have rights to access and control your personal data.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: "📋", title: "Right to Access", desc: "Request a copy of your data" },
                { icon: "✏️", title: "Right to Rectify", desc: "Correct inaccurate information" },
                { icon: "🗑️", title: "Right to Erase", desc: "Request deletion (with limits)" },
                { icon: "🛑", title: "Right to Restrict", desc: "Limit processing of your data" },
                { icon: "📤", title: "Data Portability", desc: "Get data in common format" },
                { icon: "🚫", title: "Right to Object", desc: "Opt out of processing" }
              ].map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 10 */}
          <section id="contact" className="scroll-mt-20 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                <h2 className="text-3xl font-bold text-foreground">10. Contact Us</h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                If you have questions about this Privacy Policy or our privacy practices, please contact us.
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { label: "Email", value: "privacy@betflexx.com" },
                  { label: "DPO", value: "dpo@betflexx.com" },
                  { label: "Support", value: "support@betflexx.com" },
                  { label: "Location", value: "Nairobi, Kenya" }
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
              © {currentYear} Betflexx. All rights reserved. This Privacy Policy is binding and governs the processing of your personal information. By using Betflexx, you acknowledge that you have read, understood, and agree to the terms and conditions of this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
