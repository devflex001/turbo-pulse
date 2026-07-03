'use client';

import Link from 'next/link';
import { Heart, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'About Betflexx', href: '/about' },
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Mobile App', href: '/mobile' },
        { label: 'Status', href: 'https://status.betflexx.com' },
      ],
    },
    {
      title: 'Betting',
      links: [
        { label: 'Sports Betting', href: '/sports' },
        { label: 'Live Betting', href: '/live' },
        { label: 'Odds', href: '/odds' },
        { label: 'How to Bet', href: '/how-to-bet' },
        { label: 'Betting Tips', href: '/tips' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Sign Up', href: '/sign-up' },
        { label: 'Sign In', href: '/sign-in' },
        { label: 'My Account', href: '/dashboard' },
        { label: 'My Bets', href: '/my-bets' },
        { label: 'Settings', href: '/settings' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Report Issue', href: '/report' },
        { label: 'Community', href: '/community' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', href: '/terms-of-service' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
        { label: 'Responsible Gambling', href: '/responsible-gambling' },
        { label: 'Licenses', href: '/licenses' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Documentation', href: '/docs' },
        { label: 'API', href: '/api' },
        { label: 'Developers', href: '/developers' },
        { label: 'Careers', href: '/careers' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/betflexx', label: 'Twitter' },
    { icon: Heart, href: 'https://facebook.com/betflexx', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/betflexx', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/betflexx', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com/betflexx', label: 'GitHub' },
  ];

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@betflexx.com', href: 'mailto:support@betflexx.com' },
    { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
    { icon: MapPin, label: 'Office', value: 'San Francisco, CA, USA', href: '#' },
  ];

  return (
    <footer className="relative border-t border-border bg-background">
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top Section - Logo and Description */}
        <div className="mb-12 grid gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">Betflexx</h3>
              <p className="text-sm text-muted-foreground">
                Your premier destination for sports betting and live gaming. Fast, secure, and fair.
              </p>
            </div>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="font-semibold">Get In Touch</h4>
            {contactInfo.map((info) => {
              const Icon = info.icon;
              return (
                <a
                  key={info.label}
                  href={info.href}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{info.value}</span>
                </a>
              );
            })}
          </div>

          {/* Download Apps */}
          <div className="space-y-3">
            <h4 className="font-semibold">Download App</h4>
            <div className="space-y-2">
              <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
                </svg>
                App Store
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" />
                </svg>
                Google Play
              </button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Links Grid */}
        <div className="my-12 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h4 className="font-semibold text-foreground">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') || link.href.startsWith('https') ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        {/* Bottom Section */}
        <div className="mt-12 space-y-4">
          {/* Newsletter */}
          <div className="rounded-lg border border-border bg-accent/50 p-6">
            <div className="mx-auto max-w-2xl">
              <h3 className="mb-2 font-semibold">Stay Updated</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Subscribe to our newsletter for betting tips, promotions, and updates.
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Copyright and Bottom Links */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Betflexx. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="transition-colors hover:text-foreground">
                Terms
              </Link>
              <Link href="/cookie-policy" className="transition-colors hover:text-foreground">
                Cookies
              </Link>
              <Link href="/sitemap" className="transition-colors hover:text-foreground">
                Sitemap
              </Link>
            </div>
          </div>

          {/* Compliance and Responsible Gambling */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-accent/30 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Responsible Gambling</p>
            <p>
              Betflexx is licensed and regulated. We're committed to responsible gambling. If you're struggling with gambling, please seek help. Visit
              {' '}
              <Link href="/responsible-gambling" className="text-primary hover:underline">
                our resources
              </Link>
              {' '}or contact Gamblers Anonymous.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Accent Line */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
    </footer>
  );
}
