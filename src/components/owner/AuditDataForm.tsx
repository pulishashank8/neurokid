'use client';

import { useState } from 'react';
import { Users, Download, Loader2 } from 'lucide-react';

interface AuditReport {
  exportDate: string;
  userId: string;
  email: string;
  accountCreated: string;
  lastLogin: string | null;
  profile: {
    username: string;
    displayName: string;
    bio: string | null;
  } | null;
  dataSummary: Record<string, number>;
  consents: Array<{
    consentType: string;
    hasGranted: boolean;
    grantedAt: string | null;
  }>;
}

export default function AuditDataForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAudit() {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('/api/governance/audit-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch audit data');
        return;
      }

      setReport(data.data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-data-audit-${report.userId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
        <Users size={20} className="text-purple-400" />
        Privacy Requests (GDPR/CCPA)
      </h3>

      <div className="flex gap-4 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email address..."
          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
        />
        <button
          onClick={handleAudit}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Auditing...
            </>
          ) : (
            'Audit Data'
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Generate a full data export JSON or anonymize user records. Requires 'Admin' role.
      </p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {report && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div>
              <p className="text-emerald-400 font-bold">Audit Report Generated</p>
              <p className="text-slate-400 text-sm">User: {report.email}</p>
            </div>
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-medium"
            >
              <Download size={14} />
              Download JSON
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(report.dataSummary).map(([key, value]) => (
              <div key={key} className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-slate-500 capitalize">{key}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="text-white font-bold mb-2">Profile</h4>
            {report.profile ? (
              <div className="text-sm text-slate-400 space-y-1">
                <p>Username: <span className="text-white">@{report.profile.username}</span></p>
                <p>Display Name: <span className="text-white">{report.profile.displayName}</span></p>
                {report.profile.bio && <p>Bio: {report.profile.bio}</p>}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No profile created</p>
            )}
          </div>

          {report.consents.length > 0 && (
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-bold mb-2">Consents</h4>
              <div className="space-y-2">
                {report.consents.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 capitalize">{c.consentType.replace('_', ' ')}</span>
                    <span className={c.hasGranted ? 'text-emerald-400' : 'text-red-400'}>
                      {c.hasGranted ? 'Granted' : 'Not Granted'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
