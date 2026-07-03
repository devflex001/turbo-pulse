import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Betflexx',
  description: 'Comprehensive privacy policy explaining how Betflexx handles your personal data.',
};

export default function PrivacyPolicy() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Legal Document</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-2xl">
              Comprehensive guide to how Betflexx collects, uses, and protects your personal data with transparency and care
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>•</span>
              <span>Effective Date: January 1, 2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Table of Contents */}
          <div className="rounded-lg border border-border bg-accent/30 p-6">
            <h2 className="text-lg font-bold mb-4">Table of Contents</h2>
            <ul className="grid gap-2 text-sm columns-2">
              <li><a href="#intro" className="text-primary hover:underline">1. Introduction</a></li>
              <li><a href="#collection" className="text-primary hover:underline">2. Information We Collect</a></li>
              <li><a href="#usage" className="text-primary hover:underline">3. How We Use Information</a></li>
              <li><a href="#legal" className="text-primary hover:underline">4. Legal Basis</a></li>
              <li><a href="#sharing" className="text-primary hover:underline">5. Data Sharing</a></li>
              <li><a href="#security" className="text-primary hover:underline">6. Data Security</a></li>
              <li><a href="#retention" className="text-primary hover:underline">7. Data Retention</a></li>
              <li><a href="#cookies" className="text-primary hover:underline">8. Cookies</a></li>
              <li><a href="#rights" className="text-primary hover:underline">9. Your Rights</a></li>
              <li><a href="#contact" className="text-primary hover:underline">10. Contact Us</a></li>
            </ul>
          </div>

          {/* Section 1 */}
          <section id="intro" className="scroll-mt-20">
            <h2>1. Introduction</h2>
            <p>
              Betflexx ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process your personal data in connection with our website, mobile applications, and related services (collectively, the "Service").
            </p>
            <p>
              We take your privacy seriously and have implemented comprehensive measures to protect your personal information. This policy is designed to be transparent about our data practices while explaining your rights and choices.
            </p>
          </section>

          {/* Section 2 */}
          <section id="collection" className="scroll-mt-20">
            <h2>2. Information We Collect</h2>
            <p>
              Betflexx collects various types of information to provide our services, improve your experience, and comply with legal obligations.
            </p>
            <h3>2.1 Information You Provide Directly</h3>
            <p>
              We collect information that you voluntarily provide to us, including:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, address, country of residence, and nationality</li>
              <li><strong>Identification Documents:</strong> Government-issued ID, proof of address, passport information, and other verification documents</li>
              <li><strong>Payment Information:</strong> Bank account details, M-Pesa phone number, payment card information (processed securely through PCI-compliant providers)</li>
              <li><strong>Profile Data:</strong> Username, profile picture, betting preferences, favorite sports, and account settings</li>
              <li><strong>Communication:</strong> Messages sent through support chat, email inquiries, and customer service interactions</li>
              <li><strong>Verification Data:</strong> Information provided during know-your-customer (KYC) and anti-money laundering (AML) verification processes</li>
              <li><strong>Feedback:</strong> Ratings, reviews, and suggestions you provide about our services</li>
            </ul>
            <h3>2.2 Information Collected Automatically</h3>
            <p>
              When you use Betflexx, we automatically collect certain technical and behavioral information:
            </p>
            <ul>
              <li><strong>Device Information:</strong> Device type (smartphone, tablet, desktop), operating system, device ID, unique mobile identifiers, and hardware model</li>
              <li><strong>Connection Data:</strong> IP address, Internet Service Provider (ISP), browser type and version, connection speed, and network type</li>
              <li><strong>Usage Information:</strong> Pages visited, time spent on each page, links clicked, search queries, and navigation patterns</li>
              <li><strong>Session Data:</strong> Session duration, frequency of visits, referring URLs, and exit pages</li>
              <li><strong>Location Data:</strong> Approximate geographic location based on IP address (not precise GPS)</li>
              <li><strong>Behavioral Data:</strong> Betting patterns, sports preferences, wager amounts, types of bets placed, and click-through patterns</li>
              <li><strong>Performance Data:</strong> Page load times, errors encountered, and technical issues experienced</li>
            </ul>
            <h3>2.3 Information from Third Parties</h3>
            <p>
              We may receive information about you from third-party service providers:
            </p>
            <ul>
              <li><strong>Payment Processors:</strong> Transaction confirmations, payment status updates, fraud indicators, and chargeback notifications</li>
              <li><strong>Verification Services:</strong> Identity verification results, address confirmation, document authenticity checks, and fraud assessment reports</li>
              <li><strong>Financial Institutions:</strong> Account verification results, sanctions checking outcomes, and PEP (Politically Exposed Person) screening results</li>
              <li><strong>Analytics Partners:</strong> User behavior data, traffic patterns, engagement metrics, and audience insights</li>
              <li><strong>Referral Sources:</strong> Information when you're referred by another user (referral code, source details)</li>
              <li><strong>Marketing Partners:</strong> Information from promotional campaigns and affiliate partners</li>
            </ul>
            <h3>2.4 Cookies and Similar Technologies</h3>
            <p>
              We use cookies, web beacons, pixels, local storage, and similar tracking technologies to collect information about your browsing activities and preferences:
            </p>
            <ul>
              <li><strong>Session Cookies:</strong> Help us remember you during your visit and maintain your login status</li>
              <li><strong>Persistent Cookies:</strong> Remember your preferences for future visits (language, theme, settings)</li>
              <li><strong>Analytics Cookies:</strong> Track how you use our platform to identify usage patterns and improve functionality</li>
              <li><strong>Marketing Cookies:</strong> Help us show you relevant content and measure campaign effectiveness</li>
              <li><strong>Third-Party Cookies:</strong> Set by partners for analytics, advertising, and functionality purposes</li>
            </ul>
            <h3>2.5 Sensitive Personal Data</h3>
            <p>
              In limited circumstances, we may collect sensitive personal data only where necessary:
            </p>
            <ul>
              <li>Government-issued identification numbers (for verification compliance)</li>
              <li>Financial information (for account verification and fraud prevention)</li>
              <li>Information indicating problem gambling or self-exclusion requests</li>
              <li>Health information (if disclosed for responsible gambling purposes)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="usage" className="scroll-mt-20">
            <h2>3. How We Use Your Information</h2>
            <p>
              We use the information we collect for legitimate business purposes and to provide you with the best possible service:
            </p>
            <h3>3.1 Service Delivery</h3>
            <ul>
              <li>Creating and managing your account</li>
              <li>Processing deposits, withdrawals, and payments</li>
              <li>Settling bets and managing your betting activity</li>
              <li>Providing customer support and assistance</li>
              <li>Sending transactional communications (confirmations, receipts, account updates)</li>
            </ul>
            <h3>3.2 Security and Compliance</h3>
            <ul>
              <li>Verifying your identity and preventing fraud</li>
              <li>Conducting know-your-customer (KYC) and anti-money laundering (AML) checks</li>
              <li>Detecting and preventing suspicious or fraudulent activities</li>
              <li>Monitoring for responsible gambling concerns</li>
              <li>Complying with legal, regulatory, and licensing requirements</li>
              <li>Responding to legal requests from authorities</li>
            </ul>
            <h3>3.3 Service Improvement</h3>
            <ul>
              <li>Analyzing usage patterns to improve our Service</li>
              <li>Personalizing your experience and recommendations</li>
              <li>Conducting analytics and research</li>
              <li>Testing new features and functionality</li>
              <li>Troubleshooting technical issues</li>
            </ul>
            <h3>3.4 Marketing and Communication</h3>
            <ul>
              <li>Sending promotional emails and newsletters (with your consent)</li>
              <li>Informing you about new features, offers, and promotions</li>
              <li>Conducting surveys and requesting feedback</li>
              <li>Measuring marketing campaign effectiveness</li>
            </ul>
            <h3>3.5 Business Operations</h3>
            <ul>
              <li>Managing our business operations and administration</li>
              <li>Auditing and financial reporting</li>
              <li>Dispute resolution and legal proceedings</li>
              <li>General business analytics and planning</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="legal" className="scroll-mt-20">
            <h2>4. Legal Basis for Processing</h2>
            <p>
              We process your personal data based on one or more of the following legal grounds:
            </p>
            <h3>4.1 Contract Performance</h3>
            <p>
              Processing necessary to provide the Service, execute your betting requests, process payments, and fulfill our contractual obligations to you.
            </p>
            <h3>4.2 Legal Obligation</h3>
            <p>
              Compliance with applicable laws, regulations, and licensing requirements, including KYC, AML, and responsible gambling regulations.
            </p>
            <h3>4.3 Legitimate Interest</h3>
            <p>
              Our legitimate business interests in fraud prevention, security, service improvement, customer communication, and business operations, balanced against your privacy rights.
            </p>
            <h3>4.4 Consent</h3>
            <p>
              Where we request explicit consent for marketing communications, optional analytics, non-essential cookies, or other specific uses.
            </p>
            <h3>4.5 Public Task</h3>
            <p>
              Processing necessary to fulfill our public obligations related to anti-money laundering, counter-terrorism financing, and gambling regulation.
            </p>
          </section>

          {/* Section 5 */}
          <section id="sharing" className="scroll-mt-20">
            <h2>5. Data Sharing and Disclosure</h2>
            <p>
              We may share your personal information with third parties in the following circumstances:
            </p>
            <h3>5.1 Service Providers</h3>
            <p>
              We share information with service providers who assist us in operating our Service, including:
            </p>
            <ul>
              <li>Payment processors (Paystack, banks, M-Pesa providers)</li>
              <li>Cloud hosting and infrastructure providers</li>
              <li>Analytics and marketing partners</li>
              <li>Email and communication service providers</li>
              <li>Customer support platforms</li>
              <li>Security and fraud prevention services</li>
            </ul>
            <h3>5.2 Legal and Regulatory Authorities</h3>
            <p>
              We may disclose your information when required by law or to comply with legal processes:
            </p>
            <ul>
              <li>Government agencies and law enforcement</li>
              <li>Gambling regulatory bodies and licensing authorities</li>
              <li>Financial regulators and anti-money laundering agencies</li>
              <li>Court orders, subpoenas, and legal proceedings</li>
            </ul>
            <h3>5.3 Business Partners</h3>
            <p>
              We may share information with business partners for legitimate purposes:
            </p>
            <ul>
              <li>Affiliate and referral partners</li>
              <li>Sports data and odds providers</li>
              <li>Marketing and promotional partners</li>
            </ul>
            <h3>5.4 Business Transactions</h3>
            <p>
              In the event of merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will provide notice of any such change.
            </p>
            <h3>5.5 Aggregated Data</h3>
            <p>
              We may share aggregated, anonymized data that cannot identify you for research, marketing, and analytics purposes.
            </p>
            <h3>5.6 With Your Consent</h3>
            <p>
              We may share your information with other parties where you provide explicit consent.
            </p>
          </section>

          {/* Section 6 */}
          <section id="security" className="scroll-mt-20">
            <h2>6. Data Security</h2>
            <p>
              Betflexx implements comprehensive security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction.
            </p>
            <h3>6.1 Encryption</h3>
            <ul>
              <li><strong>Transport Security:</strong> 256-bit TLS/SSL encryption for all data transmitted between your device and our servers</li>
              <li><strong>Data at Rest:</strong> AES-256 encryption for sensitive data stored in our databases</li>
              <li><strong>Payment Security:</strong> PCI DSS compliant encryption for payment information</li>
              <li><strong>Communications:</strong> Encrypted communication channels for sensitive interactions</li>
            </ul>
            <h3>6.2 Access Controls</h3>
            <ul>
              <li>Role-based access control (RBAC) limiting employee access to necessary data</li>
              <li>Multi-factor authentication (MFA) for all administrative accounts</li>
              <li>Strict password policies and regular password rotation</li>
              <li>Comprehensive audit logs tracking all data access</li>
              <li>Principle of least privilege for all system accounts</li>
            </ul>
            <h3>6.3 Infrastructure Security</h3>
            <ul>
              <li>Enterprise-grade firewalls and intrusion detection systems</li>
              <li>DDoS protection and mitigation services</li>
              <li>Regular vulnerability scanning and penetration testing</li>
              <li>Web application firewalls (WAF) protecting against attacks</li>
              <li>Secure data center facilities with physical security controls</li>
            </ul>
            <h3>6.4 Password Security</h3>
            <ul>
              <li>Industry-standard bcrypt hashing with cryptographic salt</li>
              <li>Minimum password complexity requirements</li>
              <li>Account lockout after multiple failed login attempts</li>
              <li>Secure password reset functionality with email verification</li>
              <li>Passwords never stored in plain text</li>
            </ul>
            <h3>6.5 Monitoring and Incident Response</h3>
            <ul>
              <li>24/7 security monitoring and threat detection</li>
              <li>Real-time alert systems for suspicious activities</li>
              <li>Dedicated incident response team</li>
              <li>Regular security assessments and audits</li>
              <li>Compliance with industry standards (ISO 27001, SOC 2 Type II)</li>
            </ul>
            <h3>6.6 Employee Security</h3>
            <ul>
              <li>Mandatory security training for all employees</li>
              <li>Background checks for employees with data access</li>
              <li>Comprehensive confidentiality and non-disclosure agreements</li>
              <li>Regular security awareness programs</li>
              <li>Strict data handling procedures and policies</li>
            </ul>
            <h3>6.7 Your Security Responsibilities</h3>
            <p>
              While we implement strong security measures, you also have responsibilities:
            </p>
            <ul>
              <li>Keep your password confidential and change it regularly</li>
              <li>Do not share your login credentials</li>
              <li>Log out when using shared computers</li>
              <li>Report any suspicious account activity immediately</li>
              <li>Use strong, unique passwords</li>
              <li>Enable two-factor authentication if available</li>
            </ul>
            <h3>6.8 Data Breach Notification</h3>
            <p>
              In the event of a security breach that compromises your personal data, we will:
            </p>
            <ul>
              <li>Notify you without unreasonable delay</li>
              <li>Provide information about the incident and affected data</li>
              <li>Explain steps we're taking to address the breach</li>
              <li>Provide resources and support</li>
              <li>Comply with all applicable legal notification requirements</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="retention" className="scroll-mt-20">
            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to:
            </p>
            <ul>
              <li>Provide you with the Service</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Prevent fraud and maintain security</li>
              <li>Establish, exercise, or defend legal claims</li>
            </ul>
            <h3>7.1 Retention Periods</h3>
            <ul>
              <li><strong>Account Information:</strong> Retained for the duration of your account and 7 years after closure (for regulatory compliance)</li>
              <li><strong>Transaction Data:</strong> Retained for 7 years (for tax and regulatory requirements)</li>
              <li><strong>Identity Verification Documents:</strong> Retained for 7 years after account closure (for AML compliance)</li>
              <li><strong>Analytics and Usage Data:</strong> Retained for 12 months (aggregated thereafter)</li>
              <li><strong>Support Interactions:</strong> Retained for 3 years for dispute resolution</li>
              <li><strong>Marketing Communications:</strong> Retained until you unsubscribe</li>
            </ul>
            <h3>7.2 Data Deletion</h3>
            <p>
              When data is no longer necessary, we securely delete or anonymize it. You may request deletion of your data subject to legal retention requirements by contacting us at privacy@betflexx.com.
            </p>
          </section>

          {/* Section 8 */}
          <section id="cookies" className="scroll-mt-20">
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience and understand how you use our Service.
            </p>
            <h3>8.1 Types of Cookies</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Necessary for core functionality (login, session management)</li>
              <li><strong>Performance Cookies:</strong> Track usage to improve performance</li>
              <li><strong>Functional Cookies:</strong> Remember preferences and settings</li>
              <li><strong>Marketing Cookies:</strong> Deliver targeted advertising and measure campaign effectiveness</li>
            </ul>
            <h3>8.2 Managing Cookies</h3>
            <p>
              Most web browsers allow you to control cookies through your settings:
            </p>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
              <li><strong>Edge:</strong> Settings → Privacy, search, and services → Clear browsing data</li>
            </ul>
            <p>
              You can also opt out of targeted advertising through services like the Digital Advertising Alliance and Your Ad Choices.
            </p>
            <h3>8.3 Do Not Track</h3>
            <p>
              Some browsers include a "Do Not Track" (DNT) feature. While we respect DNT signals, many third-party services may not honor them. We will make efforts to comply with DNT requests where technically feasible.
            </p>
          </section>

          {/* Section 9 */}
          <section id="rights" className="scroll-mt-20">
            <h2>9. Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have rights to access and control your personal data. We are committed to respecting these rights.
            </p>
            <h3>9.1 General Rights</h3>
            <ul>
              <li><strong>Right to Access:</strong> You have the right to access your personal data and request a copy</li>
              <li><strong>Right to Rectification:</strong> You can correct inaccurate or incomplete information</li>
              <li><strong>Right to Erasure:</strong> You may request deletion of your personal data (subject to legal requirements)</li>
              <li><strong>Right to Restrict Processing:</strong> You can limit how we process your information</li>
              <li><strong>Right to Data Portability:</strong> You can request your data in a structured, commonly used format</li>
              <li><strong>Right to Object:</strong> You can object to certain types of processing, including marketing</li>
              <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for optional processing at any time</li>
            </ul>
            <h3>9.2 European Privacy Rights (GDPR)</h3>
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
            <h3>9.3 California Privacy Rights (CCPA)</h3>
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
              Betflexx does not sell personal information. To submit a CCPA request, email ccpa@betflexx.com.
            </p>
            <h3>9.4 Marketing Opt-Out</h3>
            <p>
              You can opt out of marketing communications at any time by:
            </p>
            <ul>
              <li>Clicking the "Unsubscribe" link in our emails</li>
              <li>Adjusting your notification settings in your account</li>
              <li>Contacting us at marketing@betflexx.com</li>
            </ul>
            <h3>9.5 Exercising Your Rights</h3>
            <p>
              To exercise any of these rights, contact us at privacy@betflexx.com with:
            </p>
            <ul>
              <li>Your full name</li>
              <li>Your account email or phone number</li>
              <li>Clear description of your request</li>
              <li>Any supporting documentation</li>
            </ul>
            <p>
              We will respond to your request within 30 days (or as required by applicable law).
            </p>
          </section>

          {/* Section 10 */}
          <section id="contact" className="scroll-mt-20">
            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> privacy@betflexx.com</li>
              <li><strong>Data Protection Officer:</strong> dpo@betflexx.com</li>
              <li><strong>General Support:</strong> support@betflexx.com</li>
              <li><strong>CCPA Requests:</strong> ccpa@betflexx.com</li>
              <li><strong>Mailing Address:</strong> Betflexx Privacy Department, Nairobi, Kenya</li>
            </ul>
            <h3>10.1 Complaint Process</h3>
            <p>
              If you believe your privacy rights have been violated, you may file a complaint with:
            </p>
            <ul>
              <li>Your local data protection authority (if applicable)</li>
              <li>Your country's consumer protection office</li>
              <li>The appropriate regulatory body in your jurisdiction</li>
            </ul>
            <p>
              We encourage you to contact us first so we can attempt to resolve your concerns.
            </p>
          </section>

          {/* Footer */}
          <div className="border-t border-border pt-8 mt-12">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Betflexx. All rights reserved. This Privacy Policy is binding and governs the processing of your personal information. By using Betflexx, you acknowledge that you have read, understood, and agree to the terms and conditions of this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
