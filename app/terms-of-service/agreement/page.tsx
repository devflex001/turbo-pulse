import { Metadata } from 'next';
import { LegalLayout } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Agreement to Terms | Betflexx Terms of Service',
  description: 'Read about the legal agreement governing Betflexx use.',
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

export default function AgreementPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Please read these terms carefully before using Betflexx."
      currentPage="agreement"
      sections={sections}
    >
      <section className="space-y-6">
        <div>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing, browsing, and using Betflexx, including our website located at www.betflexx.com, our mobile applications, and all associated services, features, and functionality (collectively, the "Service"), you agree to be bound by these Terms of Service. If you do not agree to abide by these Terms in their entirety, you are not authorized to use Betflexx.
          </p>
        </div>

        <div>
          <h3>1.1 Legal Capacity</h3>
          <p>
            You represent and warrant that you have the legal capacity to enter into these Terms and that you are at least 18 years of age (or the age of majority in your jurisdiction). If you do not meet these requirements, you must not use Betflexx.
          </p>
        </div>

        <div>
          <h3>1.2 Authority</h3>
          <p>
            You represent that you have full authority and capacity to enter into this agreement and that entering into these Terms does not violate any other agreement, law, or regulation applicable to you.
          </p>
        </div>

        <div>
          <h3>1.3 Modifications to Terms</h3>
          <p>
            Betflexx reserves the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of Betflexx following the posting of revised Terms constitutes your acceptance of those modifications. If you do not agree to the modified Terms, you must discontinue your use of Betflexx.
          </p>
        </div>

        <div>
          <h3>1.4 Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and Betflexx regarding your use of the Service and supersede all prior negotiations, representations, and agreements, whether written or oral.
          </p>
        </div>

        <div>
          <h3>1.5 Severability</h3>
          <p>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be reformed to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall remain in full force and effect.
          </p>
        </div>

        <div>
          <h3>1.6 Binding Nature</h3>
          <p>
            These Terms create a binding legal contract between you and Betflexx. By using Betflexx, you acknowledge that you have read these Terms, understand them, and agree to be bound by all their terms and conditions.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
