"use client";

import { Cookie, Shield, Settings, Eye, Database, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-4">
            <Cookie className="w-4 h-4" />
            Cookie Transparency
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-4">Cookie Policy</h1>
          <p className="text-[var(--muted)]">How we use cookies and similar technologies</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-premium space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">What Are Cookies</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                Cookies are small text files stored on your device when you visit a website. 
                They help us provide you with a better experience by remembering your preferences, 
                keeping you signed in, and understanding how you use our platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--primary)]" />
              Types of Cookies We Use
            </h2>
            <div className="space-y-6 text-[var(--muted)]">
              <div className="bg-[var(--surface2)] rounded-xl p-4">
                <h3 className="font-semibold text-[var(--text)] mb-2">Essential Cookies</h3>
                <p className="text-sm mb-2">
                  Required for the website to function properly. These cannot be disabled.
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Session management and authentication</li>
                  <li>Security and fraud prevention</li>
                  <li>Load balancing and performance</li>
                </ul>
              </div>

              <div className="bg-[var(--surface2)] rounded-xl p-4">
                <h3 className="font-semibold text-[var(--text)] mb-2">Functional Cookies</h3>
                <p className="text-sm mb-2">
                  Enable enhanced functionality and personalization.
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Language preferences</li>
                  <li>Theme settings (dark/light mode)</li>
                  <li>Accessibility preferences</li>
                  <li>Recently viewed content</li>
                </ul>
              </div>

              <div className="bg-[var(--surface2)] rounded-xl p-4">
                <h3 className="font-semibold text-[var(--text)] mb-2">Analytics Cookies</h3>
                <p className="text-sm mb-2">
                  Help us understand how visitors interact with our website.
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Page views and navigation patterns</li>
                  <li>Feature usage statistics</li>
                  <li>Error monitoring and debugging</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--primary)]" />
              Specific Cookies We Use
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[var(--surface2)]">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Cookie Name</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3 rounded-tr-lg">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted)]">
                  <tr className="border-b border-[var(--border)]">
                    <td className="px-4 py-3 font-mono text-xs">next-auth.session-token</td>
                    <td className="px-4 py-3">User authentication</td>
                    <td className="px-4 py-3">30 days</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="px-4 py-3 font-mono text-xs">theme</td>
                    <td className="px-4 py-3">Dark/light mode preference</td>
                    <td className="px-4 py-3">1 year</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]">
                    <td className="px-4 py-3 font-mono text-xs">cookie-consent</td>
                    <td className="px-4 py-3">Stores cookie preferences</td>
                    <td className="px-4 py-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">_vercel/others</td>
                    <td className="px-4 py-3">Performance and analytics</td>
                    <td className="px-4 py-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--primary)]" />
              Third-Party Services
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>We use the following third-party services that may set cookies:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-[var(--text)]">Vercel Analytics:</strong> For performance monitoring and basic analytics</li>
                <li><strong className="text-[var(--text)]">Cloudflare:</strong> For security and CDN services</li>
                <li><strong className="text-[var(--text)]">Stripe:</strong> For payment processing (when using premium features)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              Managing Your Preferences
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>You can manage cookies in the following ways:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use our cookie consent banner to accept or decline non-essential cookies</li>
                <li>Change your browser settings to block or delete cookies</li>
                <li>Use browser&apos;s incognito/private mode for temporary browsing</li>
              </ul>
              <p className="text-sm">
                <strong className="text-[var(--text)]">Note:</strong> Disabling essential cookies 
                may prevent certain features from working properly.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[var(--primary)]" />
              How to Delete Cookies
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>You can delete cookies through your browser settings:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-[var(--text)]">Chrome:</strong> Settings → Privacy → Clear browsing data</li>
                <li><strong className="text-[var(--text)]">Firefox:</strong> Options → Privacy → Clear History</li>
                <li><strong className="text-[var(--text)]">Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong className="text-[var(--text)]">Edge:</strong> Settings → Privacy → Clear browsing data</li>
              </ul>
            </div>
          </section>

          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-xs text-[var(--muted)] text-center">
              Last updated: February 2026
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link
            href="/privacy"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Privacy Policy
          </Link>
          <span className="text-[var(--muted)]">•</span>
          <Link
            href="/terms"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
