"use client";

import { FileText, Users, AlertTriangle, Scale, Shield, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-semibold mb-4">
            <FileText className="w-4 h-4" />
            Legal Agreement
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-4">Terms of Service</h1>
          <p className="text-[var(--muted)]">Please read these terms carefully before using NeuroKid</p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-premium space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--primary)]" />
              Acceptance of Terms
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                By accessing or using NeuroKid, you agree to be bound by these Terms of Service and all 
                applicable laws and regulations. If you do not agree with any of these terms, you may not 
                use our service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--primary)]" />
              Account Responsibilities
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>When you create an account with us, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Not share your account with others</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
              Community Guidelines
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>When participating in our community, you agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Post content that is harmful, abusive, or harassing</li>
                <li>Share false or misleading medical information</li>
                <li>Impersonate others or misrepresent your identity</li>
                <li>Spam or advertise without permission</li>
                <li>Share private information about others without consent</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
              <p>
                We reserve the right to remove content and suspend accounts that violate these guidelines.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Disclaimer of Warranties
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                NeuroKid is provided "as is" without warranties of any kind. We do not guarantee that:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The service will be uninterrupted or error-free</li>
                <li>The information provided is complete or accurate</li>
                <li>The service will meet your specific requirements</li>
                <li>Any errors will be corrected</li>
              </ul>
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-900/20 p-4 mt-4">
                <p className="text-amber-800 dark:text-amber-200/80 text-sm">
                  <strong>Important:</strong> NeuroKid does not provide medical advice. Always consult 
                  qualified healthcare professionals for medical decisions. See our{" "}
                  <Link href="/disclaimer" className="underline">Medical Disclaimer</Link> for more details.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Limitation of Liability</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                To the maximum extent permitted by law, NeuroKid and its operators shall not be liable for 
                any indirect, incidental, special, consequential, or punitive damages arising from your use 
                of the service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              Intellectual Property
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                The NeuroKid service and its original content (excluding user-generated content) remain 
                the property of NeuroKid. You retain ownership of content you post, but grant us a license 
                to use, display, and distribute it on our platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Termination</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                We may terminate or suspend your account at any time for violations of these terms. 
                You may also delete your account at any time through your account settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Changes to Terms</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                We reserve the right to modify these terms at any time. We will notify users of significant 
                changes. Continued use of the service after changes constitutes acceptance of the new terms.
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
            href="/privacy"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
