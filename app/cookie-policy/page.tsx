import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Betflexx',
  description: 'Learn how Betflexx uses cookies and similar technologies.',
};

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1>Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit our website or use our service. They contain information about your browsing behavior and preferences, allowing us to remember you and enhance your experience.
          </p>

          <h2>2. Types of Cookies We Use</h2>

          <h3>2.1 Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core functionality such as:
          </p>
          <ul>
            <li>User authentication and login</li>
            <li>Session management</li>
            <li>Security and fraud prevention</li>
            <li>Load balancing</li>
          </ul>

          <h3>2.2 Performance Cookies</h3>
          <p>
            These cookies help us understand how users interact with our service and collect analytics data:
          </p>
          <ul>
            <li>Page views and traffic sources</li>
            <li>User engagement metrics</li>
            <li>Error tracking and debugging</li>
            <li>Site performance optimization</li>
          </ul>

          <h3>2.3 Functional Cookies</h3>
          <p>
            These cookies remember your preferences and enable personalized features:
          </p>
          <ul>
            <li>Language preferences</li>
            <li>Theme selection (dark/light mode)</li>
            <li>Saved filters and settings</li>
            <li>Personalized recommendations</li>
          </ul>

          <h3>2.4 Marketing Cookies</h3>
          <p>
            These cookies are used to track your activity across websites and deliver targeted advertising:
          </p>
          <ul>
            <li>Retargeting and remarketing campaigns</li>
            <li>Interest-based advertising</li>
            <li>Campaign effectiveness measurement</li>
            <li>Cross-site tracking</li>
          </ul>

          <h2>3. Third-Party Cookies</h2>
          <p>
            We work with trusted third-party partners who may set cookies on our behalf:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> For website analytics and user behavior tracking</li>
            <li><strong>Mixpanel:</strong> For event tracking and user analytics</li>
            <li><strong>Facebook Pixel:</strong> For marketing and conversion tracking</li>
            <li><strong>Payment Processors:</strong> Paystack and other payment service cookies</li>
            <li><strong>Advertising Networks:</strong> For targeted ads and campaign measurement</li>
          </ul>

          <h2>4. Cookie Duration</h2>
          <ul>
            <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent Cookies:</strong> Remain on your device for extended periods (up to 2 years)</li>
          </ul>

          <h2>5. Managing Your Cookie Preferences</h2>
          <p>
            You can control cookies through your browser settings:
          </p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Privacy, search, and services → Clear browsing data</li>
          </ul>

          <h2>6. Opt-Out Options</h2>
          <p>
            You can opt out of specific cookie types:
          </p>
          <ul>
            <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank">Google Analytics Opt-out</a></li>
            <li><a href="https://www.aboutads.info/choices/" target="_blank">Digital Advertising Alliance Opt-out</a></li>
            <li><a href="https://www.youradchoices.com/" target="_blank">Your Ad Choices</a></li>
          </ul>

          <h2>7. Do Not Track</h2>
          <p>
            Some browsers include a "Do Not Track" (DNT) feature. While we respect DNT signals, many third-party services may not honor them. We will make efforts to comply with DNT requests where technically feasible.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            Betflexx may update this Cookie Policy periodically. We will notify you of material changes by posting the updated policy on our website.
          </p>

          <h2>9. Contact Us</h2>
          <p>
            For questions about our Cookie Policy, please contact us at privacy@betflexx.com
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            © 2024 Betflexx. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
