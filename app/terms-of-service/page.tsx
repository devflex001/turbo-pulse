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
      <div className="border-b border-border bg-gradient-to-b from-accent/50 to-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-4 text-base text-muted-foreground">
            Comprehensive terms governing your use of Betflexx platform and services
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert space-y-8">
          {/* Table of Contents */}
          <div className="rounded-lg border border-border bg-accent/30 p-6">
            <h2 className="text-lg font-bold mb-4">Table of Contents</h2>
            <ul className="grid gap-2 text-sm columns-2">
              <li><a href="#agreement" className="text-primary hover:underline">1. Agreement to Terms</a></li>
              <li><a href="#license" className="text-primary hover:underline">2. Use License</a></li>
              <li><a href="#restrictions" className="text-primary hover:underline">3. Restrictions</a></li>
              <li><a href="#betting" className="text-primary hover:underline">4. Betting Terms</a></li>
              <li><a href="#accounts" className="text-primary hover:underline">5. User Accounts</a></li>
              <li><a href="#conduct" className="text-primary hover:underline">6. User Conduct</a></li>
              <li><a href="#liability" className="text-primary hover:underline">7. Liability</a></li>
              <li><a href="#termination" className="text-primary hover:underline">8. Termination</a></li>
              <li><a href="#governing" className="text-primary hover:underline">9. Governing Law</a></li>
              <li><a href="#contact" className="text-primary hover:underline">10. Contact</a></li>
            </ul>
          </div>

          {/* Section 1 */}
          <section id="agreement" className="scroll-mt-20">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing, browsing, and using Betflexx, including our website located at www.betflexx.com, our mobile applications for iOS and Android, and all associated services, features, and functionality (collectively, the "Service"), you agree to be bound by these Terms of Service. If you do not agree to abide by these Terms in their entirety, you are not authorized to use Betflexx.
            </p>
            <h3>1.1 Legal Capacity</h3>
            <p>
              You represent and warrant that you have the legal capacity to enter into these Terms and that you are at least 18 years of age (or the age of majority in your jurisdiction). If you do not meet these requirements, you must not use Betflexx. We reserve the right to verify your age at any time.
            </p>
            <h3>1.2 Authority</h3>
            <p>
              You represent that you have full authority and capacity to enter into this agreement and that entering into these Terms does not violate any other agreement, law, or regulation applicable to you, including gaming regulations in your jurisdiction.
            </p>
            <h3>1.3 Modifications to Terms</h3>
            <p>
              Betflexx reserves the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on our website and updating the "Last Updated" date. Your continued use of Betflexx following the posting of revised Terms constitutes your acceptance of those modifications.
            </p>
            <h3>1.4 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy, Cookie Policy, and any other policies referenced herein, constitute the entire agreement between you and Betflexx regarding your use of the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section id="license" className="scroll-mt-20">
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (including information and software) on Betflexx's Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modifying or copying the materials without authorization</li>
              <li>Using the materials for any commercial purpose or public display</li>
              <li>Attempting to reverse engineer any software contained on Betflexx's Service</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              <li>Violating any applicable laws or regulations related to access to or use of the Service</li>
              <li>Creating derivative works based on Betflexx content</li>
              <li>Scraping or data mining our Service</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="restrictions" className="scroll-mt-20">
            <h2>3. User Restrictions</h2>
            <p>
              Betflexx cannot be used by persons who are prohibited by law from using online gambling services. This includes but is not limited to:
            </p>
            <ul>
              <li>Persons under 18 years of age</li>
              <li>Residents of prohibited jurisdictions</li>
              <li>Persons subject to sanctions or on watchlists</li>
              <li>Persons with active self-exclusion orders</li>
              <li>Persons previously banned from Betflexx</li>
            </ul>
            <h3>3.1 Geographic Restrictions</h3>
            <p>
              Betflexx is available only in jurisdictions where online sports betting is legal. Users accessing Betflexx from prohibited jurisdictions do so at their own risk.
            </p>
            <h3>3.2 Account Restrictions</h3>
            <p>
              You may only maintain one active account. Creating multiple accounts is strictly prohibited and may result in suspension or permanent closure of all accounts.
            </p>
          </section>

          {/* Section 4 */}
          <section id="betting" className="scroll-mt-20">
            <h2>4. Betting Terms and Conditions</h2>
            <h3>4.1 Bet Placement and Finality</h3>
            <p>
              All bets placed on Betflexx are final once submitted and confirmed. You cannot modify or cancel a bet after it has been placed and confirmed, except in cases where Betflexx explicitly offers a cash-out feature or similar functionality for that specific market. Betflexx is not responsible for bets placed in error.
            </p>
            <h3>4.2 Odds and Pricing</h3>
            <p>
              Odds are subject to change without notice and are guaranteed only at the moment you place your bet. If you place a bet before seeing updated odds, you accept the odds at the time of placement. We reserve the right to correct obvious errors in odds display, and any bets placed on obviously incorrect odds may be voided.
            </p>
            <h3>4.3 Bet Void and Voiding</h3>
            <p>
              Betflexx reserves the right to void any bet that:
            </p>
            <ul>
              <li>Violates these Terms or any applicable law</li>
              <li>Appears to involve fraud, collusion, or manipulation</li>
              <li>Is placed by unauthorized persons</li>
              <li>Involves a suspended or closed account</li>
              <li>Was placed using funds obtained fraudulently</li>
            </ul>
            <p>Voided bets will be refunded in full to the original deposit method.</p>
            <h3>4.4 Deposits</h3>
            <ul>
              <li>All deposits must be made via approved payment methods only (M-Pesa, bank transfers, etc.)</li>
              <li>Deposits are processed and credited to your account immediately upon successful authorization</li>
              <li>Deposits are non-refundable except where required by applicable law</li>
              <li>You are responsible for ensuring accurate payment details</li>
              <li>Betflexx is not responsible for deposits lost due to incorrect payment information</li>
            </ul>
            <h3>4.5 Withdrawals</h3>
            <ul>
              <li>Withdrawals can only be made to the same payment method used for initial deposits</li>
              <li>Withdrawal requests are processed within 24-48 business hours</li>
              <li>Betflexx may place temporary holds on withdrawals for verification purposes</li>
              <li>You must have sufficient verified funds in your account to withdraw</li>
              <li>Withdrawal limits may apply and will be communicated to you</li>
            </ul>
            <h3>4.6 Settlement of Bets</h3>
            <p>
              Bets are settled based on the official results of the sporting event as confirmed by the governing body of that sport. Settlement typically occurs within 24 hours of the event conclusion. In case of disputes regarding official results, we defer to the decision of the sport's governing body.
            </p>
            <h3>4.7 Responsible Gambling</h3>
            <p>
              Betflexx is committed to responsible gambling. We provide tools to help manage your betting activity, including deposit limits, loss limits, reality checks, and self-exclusion options. If you develop a gambling problem or believe you may have a gambling addiction, you must immediately use these tools or contact gambling support organizations.
            </p>
          </section>

          {/* Section 5 */}
          <section id="accounts" className="scroll-mt-20">
            <h2>5. User Accounts</h2>
            <h3>5.1 Account Registration</h3>
            <p>
              To create a Betflexx account, you must:
            </p>
            <ul>
              <li>Be at least 18 years old</li>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Agree to these Terms and our Privacy Policy</li>
              <li>Pass any required verification or identity checks</li>
              <li>Not be a resident of any prohibited jurisdiction</li>
            </ul>
            <h3>5.2 Account Credentials</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account password and login credentials. You agree to:
            </p>
            <ul>
              <li>Not share your credentials with anyone</li>
              <li>Notify Betflexx immediately of any unauthorized access or suspicious activity</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Ensure you log out from shared computers</li>
              <li>Never disclose your password to anyone claiming to represent Betflexx</li>
            </ul>
            <h3>5.3 Account Verification</h3>
            <p>
              Betflexx may require you to verify your identity, address, payment method, and source of funds at any time. You agree to provide accurate documentation and information as requested within a reasonable timeframe. Failure to complete verification may result in account suspension or permanent closure.
            </p>
            <h3>5.4 Account Restrictions</h3>
            <p>
              You may only maintain one active Betflexx account. Creating multiple accounts is prohibited and may result in immediate suspension or closure of all accounts associated with you. We use sophisticated detection methods to identify account abuse.
            </p>
            <h3>5.5 Personal Information Accuracy</h3>
            <p>
              You warrant that all information you provide is accurate, truthful, and not misleading. You must immediately update any information that changes, including contact details, payment methods, and personal information used for verification.
            </p>
          </section>

          {/* Section 6 */}
          <section id="conduct" className="scroll-mt-20">
            <h2>6. User Conduct and Prohibited Activities</h2>
            <p>
              You agree not to use Betflexx to:
            </p>
            <ul>
              <li>Post, upload, or transmit any content that is unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable</li>
              <li>Engage in fraud, collusion, or manipulation of bets or events</li>
              <li>Attempt to interfere with, compromise the system integrity or security of, or decipher any transmissions to or from the servers running the Service</li>
              <li>Probe, scan, or test the vulnerability of the Service or any connected network</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, threaten, or intimidate other users or staff</li>
              <li>Engage in money laundering or sanctions evasion</li>
              <li>Use automated systems or bots to place bets</li>
              <li>Exploit or manipulate bonuses or promotions</li>
              <li>Share your account with others or allow unauthorized use</li>
              <li>Engage in any form of price manipulation or market fixing</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="liability" className="scroll-mt-20">
            <h2>7. Disclaimers and Limitations of Liability</h2>
            <h3>7.1 AS-IS Disclaimer</h3>
            <p>
              THE MATERIALS ON BETFLEXX'S SERVICE ARE PROVIDED ON AN "AS IS" BASIS WITHOUT WARRANTY OF ANY KIND. BETFLEXX MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF INTELLECTUAL PROPERTY OR OTHER VIOLATION OF RIGHTS.
            </p>
            <h3>7.2 Limitation of Liability</h3>
            <p>
              IN NO EVENT SHALL BETFLEXX OR ITS SUPPLIERS BE LIABLE FOR ANY DAMAGES (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF DATA OR PROFIT, OR DUE TO BUSINESS INTERRUPTION) ARISING OUT OF THE USE OR INABILITY TO USE THE MATERIALS ON BETFLEXX'S SERVICE, EVEN IF BETFLEXX OR AN AUTHORIZED REPRESENTATIVE HAS BEEN NOTIFIED ORALLY OR IN WRITING OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
            <h3>7.3 Accuracy of Materials</h3>
            <p>
              The materials appearing on Betflexx's Service could include technical, typographical, or photographic errors. Betflexx does not warrant that any of the materials on the Service are accurate, complete, or current. Betflexx may make changes to the materials contained on the Service at any time without notice.
            </p>
            <h3>7.4 Third-Party Links</h3>
            <p>
              Betflexx has not reviewed all of the sites linked to its Service and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Betflexx of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          {/* Section 8 */}
          <section id="termination" className="scroll-mt-20">
            <h2>8. Termination of Access</h2>
            <p>
              Betflexx may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including if you breach these Terms of Service. Reasons for termination may include but are not limited to:
            </p>
            <ul>
              <li>Violation of these Terms or any applicable law</li>
              <li>Suspected fraudulent activity</li>
              <li>Multiple account creation</li>
              <li>Abuse of bonuses or promotions</li>
              <li>Failure to complete verification</li>
              <li>Residence in a prohibited jurisdiction</li>
              <li>Inactivity for an extended period</li>
              <li>Underage access</li>
            </ul>
            <p>
              Upon termination of your account, your right to use the Service will immediately cease. Any remaining balance in your account will be refunded to your registered payment method within 7-10 business days.
            </p>
          </section>

          {/* Section 9 */}
          <section id="governing" className="scroll-mt-20">
            <h2>9. Governing Law and Dispute Resolution</h2>
            <h3>9.1 Governing Law</h3>
            <p>
              These Terms of Service and all related agreements are governed by and construed in accordance with the laws of Kenya, and you irrevocably submit to the exclusive jurisdiction of the courts located in Nairobi, Kenya.
            </p>
            <h3>9.2 Dispute Resolution</h3>
            <p>
              Any dispute arising out of or relating to these Terms of Service or the Service shall first be resolved through good faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the applicable rules of Kenya.
            </p>
            <h3>9.3 Class Action Waiver</h3>
            <p>
              You waive the right to participate in any class action lawsuit against Betflexx. All disputes must be resolved on an individual basis.
            </p>
          </section>

          {/* Section 10 */}
          <section id="contact" className="scroll-mt-20">
            <h2>10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li><strong>Email:</strong> legal@betflexx.com</li>
              <li><strong>Support:</strong> support@betflexx.com</li>
              <li><strong>Phone:</strong> +254 700 000 000</li>
              <li><strong>Address:</strong> Betflexx Legal Department, Nairobi, Kenya</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t border-border pt-8 mt-12">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Betflexx. All rights reserved. This Terms of Service is a binding legal document between you and Betflexx. By using Betflexx, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions contained herein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
