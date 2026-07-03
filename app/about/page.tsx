import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Betflexx | Sports Betting Platform',
  description: 'Learn about Betflexx, the premier sports betting platform.',
};

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1>About Betflexx</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your premier destination for sports betting and live gaming.
            </p>
          </div>

          <section className="space-y-4">
            <h2>Our Mission</h2>
            <p>
              Betflexx is dedicated to providing the most exciting, secure, and fair sports betting experience. We're committed to innovation, transparency, and customer satisfaction.
            </p>
          </section>

          <section className="space-y-4">
            <h2>Why Choose Betflexx?</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Real-time odds and live betting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Secure and encrypted transactions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Wide variety of sports and events
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Fast and reliable withdrawals
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Responsive customer support
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2>Our Values</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-2 font-semibold">Integrity</h3>
                <p className="text-sm text-muted-foreground">We operate with transparency and honesty in all our dealings.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-2 font-semibold">Security</h3>
                <p className="text-sm text-muted-foreground">Your data and funds are protected with industry-leading security.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-2 font-semibold">Innovation</h3>
                <p className="text-sm text-muted-foreground">We constantly improve to deliver the best experience.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-2 font-semibold">Responsibility</h3>
                <p className="text-sm text-muted-foreground">We promote responsible gambling practices.</p>
              </div>
            </div>
          </section>

          <p className="mt-8 text-sm text-muted-foreground">
            © 2024 Betflexx. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
