import { Metadata } from 'next';
import { LegalLayout } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'User Accounts | Betflexx Terms of Service',
  description: 'Read Betflexx user account terms and responsibilities.',
};

const sections = [
  { id: 'overview', title: 'Overview', href: '/terms-of-service' },
  { id: 'agreement', title: 'Agreement to Terms', href: '/terms-of-service/agreement' },
  { id: 'use-license', title: 'Use License', href: '/terms-of-service/use-license' },
  { id: 'restrictions', title: 'Restrictions', href: '/terms-of-service/restrictions' },
  { id: 'betting', title: 'Betting Terms', href: '/terms-of-service/betting' },
  { id: 'accounts', title: 'User Accounts', href: '/terms-of-service/accounts' },
  { id: 'conduct', title: 'User Conduct', href: '/terms-of-service/conduct' },
  { id: 'liability', title: 'Liability', href: '/terms-of-service/liability' },
  { id: 'termination', title: 'Termination', href: '/terms-of-service/termination' },
  { id: 'governing-law', title: 'Governing Law', href: '/terms-of-service/governing-law' },
];

export default function AccountsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Please read these terms carefully before using Betflexx."
      currentPage="accounts"
      sections={sections}
    >
      <section className="space-y-6">
        <div>
          <h2>6. User Accounts</h2>
          <p>
            Your Betflexx account is personal to you and subject to strict security and usage requirements.
          </p>
        </div>

        <div>
          <h3>6.1 Account Registration</h3>
          <p>
            To create a Betflexx account, you must:
          </p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information as needed</li>
            <li>Agree to these Terms and our Privacy Policy</li>
            <li>Pass any required verification or identity checks</li>
          </ul>
        </div>

        <div>
          <h3>6.2 Account Credentials</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account password and login credentials. You agree to:
          </p>
          <ul>
            <li>Not share your credentials with anyone</li>
            <li>Notify Betflexx immediately of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Ensure you log out from shared computers</li>
          </ul>
        </div>

        <div>
          <h3>6.3 Account Verification</h3>
          <p>
            Betflexx may require you to verify your identity, address, payment method, and source of funds at any time. You agree to provide accurate documentation and information as requested. Failure to complete verification may result in account suspension or closure.
          </p>
        </div>

        <div>
          <h3>6.4 Account Restrictions</h3>
          <p>
            You may only maintain one active Betflexx account. Creating multiple accounts is prohibited and may result in suspension or closure of all accounts associated with you. We use sophisticated detection methods to identify account abuse.
          </p>
        </div>

        <div>
          <h3>6.5 Personal Information</h3>
          <p>
            You warrant that all information you provide is accurate, truthful, and not misleading. You must immediately update any information that changes, including contact details, payment methods, and personal information used for verification.
          </p>
        </div>

        <div>
          <h3>6.6 Account Access</h3>
          <p>
            We may suspend or restrict access to your account at any time if we suspect:
          </p>
          <ul>
            <li>Unauthorized or fraudulent activity</li>
            <li>Violation of these Terms</li>
            <li>Underage access</li>
            <li>Use from restricted jurisdictions</li>
            <li>Money laundering or sanctions violations</li>
          </ul>
        </div>

        <div>
          <h3>6.7 Account Closure</h3>
          <p>
            You may request to close your account at any time by contacting support@betflexx.com. We will process your request and return any remaining balance within 5-7 business days. Account closure is permanent and cannot be reversed.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
