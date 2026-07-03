import { Metadata } from 'next';
import { LegalLayout } from '@/components/legal-layout';

export const metadata: Metadata = {
  title: 'Data Security | Betflexx Privacy Policy',
  description: 'Learn how Betflexx protects your personal data with enterprise-grade security.',
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

export default function SecurityPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Understand how Betflexx collects, uses, and protects your personal data."
      currentPage="security"
      sections={sections}
    >
      <section className="space-y-6">
        <div>
          <h2>3. Data Security</h2>
          <p>
            Betflexx implements comprehensive security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. We employ industry-leading security technologies and practices.
          </p>
        </div>

        <div>
          <h3>3.1 Encryption</h3>
          <p>
            We use advanced encryption technologies to protect your data:
          </p>
          <ul>
            <li><strong>Transport Security:</strong> 256-bit TLS/SSL encryption for all data transmitted between your device and our servers</li>
            <li><strong>Data at Rest:</strong> AES-256 encryption for sensitive data stored in our databases</li>
            <li><strong>Payment Security:</strong> PCI DSS compliant encryption for payment information</li>
            <li><strong>End-to-End Encryption:</strong> Encrypted communication channels for sensitive interactions</li>
          </ul>
        </div>

        <div>
          <h3>3.2 Access Controls</h3>
          <p>
            We restrict access to personal data through:
          </p>
          <ul>
            <li>Role-based access control (RBAC) limiting employee access to necessary data only</li>
            <li>Multi-factor authentication (MFA) for all administrative accounts</li>
            <li>Strict password policies and regular password rotation requirements</li>
            <li>Audit logs tracking all access to sensitive data</li>
            <li>Principle of least privilege for all system accounts</li>
          </ul>
        </div>

        <div>
          <h3>3.3 Infrastructure Security</h3>
          <p>
            Our infrastructure is protected by:
          </p>
          <ul>
            <li>Enterprise-grade firewalls and intrusion detection systems</li>
            <li>DDoS protection and mitigation</li>
            <li>Regular vulnerability scanning and penetration testing</li>
            <li>Web application firewalls (WAF) protecting against attacks</li>
            <li>Secure data center facilities with physical security controls</li>
          </ul>
        </div>

        <div>
          <h3>3.4 Password Security</h3>
          <p>
            Passwords are protected through:
          </p>
          <ul>
            <li>Industry-standard bcrypt hashing with salt</li>
            <li>Minimum password complexity requirements</li>
            <li>Account lockout after multiple failed login attempts</li>
            <li>Password reset functionality with email verification</li>
            <li>No storage of passwords in plain text</li>
          </ul>
        </div>

        <div>
          <h3>3.5 Monitoring and Incident Response</h3>
          <p>
            We continuously monitor for security threats:
          </p>
          <ul>
            <li>24/7 security monitoring and threat detection</li>
            <li>Real-time alert systems for suspicious activities</li>
            <li>Incident response team on standby</li>
            <li>Regular security assessments and audits</li>
            <li>Compliance with industry standards (ISO 27001, SOC 2)</li>
          </ul>
        </div>

        <div>
          <h3>3.6 Employee Security</h3>
          <p>
            We ensure our employees handle data securely:
          </p>
          <ul>
            <li>Mandatory security training for all employees</li>
            <li>Background checks for employees with data access</li>
            <li>Confidentiality agreements and NDAs</li>
            <li>Regular security awareness training</li>
            <li>Strict data handling procedures</li>
          </ul>
        </div>

        <div>
          <h3>3.7 Your Security Responsibilities</h3>
          <p>
            While we implement strong security measures, you also play a role in protecting your data:
          </p>
          <ul>
            <li>Keep your password confidential and change it regularly</li>
            <li>Do not share your login credentials</li>
            <li>Log out when using shared computers</li>
            <li>Report any suspicious account activity immediately</li>
            <li>Use strong, unique passwords</li>
            <li>Enable two-factor authentication if available</li>
          </ul>
        </div>

        <div>
          <h3>3.8 Security Incident Notification</h3>
          <p>
            In the event of a security incident that compromises your personal data, we will:
          </p>
          <ul>
            <li>Notify you without unreasonable delay</li>
            <li>Provide information about the incident and affected data</li>
            <li>Explain steps we're taking to address the breach</li>
            <li>Provide resources and support</li>
            <li>Comply with all applicable legal notification requirements</li>
          </ul>
        </div>

        <div>
          <h3>3.9 Limitations</h3>
          <p>
            While we implement robust security measures, no system is completely secure. We cannot guarantee absolute security of your data. You use Betflexx at your own risk, and you are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
