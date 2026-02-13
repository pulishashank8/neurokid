'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Ban,
  FileText,
  MessageSquare,
  Megaphone,
  Download,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Flag,
} from 'lucide-react';

const exportTypes = [
  { type: 'users', label: 'Users', icon: User },
  { type: 'posts', label: 'Posts', icon: FileText },
  { type: 'messages', label: 'Messages', icon: MessageSquare },
  { type: 'reports', label: 'Reports', icon: Flag },
  { type: 'ai-usage', label: 'AI Usage Logs', icon: Database },
];

export default function ActionsPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [backupRecording, setBackupRecording] = useState(false);
  const [backupResult, setBackupResult] = useState<'ok' | 'error' | null>(null);

  const handleExport = async (type: string) => {
    setExporting(type);
    setExportError(null);
    try {
      const res = await fetch(`/api/owner/export?type=${type}&format=xlsx`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const filename = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]
        ?? `export-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleTriggerBackup = async () => {
    setBackupRecording(true);
    setBackupResult(null);
    try {
      const res = await fetch('/api/owner/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ backupType: 'MANUAL', status: 'SUCCESS' }),
      });
      setBackupResult(res.ok ? 'ok' : 'error');
    } catch {
      setBackupResult('error');
    } finally {
      setBackupRecording(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Owner Action Center</h1>
        <p className="text-muted-foreground mt-1">Quick actions and platform controls</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/owner/dashboard/users"
          className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 hover:border-primary/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <User className="text-blue-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-foreground">View Users</p>
            <p className="text-muted-foreground text-sm">Browse and manage user accounts</p>
          </div>
        </Link>

        <Link
          href="/owner/dashboard/users"
          className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 hover:border-primary/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Ban className="text-red-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-foreground">Ban / Suspend User</p>
            <p className="text-muted-foreground text-sm">From user profile page</p>
          </div>
        </Link>

        <Link
          href="/owner/dashboard/posts"
          className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 hover:border-primary/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <FileText className="text-orange-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-foreground">Remove Post</p>
            <p className="text-muted-foreground text-sm">Moderate from posts dashboard</p>
          </div>
        </Link>

        <Link
          href="/owner/dashboard/comments"
          className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6 hover:border-primary/30 transition-all flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <MessageSquare className="text-cyan-400" size={24} />
          </div>
          <div>
            <p className="font-bold text-foreground">Remove Comment</p>
            <p className="text-muted-foreground text-sm">Moderate from comments dashboard</p>
          </div>
        </Link>
      </div>

      <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Download size={20} />
          Export Platform Data (Excel)
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Download exact data from your database as .xlsx files for reporting and analysis.
        </p>
        {exportError && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle size={16} />
            {exportError}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {exportTypes.map((e) => (
            <button
              key={e.type}
              onClick={() => handleExport(e.type)}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              {exporting === e.type ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <e.icon size={18} />
              )}
              <span>{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Megaphone size={20} />
          Send Announcement
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Broadcast emails or notifications to users.
        </p>
        <Link
          href="/owner/dashboard/email"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-500/30 transition-colors"
        >
          <Megaphone size={18} />
          Go to Email
        </Link>
        <Link
          href="/owner/dashboard/notifications"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-500/30 transition-colors ml-3"
        >
          <Megaphone size={18} />
          Notifications
        </Link>
      </div>

      <div className="bg-card backdrop-blur-xl rounded-2xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Database size={20} />
          Trigger Backup
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Record a manual backup event or view backup status.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleTriggerBackup}
            disabled={backupRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
          >
            {backupRecording ? (
              <Loader2 size={18} className="animate-spin" />
            ) : backupResult === 'ok' ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
              <Database size={18} />
            )}
            <span>
              {backupRecording ? 'Recording...' : backupResult === 'ok' ? 'Recorded' : 'Record Backup'}
            </span>
          </button>
          <Link
            href="/owner/dashboard/backups"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-accent transition-colors"
          >
            View Backup Status
          </Link>
        </div>
      </div>
    </div>
  );
}
