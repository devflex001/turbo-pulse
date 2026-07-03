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
            By accessing and using the Betflexx platform ("Service"), including our website and mobile application, you agree to be bound by these Terms of Service. If you do not agree to abide by the above, please do not use this service. We reserve the right to modify these terms at any time without notice. Your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (including information and software) on Betflexx's Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to reverse engineer any software contained on Betflexx's Service</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            <li>Violating any applicable laws or regulations related to access to or use of the Service</li>
          </ul>

          <h2>3. Disclaimer of Warranties</h2>
          <p>
            THE MATERIALS ON BETFLEXX'S SERVICE ARE PROVIDED ON AN 'AS IS' BASIS. BETFLEXX MAKES NO WARRANTIES, EXPRESSED OR IMPLIED, AND HEREBY DISCLAIMS AND NEGATES ALL OTHER WARRANTIES INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF INTELLECTUAL PROPERTY OR OTHER VIOLATION OF RIGHTS.
          </p>

          <h2>4. Limitations of Liability</h2>
          <p>
            In no event shall Betflexx or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Betflexx's Service, even if Betflexx or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>

          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Betflexx's Service could include technical, typographical, or photographic errors. Betflexx does not warrant that any of the materials on the Service are accurate, complete, or current. Betflexx may make changes to the materials contained on the Service at any time without notice.
          </p>

          <h2>6. Materials on Betflexx's Service</h2>
          <p>
            Betflexx has not reviewed all of the sites linked to its Service and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Betflexx of the site. Use of any such linked website is at the user's own risk. If you notice any materials on our Service that you believe violate any law, these Terms of Service, or any third-party rights, please report it immediately.
          </p>

          <h2>7. Modifications to Service</h2>
          <p>
            Betflexx may revise these Terms of Service for its Service at any time without notice. By using this Service, you are agreeing to be bound by the then current version of these Terms of Service.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by and construed in accordance with the laws of the jurisdiction in which Betflexx operates, and you irrevocably submit to the exclusive jurisdiction of the courts located in that location.
          </p>

          <h2>9. User Accounts</h2>
          <p>
            When you create an account on Betflexx, you are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to refuse service, terminate accounts, or remove or edit content at our sole discretion.
          </p>

          <h2>10. User Conduct</h2>
          <p>
            You agree not to use Betflexx to:
          </p>
          <ul>
            <li>Post, upload, or transmit any content that is unlawful, threatening, abusive, defamatory, obscene, or otherwise objectionable</li>
            <li>Post or transmit any unsolicited advertising, promotional materials, or spam</li>
            <li>Attempt to interfere with, compromise the system integrity or security of, or decipher any transmissions to or from the servers running the Service</li>
            <li>Engage in any form of fraud or deception</li>
            <li>Attempt to gain unauthorized access to our systems or networks</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, threaten, or intimidate other users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

          <h2>11. Payment and Betting Terms</h2>
          <p>
            By placing a bet or making a deposit on Betflexx, you agree to our payment terms. All bets are final once placed unless otherwise stated by Betflexx. We reserve the right to void any bets that violate these Terms of Service or applicable laws. Deposits are non-refundable except where required by law.
          </p>

          <h2>12. Age Restrictions</h2>
          <p>
            You must be at least 18 years of age (or the age of majority in your jurisdiction) to use Betflexx. By using our Service, you warrant that you meet these age requirements. We are not liable for any misrepresentation of age by users.
          </p>

          <h2>13. Responsible Gambling</h2>
          <p>
            Betflexx is committed to responsible gambling practices. We provide tools to help you manage your betting activity, including deposit limits, loss limits, and self-exclusion options. If you believe you may have a gambling problem, please contact our support team or seek assistance from relevant gambling support organizations in your jurisdiction.
          </p>

          <h2>14. Intellectual Property Rights</h2>
          <p>
            All content included on this Service, such as text, graphics, logos, images, audio clips, video clips, and software, is the property of Betflexx or its content suppliers and protected by international copyright laws. The compilation of all content on this Service is the exclusive property of Betflexx and protected by international copyright laws.
          </p>

          <h2>15. Limitation of Use</h2>
          <p>
            The content on Betflexx's Service is provided for your personal, non-commercial use. You may not distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information or software obtained from the Service.
          </p>

          <h2>16. Termination of Use</h2>
          <p>
            Betflexx may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including if you breach the Terms of Service. Upon termination of your account, your right to use the Service will immediately cease.
          </p>

          <h2>17. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Betflexx and its officers, directors, employees, and agents from and against any and all claims, damages, losses, costs, and expenses (including legal fees) arising from or related to your use of the Service, your violation of these Terms of Service, or your violation of any rights of a third party.
          </p>

          <h2>18. Third-Party Links and Content</h2>
          <p>
            Betflexx may contain links to third-party websites and applications. We are not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is at your own risk and subject to their terms and conditions. We do not endorse or assume any responsibility for any third-party content.
          </p>

          <h2>19. Dispute Resolution</h2>
          <p>
            Any dispute arising out of or relating to these Terms of Service or the Service shall be resolved through binding arbitration in accordance with the rules of the applicable jurisdiction. Both parties waive the right to a jury trial and the right to participate in a class action lawsuit.
          </p>

          <h2>20. Severability</h2>
          <p>
            If any provision of these Terms of Service is found to be invalid or unenforceable, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall remain in full force and effect.
          </p>

          <h2>21. Entire Agreement</h2>
          <p>
            These Terms of Service constitute the entire agreement between you and Betflexx regarding the use of the Service and supersede all prior and contemporaneous agreements, understandings, and negotiations, whether written or oral.
          </p>

          <h2>22. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@betflexx.com</li>
            <li>Support: support@betflexx.com</li>
            <li>Mailing Address: Betflexx Legal Department, [Your Company Address]</li>
          </ul>

          <p className="mt-8 text-sm text-muted-foreground">
            © 2024 Betflexx. All rights reserved. This Terms of Service is a binding legal document between you and Betflexx.
          </p>
        </div >
      </div >
    </div >
  );
}