import { Metadata } from 'next';
import { LegalLayout } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Data Collection | Betflexx Privacy Policy',
  description: 'Learn what personal data Betflexx collects.',
};

const sections = [
  { id: 'overview', title: 'Overview', href: '/privacy-policy' },
  { id: 'collection', title: 'Data Collection', href: '/privacy-policy/collection' },
  { id: 'usage', title: 'Data Usage', href: '/privacy-policy/usage' },
  { id: 'security', title: 'Security', href: '/privacy-policy/security' },
  { id: 'sharing', title: 'Data Sharing', href: '/privacy-policy/sharing' },
  { id: 'rights', title: 'Your Rights', href: '/privacy-policy/rights' },
  { id: 'retention', title: 'Data Retention', href: '/privacy-policy/retention' },
  { id: 'cookies', title: 'Cookies & Tracking', href: '/privacy-policy/cookies' },
  { id: 'children', title: 'Children', href: '/privacy-policy/children' },
  { id: 'contact', title: 'Contact Us', href: '/privacy-policy/contact' },
];

export default function DataCollectionPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Understand how Betflexx collects, uses, and protects your personal data."
      currentPage="collection"
      sections={sections}
    >
      <section className="space-y-6">
        <div>
          <h2>1. Information We Collect</h2>
          <p>
            Betflexx collects various types of information to provide our services, improve your experience, and comply with legal obligations.
          </p>
        </div>

        <div>
          <h3>1.1 Information You Provide Directly</h3>
          <p>
            We collect information that you voluntarily provide to us, including:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, address, and nationality</li>
            <li><strong>Identification Documents:</strong> Government-issued ID, proof of address, and other verification documents</li>
            <li><strong>Payment Information:</strong> Bank account details, M-Pesa number, payment card information (processed securely)</li>
            <li><strong>Profile Data:</strong> Username, profile picture, betting preferences, and account settings</li>
            <li><strong>Communication:</strong> Messages sent through support chat, emails, and customer service inquiries</li>
            <li><strong>Verification Data:</strong> Information provided during know-your-customer (KYC) processes</li>
          </ul>
        </div>

        <div>
          <h3>1.2 Information Collected Automatically</h3>
          <p>
            When you use Betflexx, we automatically collect certain technical information:
          </p>
          <ul>
            <li><strong>Device Information:</strong> Device type, operating system, device ID, unique identifiers</li>
            <li><strong>Connection Data:</strong> IP address, ISP, browser type, browser version</li>
            <li><strong>Usage Information:</strong> Pages visited, time spent on pages, links clicked, search queries</li>
            <li><strong>Session Data:</strong> Session duration, frequency of visits, referring URLs</li>
            <li><strong>Location Data:</strong> Approximate geographic location based on IP address</li>
            <li><strong>Behavioral Data:</strong> Betting patterns, sports preferences, click patterns</li>
          </ul>
        </div>

        <div>
          <h3>1.3 Information from Third Parties</h3>
          <p>
            We may receive information about you from:
          </p>
          <ul>
            <li><strong>Payment Processors:</strong> Transaction confirmations, payment status, fraud indicators</li>
            <li><strong>Verification Services:</strong> Identity verification results, address confirmation, fraud checks</li>
            <li><strong>Financial Institutions:</strong> Account verification, sanctions checking results</li>
            <li><strong>Analytics Partners:</strong> User behavior data, traffic patterns, engagement metrics</li>
            <li><strong>Referral Partners:</strong> Information when you're referred by another user</li>
          </ul>
        </div>

        <div>
          <h3>1.4 Cookies and Similar Technologies</h3>
          <p>
            We use cookies, web beacons, pixels, and similar tracking technologies to collect information about your browsing activities and preferences. This includes:
          </p>
          <ul>
            <li>Session cookies that help us remember you during your visit</li>
            <li>Persistent cookies that remember your preferences for future visits</li>
            <li>Analytics cookies that track how you use our platform</li>
            <li>Marketing cookies that help us show you relevant content</li>
          </ul>
        </div>

        <div>
          <h3>1.5 Sensitive Personal Data</h3>
          <p>
            In limited circumstances, we may collect sensitive personal data including:
          </p>
          <ul>
            <li>Government-issued identification numbers</li>
            <li>Financial information for verification purposes</li>
            <li>Information indicating self-exclusion or gambling concerns</li>
          </ul>
          <p>
            We only collect this data where necessary to comply with legal obligations or for account verification purposes.
          </p>
        </div>

        <div>
          <h3>1.6 Children's Information</h3>
          <p>
            Betflexx does not knowingly collect information from children under 18 years of age. If we become aware that we have collected information from a minor, we will delete such information immediately.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
