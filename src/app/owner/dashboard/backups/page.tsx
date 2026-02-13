'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import {
  PremiumPageHeader,
  PremiumCard,
  PremiumStatCard,
  PremiumGrid,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface BackupStatus {
  lastBackup: { createdAt: string; status: string; sizeBytes?: string } | null;
  recoveryPoints: { createdAt: string; status: string }[];
  backupHealth: string[];
  isStale: boolean;
  frequency: string;
}

export default function BackupsPage() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/backups');
      if (res.ok) {
        const data = await res.json();
        if (data.lastBackup?.createdAt) {
          data.lastBackup.createdAt = new Date(data.lastBackup.createdAt);
        }
        data.recoveryPoints = (data.recoveryPoints ?? []).map((p: { createdAt: string }) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }));
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch backup status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const recordManual = async () => {
    setRecording(true);
    try {
      const res = await fetch('/api/owner/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupType: 'MANUAL', status: 'SUCCESS' }),
      });
      if (res.ok) await fetchStatus();
    } catch (err) {
      console.error('Failed to record:', err);
    } finally {
      setRecording(false);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const last = status?.lastBackup;

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Backup & Recovery"
        subtitle="Monitor backup health and recovery points"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Backups' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <PremiumButton
              onClick={() => setLoading(true) || fetchStatus().finally(() => setLoading(false))}
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              size="sm"
            >
              Refresh
            </PremiumButton>
            <PremiumButton
              onClick={recordManual}
              disabled={recording}
              variant="success"
              icon={Plus}
              loading={recording}
              size="sm"
            >
              {recording ? 'Recording…' : 'Record Backup'}
            </PremiumButton>
          </div>
        }
        gradient="from-teal-600 via-cyan-600 to-blue-600"
      />

      {status?.isStale && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <PremiumCard variant="glass" className="p-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Backup may be stale — last backup was over 36 hours ago.</span>
            </div>
          </PremiumCard>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PremiumCard variant="glass" className="h-full p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-lg font-bold text-foreground">Last Backup</h2>
          </div>
          {last ? (
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatDistanceToNow(new Date(last.createdAt), { addSuffix: true })}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date(last.createdAt).toLocaleString()}
              </p>
              <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-xs font-medium ${last.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                {last.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {last.status}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">No backup events recorded yet</p>
          )}
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <PremiumCard variant="glass" className="h-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h2 className="text-lg font-bold text-foreground">Frequency</h2>
            </div>
            <p className="text-xl text-foreground">{status?.frequency ?? 'Every 24h'}</p>
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PremiumCard variant="glass" className="h-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-foreground">Backup Health</h2>
            </div>
            <div className="flex gap-1">
              {(status?.backupHealth ?? []).slice(0, 5).map((s, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full ${s === 'SUCCESS' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  title={s}
                />
              ))}
              {(status?.backupHealth ?? []).length === 0 && (
                <span className="text-muted-foreground text-sm">No data</span>
              )}
            </div>
          </PremiumCard>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <PremiumCard variant="glass" className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recovery Points</h2>
          <ul className="space-y-2">
            {(status?.recoveryPoints ?? []).length === 0 ? (
              <li className="text-muted-foreground">No recovery points yet</li>
            ) : (
              status?.recoveryPoints.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-1">
                  <span className="text-foreground">{p.createdAt.toLocaleString()}</span>
                  <span className={`text-xs font-medium ${p.status === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{p.status}</span>
                </li>
              ))
            )}
          </ul>
        </PremiumCard>
      </motion.div>
    </div>
  );
}
