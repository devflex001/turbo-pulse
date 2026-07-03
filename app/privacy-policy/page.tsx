import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Betflexx',
  description: 'Learn how Betflexx protects your privacy and handles your personal data.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2>1. Introduction</h2>
          <p>
            Betflexx is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and process your personal data in connection with our website, mobile application, and related services.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect personal information in various ways, including:</p>
          <ul>
            <li><strong>Account Registration:</strong> Name, email, phone number, date of birth, address</li>
            <li><strong>Payment Information:</strong> Bank account details, payment card information</li>
            <li><strong>Device Information:</strong> Device type, operating system, IP address</li>
            <li><strong>Usage Data:</strong> Interactions with our Service, pages visited, time spent</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use collected information for:</p>
          <ul>
            <li>Creating and managing your account</li>
            <li>Processing deposits and withdrawals</li>
            <li>Verifying your identity and preventing fraud</li>
            <li>Providing customer support</li>
            <li>Personalizing your experience</li>
            <li>Complying with legal obligations</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            Betflexx implements comprehensive security measures including 256-bit SSL/TLS encryption, secure password hashing, and regular security audits to protect your personal data.
          </p>

          <h2>5. Third-Party Sharing</h2>
          <p>
            We may share your information with payment processors, verification services, and legal authorities when required by law. We do not sell your personal data.
          </p>

          <h2>6. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate information</li>
            <li>Right to request deletion of your data</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Typically, we retain information for 7 years after account closure.
          </p>

          <h2>8. Cookies and Tracking</h2>
          <p>
            We use cookies to remember preferences, track analytics, and improve our Service. You can control cookies through your browser settings.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            Betflexx may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy on our website.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            For questions about our Privacy Policy, contact us at privacy@betflexx.com
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            © 2024 Betflexx. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
