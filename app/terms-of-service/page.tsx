import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Betflexx',
  description: 'Read our comprehensive terms of service and legal agreement.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using Betflexx, you agree to be bound by these Terms of Service. If you do not agree, please do not use this service.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download materials on Betflexx for personal, non-commercial viewing only. You may not modify, copy, distribute, or use the materials for any commercial purpose.
          </p>

          <h2>3. Disclaimer of Warranties</h2>
          <p>
            THE MATERIALS ON BETFLEXX ARE PROVIDED ON AN AS IS BASIS. BETFLEXX MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS ALL WARRANTIES.
          </p>

          <h2>4. Limitations of Liability</h2>
          <p>
            In no event shall Betflexx be liable for any damages arising from your use of or inability to use the materials or services.
          </p>

          <h2>5. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account information. You agree to accept responsibility for all activities under your account.
          </p>

          <h2>6. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Post unlawful or threatening content</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Engage in fraud or deception</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass or threaten other users</li>
          </ul>

          <h2>7. Payment Terms</h2>
          <p>
            All bets are final once placed. We reserve the right to void any bets that violate these terms. Deposits are non-refundable except where required by law.
          </p>

          <h2>8. Age Restrictions</h2>
          <p>
            You must be at least 18 years of age to use Betflexx. By using our service, you warrant that you meet these age requirements.
          </p>

          <h2>9. Responsible Gambling</h2>
          <p>
            Betflexx is committed to responsible gambling. We provide tools to help manage your betting activity. If you have gambling concerns, contact our support team or seek assistance from gambling support organizations.
          </p>

          <h2>10. Intellectual Property</h2>
          <p>
            All content on Betflexx, including text, graphics, logos, and software, is the property of Betflexx or its content suppliers and protected by copyright laws.
          </p>

          <h2>11. Termination</h2>
          <p>
            Betflexx may terminate your account immediately for any reason, including breach of these terms. Upon termination, your right to use the service ends immediately.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms of Service are governed by the laws of the jurisdiction in which Betflexx operates.
          </p>

          <h2>13. Contact Information</h2>
          <p>
            For questions about these Terms of Service, contact us at legal@betflexx.com
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            © 2024 Betflexx. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
