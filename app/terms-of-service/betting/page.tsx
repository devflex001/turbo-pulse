import { Metadata } from 'next';
import { LegalLayout } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Betting Terms | Betflexx Terms of Service',
  description: 'Read Betflexx betting terms and conditions.',
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

export default function BettingTermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Please read these terms carefully before using Betflexx."
      currentPage="betting"
      sections={sections}
    >
      <section className="space-y-6">
        <div>
          <h2>5. Betting Terms and Conditions</h2>
          <p>
            This section outlines the specific terms and conditions that apply to all betting activities on the Betflexx platform.
          </p>
        </div>

        <div>
          <h3>5.1 Bet Placement and Finality</h3>
          <p>
            All bets placed on Betflexx are final once submitted and confirmed. You cannot modify or cancel a bet after it has been placed, except in cases where Betflexx explicitly offers a cash-out feature or similar functionality. Betflexx is not responsible for bets placed in error.
          </p>
        </div>

        <div>
          <h3>5.2 Odds and Pricing</h3>
          <p>
            Odds are subject to change without notice and are guaranteed only at the moment you place your bet. If you place a bet before seeing the updated odds, you accept the odds at the time of placement. We reserve the right to correct obvious errors in odds display.
          </p>
        </div>

        <div>
          <h3>5.3 Bet Void and Voiding</h3>
          <p>
            Betflexx reserves the right to void any bet that violates these Terms, appears to involve fraud or manipulation, or is placed in breach of any applicable laws or regulations. Voided bets will be refunded in full.
          </p>
        </div>

        <div>
          <h3>5.4 Deposits and Funds</h3>
          <ul>
            <li>All deposits are made via approved payment methods only (M-Pesa, bank transfers, etc.)</li>
            <li>Deposits are processed and credited to your account immediately upon successful authorization</li>
            <li>Deposits are non-refundable except where required by law</li>
            <li>You are responsible for ensuring accurate payment details</li>
          </ul>
        </div>

        <div>
          <h3>5.5 Withdrawals</h3>
          <ul>
            <li>Withdrawals can only be made to the same payment method used for deposits</li>
            <li>Withdrawal requests are processed within 24-48 hours</li>
            <li>Betflexx may place temporary holds on withdrawals for verification purposes</li>
            <li>You must have sufficient verified funds in your account to withdraw</li>
          </ul>
        </div>

        <div>
          <h3>5.6 Betting Limits</h3>
          <p>
            Betflexx may impose maximum bet limits, minimum bet requirements, or other restrictions on betting amounts. These limits may vary by sport, event, market, or user account. We will inform you of applicable limits before you place a bet.
          </p>
        </div>

        <div>
          <h3>5.7 Settlement of Bets</h3>
          <p>
            Bets are settled based on the official results of the sporting event. If there is a dispute regarding the official result, we will defer to the governing body of the sport and their official decision. Settlement typically occurs within 24 hours of the event conclusion.
          </p>
        </div>

        <div>
          <h3>5.8 Responsible Gambling</h3>
          <p>
            Betflexx is committed to responsible gambling. We provide tools to help manage your betting activity, including deposit limits, loss limits, and self-exclusion options. If you believe you have a gambling problem, you must use these tools and seek assistance from gambling support organizations.
          </p>
        </div>

        <div>
          <h3>5.9 Bonus and Promotional Terms</h3>
          <p>
            Any bonuses, free bets, or promotional offers are subject to specific terms and conditions that will be clearly displayed at the time of offer. You must satisfy all conditions to claim any promotional benefits. Betflexx reserves the right to cancel or modify promotions at any time.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
