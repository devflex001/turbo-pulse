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
            Betflexx ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process your personal data in connection with our website, mobile application, and related services (collectively, the "Service").
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            We collect personal information in various ways, including:
          </p>

          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li><strong>Account Registration:</strong> Name, email address, phone number, date of birth, address, identification documents</li>
            <li><strong>Payment Information:</strong> Bank account details, payment card information, transaction history</li>
            <li><strong>Communication:</strong> Messages, feedback, customer support inquiries</li>
            <li><strong>Profile Information:</strong> Username, profile picture, betting preferences, favorites</li>
            <li><strong>Verification Documents:</strong> Government-issued identification, proof of address</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
            <li><strong>Log Data:</strong> IP address, browser type, pages visited, time and date stamps, referral source</li>
            <li><strong>Location Data:</strong> Approximate geographic location based on IP address</li>
            <li><strong>Cookies and Tracking:</strong> Usage patterns, preferences, behavioral data</li>
            <li><strong>Analytics:</strong> Interactions with our Service, clicks, page views, session duration</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul>
            <li>Payment processors and financial institutions</li>
            <li>Verification and identity confirmation services</li>
            <li>Marketing and analytics partners</li>
            <li>Sports data providers and API services</li>
            <li>Customer reference and background check services</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>
            We use the information we collect for the following purposes:
          </p>
          <ul>
            <li>Creating and managing your account</li>
            <li>Processing deposits, withdrawals, and payments</li>
            <li>Verifying your identity and preventing fraud</li>
            <li>Providing customer support and responding to inquiries</li>
            <li>Personalizing your experience and improving our Service</li>
            <li>Sending promotional emails, newsletters, and marketing communications</li>
            <li>Conducting analytics and research to improve Service functionality</li>
            <li>Complying with legal obligations and regulations</li>
            <li>Detecting and preventing fraud, abuse, and security incidents</li>
            <li>Enforcing our Terms of Service and other agreements</li>
            <li>Conducting responsible gambling monitoring and prevention</li>
            <li>Providing you with betting recommendations and updates</li>
          </ul>

          <h2>4. Legal Basis for Processing</h2>
          <p>
            We process your personal data based on the following legal grounds:
          </p>
          <ul>
            <li><strong>Contract Performance:</strong> Processing necessary to provide the Service to you</li>
            <li><strong>Legal Obligation:</strong> Compliance with applicable laws, regulations, and licensing requirements</li>
            <li><strong>Legitimate Interest:</strong> Fraud prevention, security, service improvement, customer communication</li>
            <li><strong>Consent:</strong> Marketing communications, optional analytics, and non-essential cookies</li>
            <li><strong>Public Task:</strong> Anti-money laundering (AML) and Know Your Customer (KYC) compliance</li>
          </ul>

          <h2>5. Sharing and Disclosure of Information</h2>
          <p>
            We may share your personal information with:
          </p>
          <ul>
            <li><strong>Payment Processors:</strong> Paystack and other payment service providers</li>
            <li><strong>Financial Institutions:</strong> Banks and financial services for transaction processing</li>
            <li><strong>Legal and Regulatory Authorities:</strong> Government agencies, law enforcement, regulatory bodies</li>
            <li><strong>Service Providers:</strong> Cloud hosting, analytics, email, customer support vendors</li>
            <li><strong>Verification Services:</strong> Identity verification and KYC service providers</li>
            <li><strong>Business Partners:</strong> Affiliate partners, sports data providers</li>
            <li><strong>Fraud Prevention Services:</strong> Third-party fraud detection and prevention services</li>
            <li><strong>Legal Proceedings:</strong> Court orders, subpoenas, litigation requirements</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to:
          </p>
          <ul>
            <li>Provide you with the Service</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Resolve disputes and enforce our agreements</li>
            <li>Prevent fraud and maintain security</li>
          </ul>
          <p>
            Typically, we retain information for 7 years after account closure to comply with anti-money laundering and financial regulations. You may request deletion of your data subject to legal retention requirements.
          </p>

          <h2>7. Cookies and Similar Technologies</h2>
          <p>
            We use cookies, web beacons, pixels, and similar tracking technologies to:
          </p>
          <ul>
            <li>Remember your preferences and settings</li>
            <li>Understand how you use our Service</li>
            <li>Provide personalized content and recommendations</li>
            <li>Measure marketing campaign effectiveness</li>
            <li>Detect and prevent fraud</li>
          </ul>
          <p>
            Most web browsers allow you to control cookies through your browser settings. You can opt out of certain tracking by adjusting your privacy settings or using Do Not Track signals.
          </p>
        </div>
      </div>
    </div>
  );
}

          <h2>8. Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have the following rights:
          </p>
          <ul>
            <li><strong>Right to Access:</strong> You have the right to access your personal data and request copies</li>
            <li><strong>Right to Rectification:</strong> You can correct inaccurate or incomplete information</li>
            <li><strong>Right to Erasure:</strong> You may request deletion of your personal data (subject to legal requirements)</li>
            <li><strong>Right to Restrict Processing:</strong> You can limit how we process your information</li>
            <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format</li>
            <li><strong>Right to Object:</strong> You can object to certain types of processing, including marketing</li>
            <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for optional processing at any time</li>
          </ul>
          <p>
            To exercise these rights, contact us at privacy@betflexx.com with "Privacy Rights Request" in the subject line.
          </p>

          <h2>9. Data Security</h2>
          <p>
            Betflexx implements comprehensive security measures to protect your personal data:
          </p>
          <ul>
            <li>256-bit SSL/TLS encryption for data in transit</li>
            <li>AES-256 encryption for sensitive data at rest</li>
            <li>Secure password hashing using bcrypt</li>
            <li>Multi-factor authentication (MFA) support</li>
            <li>Regular security audits and penetration testing</li>
            <li>PCI DSS compliance for payment processing</li>
            <li>Firewall protection and intrusion detection systems</li>
            <li>Limited access controls and role-based permissions</li>
            <li>Regular data backups and disaster recovery procedures</li>
            <li>Employee confidentiality agreements and security training</li>
          </ul>
          <p>
            While we implement robust security measures, no system is completely secure. Please notify us immediately if you suspect unauthorized access to your account.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            Betflexx is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a minor, we will take steps to delete such information and terminate the child's account. If you have reason to believe we have collected information from a minor, please contact us immediately.
          </p>

          <h2>11. International Data Transfers</h2>
          <p>
            Your personal information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from your home country. By using Betflexx, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules.
          </p>
          <p>
            We implement appropriate safeguards, including Standard Contractual Clauses and Privacy Shield mechanisms, to protect your information during international transfers.
          </p>

          <h2>12. Third-Party Links</h2>
          <p>
            Our Service may contain links to third-party websites and applications. This Privacy Policy does not apply to external sites, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services before providing your personal information.
          </p>

          <h2>13. Responsible Gambling and Data Privacy</h2>
          <p>
            Betflexx is committed to responsible gambling practices. We collect and analyze data related to your betting behavior to:
          </p>
          <ul>
            <li>Identify patterns of problem gambling</li>
            <li>Provide self-exclusion and deposit limit tools</li>
            <li>Send responsible gambling reminders</li>
            <li>Comply with gambling regulations and licensing requirements</li>
          </ul>
          <p>
            If you wish to self-exclude or set betting limits, contact our support team or access these options in your account settings.
          </p>

          <h2>14. California Privacy Rights (CCPA)</h2>
          <p>
            California residents have specific privacy rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul>
            <li>Right to know what personal information is collected</li>
            <li>Right to know whether personal information is sold or shared</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the "selling" or "sharing" of personal information</li>
            <li>Right to non-discrimination for exercising CCPA rights</li>
          </ul>
          <p>
            Betflexx does not sell personal information. To submit a CCPA request, email ccpa@betflexx.com with "CCPA Request" in the subject line.
          </p>

          <h2>15. European Privacy Rights (GDPR)</h2>
          <p>
            If you are located in the European Union or United Kingdom, you have rights under the General Data Protection Regulation (GDPR):
          </p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to request correction or deletion</li>
            <li>Right to restrict or object to processing</li>
            <li>Right to data portability</li>
            <li>Right to lodge a complaint with supervisory authorities</li>
          </ul>
          <p>
            Our Data Protection Officer can be contacted at dpo@betflexx.com for GDPR-related inquiries.
          </p>

          <h2>16. Marketing Communications</h2>
          <p>
            We may send you promotional emails, push notifications, SMS messages, and marketing communications about new features, offers, and events. You can opt out of these communications at any time by:
          </p>
          <ul>
            <li>Clicking the "Unsubscribe" link in our emails</li>
            <li>Adjusting your notification settings in your account</li>
            <li>Contacting us at marketing@betflexx.com</li>
          </ul>
          <p>
            Please note that even if you opt out of marketing communications, we will continue to send transactional and security-related messages.
          </p>

          <h2>17. Analytics and Performance Monitoring</h2>
          <p>
            We use analytics tools including Google Analytics, Mixpanel, and similar services to understand how users interact with our Service. These tools collect anonymized information about:
          </p>
          <ul>
            <li>User behavior and engagement patterns</li>
            <li>Traffic sources and conversion funnels</li>
            <li>Performance metrics and error tracking</li>
            <li>Device and browser information</li>
          </ul>
          <p>
            You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.
          </p>

          <h2>18. Changes to This Privacy Policy</h2>
          <p>
            Betflexx may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by posting the updated policy on our website and updating the "Last updated" date. Your continued use of the Service following changes to this policy constitutes your acceptance of the revised Privacy Policy.
          </p>

          <h2>19. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> privacy@betflexx.com</li>
            <li><strong>Data Protection Officer:</strong> dpo@betflexx.com</li>
            <li><strong>Support:</strong> support@betflexx.com</li>
            <li><strong>Mailing Address:</strong> Betflexx Privacy Department, [Your Company Address]</li>
          </ul>

          <h2>20. Dispute Resolution</h2>
          <p>
            If you believe we have violated your privacy rights, you may file a complaint with:
          </p>
          <ul>
            <li>Your local data protection authority (if applicable)</li>
            <li>Your country's consumer protection office</li>
            <li>The appropriate regulatory body in your jurisdiction</li>
          </ul>

          <p className="mt-8 text-sm text-muted-foreground">
            © 2024 Betflexx. All rights reserved. This Privacy Policy is binding and governs the processing of your personal information.
          </p>
        </div >
      </div >
    </div >
  );
}