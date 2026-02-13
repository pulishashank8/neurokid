'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
  FileText,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export default function HIPAACompliancePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const credits = [
    { name: 'HIPAA Privacy Rule', desc: 'PHI protection and patient rights', status: 'compliant', coverage: 100 },
    { name: 'HIPAA Security Rule', desc: 'Administrative, physical, technical safeguards', status: 'compliant', coverage: 98 },
    { name: 'HITECH Act', desc: 'Breach notification, EHR', status: 'compliant', coverage: 100 },
    { name: '42 CFR Part 2', desc: 'Substance use records', status: 'monitoring', coverage: 95 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">HIPAA Compliance</h1>
            <p className="text-slate-400 mt-1">Compliance status and ePHI safeguards</p>
          </div>
        </div>
        <Link
          href="/owner/dashboard/data/trust"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          Trust Center
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {credits.map((c, i) => (
          <div
            key={c.name}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{c.name}</h2>
                <p className="text-slate-500 text-sm mt-1">{c.desc}</p>
              </div>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.status === 'compliant' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {c.status === 'compliant' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {c.status}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>Coverage</span>
                <span>{c.coverage}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full"
                  style={{ width: `${c.coverage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
        <h2 className="text-lg font-bold text-white mb-4">ePHI Safeguards</h2>
        <ul className="space-y-3 text-slate-300">
          <li className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-400" />
            PHI encryption at rest and in transit
          </li>
          <li className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            Audit logs for data access
          </li>
          <li className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            RBAC and privacy-first design
          </li>
        </ul>
      </div>
    </div>
  );
}
