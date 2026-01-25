"use client";

import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-4">
            <Shield className="w-4 h-4" />
            Your Privacy Matters
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-4">Privacy Policy</h1>
          <p className="text-[var(--muted)]">How we collect, use, and protect your information</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-premium space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--primary)]" />
              Information We Collect
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>We collect information you provide directly to us:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-[var(--text)]">Account Information:</strong> Email address and password when you register</li>
                <li><strong className="text-[var(--text)]">Profile Information:</strong> Username, display name, and optional bio</li>
                <li><strong className="text-[var(--text)]">Content:</strong> Posts, comments, and other content you share in the community</li>
                <li><strong className="text-[var(--text)]">Therapy Logs:</strong> Session information you choose to record (stored securely and only visible to you)</li>
                <li><strong className="text-[var(--text)]">Emergency Cards:</strong> Child information you create for emergency cards (stored securely and only visible to you)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--primary)]" />
              How We Use Your Information
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Enable community features like posting and commenting</li>
                <li>Store your personal tools data (therapy logs, emergency cards)</li>
                <li>Send you important service-related communications</li>
                <li>Respond to your requests and provide support</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--primary)]" />
              Data Security
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>We take the security of your data seriously:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>All data is encrypted in transit using HTTPS</li>
                <li>Passwords are hashed using industry-standard algorithms</li>
                <li>Personal tools data (therapy logs, emergency cards) is only accessible by you</li>
                <li>We regularly review our security practices</li>
              </ul>
              <p>
                While we implement safeguards, no method of transmission or storage is 100% secure. 
                We cannot guarantee absolute security of your data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[var(--primary)]" />
              Your Rights
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Information Sharing</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>We do not sell your personal information. We may share information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights, privacy, safety, or property</li>
                <li>In connection with a merger or acquisition (you would be notified)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Children's Privacy</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                NeuroKid is intended for parents and caregivers of children. We do not knowingly collect 
                personal information from children under 13. If you believe a child has provided us with 
                personal information, please contact us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[var(--primary)]" />
              Contact Us
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us through 
                the platform or reach out to our support team.
              </p>
            </div>
          </section>

          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-xs text-[var(--muted)] text-center">
              Last updated: January 2026
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/disclaimer"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Medical Disclaimer
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
