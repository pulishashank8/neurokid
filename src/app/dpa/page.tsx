"use client";

import { FileText, Shield, Database, Lock, UserCheck, Mail } from "lucide-react";
import Link from "next/link";

export default function DataProcessingAgreementPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-semibold mb-4">
            <FileText className="w-4 h-4" />
            For Business Customers
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-4">
            Data Processing Agreement
          </h1>
          <p className="text-[var(--muted)]">
            GDPR-compliant data processing terms for organizations
          </p>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-premium space-y-8">
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/20 p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200/80">
              <strong>Note:</strong> This Data Processing Agreement (DPA) applies to organizations 
              using NeuroKid&apos;s services. Individual users are covered by our{" "}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--primary)]" />
              Parties to This Agreement
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                This Data Processing Agreement (&quot;DPA&quot;) is entered into between:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[var(--text)]">Data Controller:</strong> The organization 
                  using NeuroKid services (the &quot;Customer&quot;)
                </li>
                <li>
                  <strong className="text-[var(--text)]">Data Processor:</strong> NeuroKid, Inc. 
                  (the &quot;Processor&quot;), a provider of autism support and communication tools
                </li>
              </ul>
              <p>
                This DPA supplements the Terms of Service and reflects the parties&apos; agreement 
                regarding the processing of personal data under applicable data protection laws, 
                including the GDPR and CCPA.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Definitions</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[var(--text)]">Personal Data:</strong> Any information 
                  relating to an identified or identifiable natural person (&quot;Data Subject&quot;)
                </li>
                <li>
                  <strong className="text-[var(--text)]">Processing:</strong> Any operation performed 
                  on Personal Data, including collection, storage, use, disclosure, or deletion
                </li>
                <li>
                  <strong className="text-[var(--text)]">Data Subject:</strong> The individual to 
                  whom Personal Data relates (e.g., patients, clients, students)
                </li>
                <li>
                  <strong className="text-[var(--text)]">Subprocessor:</strong> A third-party 
                  processor engaged by the Data Processor to assist in providing services
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[var(--primary)]" />
              Scope and Purpose of Processing
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                NeuroKid will process Personal Data only for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Providing AAC (Augmentative and Alternative Communication) tools</li>
                <li>Therapy session tracking and logging</li>
                <li>Generating emergency information cards</li>
                <li>Daily progress and milestone tracking</li>
                <li>Community support features (where applicable)</li>
                <li>Technical support and customer service</li>
              </ul>
              <p>
                Processing shall be limited to what is necessary to provide these services 
                and shall not be used for any other purpose without explicit consent.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              Data Security Measures
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>NeuroKid implements the following technical and organizational measures:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Role-based access controls with principle of least privilege</li>
                <li>Regular security audits and penetration testing</li>
                <li>Employee background checks and security training</li>
                <li>Incident response procedures with 24-hour notification</li>
                <li>Business continuity and disaster recovery plans</li>
                <li>SOC 2 Type II certified infrastructure</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Subprocessors</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>NeuroKid engages the following subprocessors:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-[var(--surface2)]">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Subprocessor</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3 rounded-tr-lg">Data Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">Vercel Inc.</td>
                      <td className="px-4 py-3">USA (EU data available)</td>
                      <td className="px-4 py-3">Hosting & CDN</td>
                      <td className="px-4 py-3">All data types</td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">Amazon Web Services</td>
                      <td className="px-4 py-3">USA / EU</td>
                      <td className="px-4 py-3">Database storage</td>
                      <td className="px-4 py-3">All data types</td>
                    </tr>
                    <tr className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">SendGrid (Twilio)</td>
                      <td className="px-4 py-3">USA</td>
                      <td className="px-4 py-3">Email delivery</td>
                      <td className="px-4 py-3">Email addresses</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Stripe Inc.</td>
                      <td className="px-4 py-3">USA</td>
                      <td className="px-4 py-3">Payment processing</td>
                      <td className="px-4 py-3">Payment data</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm">
                We will notify Customers of any changes to our subprocessors at least 30 days 
                in advance. Customers may object to new subprocessors by contacting us.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[var(--primary)]" />
              Data Subject Rights
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>NeuroKid assists the Data Controller in responding to Data Subject requests:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-[var(--text)]">Access:</strong> Data export functionality 
                  available via API and dashboard
                </li>
                <li>
                  <strong className="text-[var(--text)]">Rectification:</strong> Self-service editing 
                  through the application interface
                </li>
                <li>
                  <strong className="text-[var(--text)]">Erasure:</strong> Automated deletion workflows 
                  with 30-day grace period
                </li>
                <li>
                  <strong className="text-[var(--text)]">Portability:</strong> JSON export format for 
                  easy data transfer
                </li>
                <li>
                  <strong className="text-[var(--text)]">Restriction:</strong> Account suspension 
                  capabilities for legal holds
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Data Breach Notification</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                In the event of a Personal Data breach, NeuroKid will:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Notify the Data Controller without undue delay and no later than 24 hours after discovery</li>
                <li>Provide details about the nature of the breach, affected data subjects, and likely consequences</li>
                <li>Describe measures taken or proposed to address the breach</li>
                <li>Cooperate with the Data Controller in notifying relevant supervisory authorities if required</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Data Retention and Deletion</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                Personal Data is retained only as long as necessary for the provision of services 
                or as required by applicable law. Upon termination of the agreement:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>All Personal Data will be deleted within 90 days, unless legally required to retain</li>
                <li>Aggregated, anonymized statistics may be retained for analytics purposes</li>
                <li>Data Controller may request early deletion via written notice</li>
                <li>Certificate of destruction available upon request</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[var(--primary)]" />
              Contact Information
            </h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                For questions about this DPA, data protection inquiries, or to exercise your rights, 
                please contact our Data Protection Officer:
              </p>
              <div className="bg-[var(--surface2)] rounded-xl p-4">
                <p className="text-[var(--text)] font-medium">NeuroKid Data Protection Officer</p>
                <p className="text-sm">Email: privacy@neurokid.help</p>
                <p className="text-sm">Address: Available upon request</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Changes to This Agreement</h2>
            <div className="space-y-4 text-[var(--muted)]">
              <p>
                NeuroKid may update this DPA to reflect changes in our practices or legal requirements. 
                We will provide at least 30 days&apos; notice of material changes. Continued use of our 
                services after changes constitutes acceptance of the updated DPA.
              </p>
            </div>
          </section>

          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-xs text-[var(--muted)] text-center">
              Last updated: February 2026 | Version 1.0
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
          <span className="text-[var(--muted)]">•</span>
          <Link
            href="/cookies"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
