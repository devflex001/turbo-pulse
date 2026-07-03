import { Metadata } from 'next';
import { AlertCircle, Heart, Phone, Users, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Responsible Gambling | Betflexx',
  description: 'Learn about responsible gambling and access support resources.',
};

export default function ResponsibleGambling() {
  const resources = [
    {
      icon: Phone,
      title: 'Gamblers Anonymous',
      description: 'Free support and meetings for people with gambling problems.',
      contact: '1-800-426-2537',
      link: 'https://www.gamblersanonymous.org',
    },
    {
      icon: Heart,
      title: 'National Council on Problem Gambling',
      description: 'Confidential helpline and resources.',
      contact: '1-800-522-4700',
      link: 'https://www.ncpg.org',
    },
    {
      icon: Users,
      title: 'NCPG Chat',
      description: 'Live chat support for gambling issues.',
      contact: 'Available 24/7',
      link: 'https://www.ncpg.org/chat',
    },
    {
      icon: BookOpen,
      title: 'BetheChange',
      description: 'Resources and support for problem gambling.',
      contact: 'Online resources',
      link: 'https://www.bethechange.org',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <h1>Responsible Gambling</h1>
          <p className="text-lg text-muted-foreground">
            Betflexx is committed to promoting safe and responsible gambling. We provide tools and resources to help you maintain control.
          </p>
        </div>

        <div className="space-y-12">
          {/* Warning Signs */}
          <section className="space-y-4">
            <h2>Warning Signs of Problem Gambling</h2>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
              <div className="mb-4 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">Are you gambling too much?</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Gambling more frequently or with larger amounts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Spending more time thinking about betting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Lying to family or friends about gambling
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Gambling to escape problems or emotions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Chasing losses by betting more
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Neglecting work, family, or hobbies
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-destructive">•</span>
                  Experiencing anxiety or depression related to gambling
                </li>
              </ul>
            </div>
          </section>

          {/* Tools & Features */}
          <section className="space-y-4">
            <h2>Responsible Gambling Tools</h2>
            <p>
              Betflexx provides several features to help you manage your gambling responsibly:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-accent/50 p-6">
                <h3 className="mb-2 font-semibold">Deposit Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Set daily, weekly, or monthly deposit limits to control spending. You can access this in your account settings.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/50 p-6">
                <h3 className="mb-2 font-semibold">Loss Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Set limits on how much you're willing to lose over a specific period.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/50 p-6">
                <h3 className="mb-2 font-semibold">Betting Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Restrict the maximum amount you can wager on individual bets.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/50 p-6">
                <h3 className="mb-2 font-semibold">Time Reminders</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications reminding you how long you've been betting.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/50 p-6">
                <h3 className="mb-2 font-semibold">Reality Checks</h3>
                <p className="text-sm text-muted-foreground">
                  Pop-up reminders about your gambling activity and session duration.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-accent/50 p-6">
                <h3 className="mb-2 font-semibold">Self-Exclusion</h3>
                <p className="text-sm text-muted-foreground">
                  Temporarily or permanently close your account and block access to betting.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="space-y-4">
            <h2>Responsible Gambling Best Practices</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold">Treat Betting as Entertainment</h3>
                <p className="text-sm text-muted-foreground">
                  Only bet money you can afford to lose. Think of it as the cost of entertainment, not a way to make money.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold">Set a Budget</h3>
                <p className="text-sm text-muted-foreground">
                  Decide how much money you'll spend before you start betting and stick to it.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold">Set Time Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Decide how long you'll bet for and take regular breaks to reassess.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold">Don't Chase Losses</h3>
                <p className="text-sm text-muted-foreground">
                  Accept losses and don't try to win back money by betting more. This typically leads to larger losses.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold">Avoid Betting When Stressed</h3>
                <p className="text-sm text-muted-foreground">
                  Don't use betting as a way to escape problems or deal with negative emotions.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-1 font-semibold">Keep It Social</h3>
                <p className="text-sm text-muted-foreground">
                  Bet with friends rather than alone, and discuss your betting habits openly.
                </p>
              </div>
            </div>
          </section>

          {/* Support Resources */}
          <section className="space-y-4">
            <h2>Get Help</h2>
            <p>
              If you or someone you know is struggling with gambling, please reach out for support. Help is available.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {resources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <a
                    key={resource.title}
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border bg-accent/50 p-6 transition-colors hover:bg-accent"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{resource.title}</h3>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{resource.description}</p>
                    <p className="text-sm font-medium text-primary">{resource.contact}</p>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Self-Exclusion */}
          <section className="space-y-4">
            <h2>Self-Exclusion Options</h2>
            <div className="rounded-lg border border-border bg-accent/50 p-6">
              <p className="mb-4 text-sm">
                If you need to take a break from betting, you can self-exclude from Betflexx. This will:
              </p>
              <ul className="mb-6 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Temporarily or permanently block your account
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Prevent you from accessing the platform
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Remove marketing communications
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Be reported to industry databases
                </li>
              </ul>
              <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
                Request Self-Exclusion
              </button>
            </div>
          </section>

          {/* Multi-Operator Exclusion */}
          <section className="space-y-4">
            <h2>Multi-Operator Self-Exclusion</h2>
            <div className="rounded-lg border border-border p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                You can register with industry-wide self-exclusion schemes that apply across multiple betting operators:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>NCPG:</strong>{' '}
                  <a href="https://www.gamcare.org.uk/services/national-self-exclusion-scheme/" target="_blank" className="text-primary hover:underline">
                    National Self-Exclusion Scheme
                  </a>
                </li>
                <li>
                  <strong>GameCare:</strong>{' '}
                  <a href="https://www.gamcare.org.uk" target="_blank" className="text-primary hover:underline">
                    Gambling Support Services
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact Support */}
          <section className="space-y-4 rounded-lg border border-border bg-accent/30 p-6">
            <h2>Need Support?</h2>
            <p className="text-sm text-muted-foreground">
              Our support team is here to help with any responsible gambling concerns. Contact us at:
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                Email:{' '}
                <a href="mailto:support@betflexx.com" className="text-primary hover:underline">
                  support@betflexx.com
                </a>
              </li>
              <li>
                Phone:{' '}
                <a href="tel:+15551234567" className="text-primary hover:underline">
                  +1 (555) 123-4567
                </a>
              </li>
            </ul>
          </section>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          © 2024 Betflexx. All rights reserved. Gambling should be fun and entertaining. If it stops being fun, it's time to get help.
        </p>
      </div>
    </div>
  );
}
