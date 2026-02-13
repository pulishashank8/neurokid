'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  RefreshCw,
  Sun,
  BarChart3,
  FileText,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Send,
} from 'lucide-react';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface DigestConfig {
  id: string;
  digestType: string;
  isEnabled: boolean;
  sendTime: string;
  recipientEmail: string;
  lastSentAt: string | null;
}

const TYPE_CONFIG: Record<string, { icon: typeof Sun; label: string; desc: string }> = {
  DAILY: {
    icon: Sun,
    label: 'Daily Morning Brief',
    desc: '8:00 AM — New signups, errors, anomalies, AI insights',
  },
  WEEKLY: {
    icon: BarChart3,
    label: 'Weekly Analytics',
    desc: 'Monday 9:00 AM — Growth, retention, automation, costs',
  },
  MONTHLY: {
    icon: FileText,
    label: 'Monthly Executive',
    desc: '1st of month — MoM growth, BI report, compliance',
  },
};

export default function DigestPage() {
  const [configs, setConfigs] = useState<DigestConfig[]>([]);
  const [draftEmails, setDraftEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/digest/settings');
      if (res.ok) {
        const json = await res.json();
        setConfigs(json.configs ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch digest settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const updateConfig = async (digestType: string, updates: Partial<DigestConfig>) => {
    try {
      const res = await fetch('/api/owner/digest/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestType, ...updates }),
      });
      if (res.ok) await fetchConfigs();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const sendTestNow = async (type: string) => {
    const email = (draftEmails[type] ?? configs.find((c) => c.digestType === type)?.recipientEmail ?? '').trim();
    if (!email) {
      setSendError('Enter recipient email first');
      return;
    }
    setSending(type);
    setSendError(null);
    try {
      const res = await fetch('/api/owner/digest/send-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, recipientEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || 'Failed to send');
        return;
      }
      await fetchConfigs();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(null);
    }
  };

  const syncDraftFromConfigs = () => {
    const next: Record<string, string> = {};
    for (const c of configs) {
      next[c.digestType] = c.recipientEmail ?? '';
    }
    setDraftEmails((prev) => ({ ...next, ...prev }));
  };
  useEffect(() => { syncDraftFromConfigs(); }, [configs]);

  const ensureConfig = (type: string): DigestConfig => {
    const c = configs.find((x) => x.digestType === type);
    return (
      c ?? {
        id: '',
        digestType: type,
        isEnabled: false,
        sendTime: type === 'DAILY' ? '08:00' : '09:00',
        recipientEmail: '',
        lastSentAt: null,
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <PremiumPageHeader
        title="Email Digest Settings"
        subtitle="Configure automated daily, weekly, and monthly owner reports"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Digest' }
        ]}
        actions={
          <PremiumButton
            onClick={() => {
              setLoading(true);
              fetchConfigs().finally(() => setLoading(false));
            }}
            variant="secondary"
            size="sm"
            icon={RefreshCw}
          >
            Refresh
          </PremiumButton>
        }
        gradient="from-amber-500 via-orange-500 to-red-600"
      />

      {sendError && (
        <motion.div variants={item}>
          <PremiumCard variant="gradient" className="border-rose-500/30 bg-rose-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20">
                <Mail className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="font-medium text-rose-600 dark:text-rose-400">Failed to send digest</p>
                <p className="text-sm text-muted-foreground mt-0.5">{sendError}</p>
              </div>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      <PremiumGrid cols={3}>
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((type, i) => {
          const config = ensureConfig(type);
          const { icon: Icon, label, desc } = TYPE_CONFIG[type];
          
          const gradients = {
            DAILY: 'from-amber-500 to-orange-600',
            WEEKLY: 'from-blue-500 to-indigo-600',
            MONTHLY: 'from-purple-500 to-pink-600',
          };

          return (
            <motion.div key={type} variants={item}>
              <PremiumCard variant="glass" className="h-full">
                <div className="flex flex-col h-full">
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradients[type]} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{label}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <button
                      onClick={() => updateConfig(type, { isEnabled: !config.isEnabled })}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        config.isEnabled
                          ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20'
                      }`}
                    >
                      <span className={`font-medium text-sm ${config.isEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {config.isEnabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Recipient Email Input */}
                  <div className="mb-4">
                    <label 
                      htmlFor={`digest-recipient-${type}`} 
                      className="block text-sm font-medium text-muted-foreground mb-2"
                    >
                      Recipient Email
                    </label>
                    <input
                      id={`digest-recipient-${type}`}
                      type="email"
                      value={draftEmails[type] ?? config.recipientEmail ?? ''}
                      onChange={(e) => setDraftEmails((p) => ({ ...p, [type]: e.target.value }))}
                      onBlur={async () => {
                        const v = (draftEmails[type] ?? config.recipientEmail ?? '').trim();
                        if (v !== (config.recipientEmail ?? '')) {
                          await updateConfig(type, { recipientEmail: v });
                        }
                      }}
                      placeholder="owner@neurokid.help"
                      className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Last Sent Info */}
                  {config.lastSentAt && (
                    <div className="mb-4 p-3 rounded-lg bg-background/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Last sent:</span>{' '}
                        {new Date(config.lastSentAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border/50">
                    <a
                      href={`/api/owner/digest/preview?type=${type}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-cyan-400 hover:from-cyan-500/20 hover:to-blue-500/20 text-sm font-medium transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview
                    </a>
                    <button
                      onClick={() => sendTestNow(type)}
                      disabled={!!sending || !(draftEmails[type] ?? config.recipientEmail)?.trim()}
                      className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/20 hover:to-teal-500/20 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending === type ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          );
        })}
      </PremiumGrid>

      {/* Info Section */}
      <motion.div variants={item}>
        <PremiumSection
          title="How Email Digests Work"
          subtitle="Automated reports to keep you informed"
          icon={Mail}
          gradient="from-violet-500 to-purple-600"
        >
          <PremiumCard variant="gradient" className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20 h-fit">
                  <Sun className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Daily Brief</h4>
                  <p className="text-sm text-muted-foreground">
                    Sent every morning at 8:00 AM with overnight activity, new signups, system errors, and AI insights.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 h-fit">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Weekly Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Sent every Monday at 9:00 AM with growth metrics, user retention, and cost analysis.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20 h-fit">
                  <FileText className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Monthly Executive</h4>
                  <p className="text-sm text-muted-foreground">
                    Sent on the 1st of each month with business intelligence, compliance status, and MoM growth.
                  </p>
                </div>
              </div>
            </div>
          </PremiumCard>
        </PremiumSection>
      </motion.div>
    </motion.div>
  );
}
