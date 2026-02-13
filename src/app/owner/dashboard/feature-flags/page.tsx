'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Flag,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { PremiumPageHeader, PremiumSection, PremiumGrid } from '@/components/owner/PremiumSection';
import { PremiumCard } from '@/components/owner/PremiumCard';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  rolloutPercent: number;
  targetRoles: string[] | null;
  targetUserIds: string[] | null;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '', isEnabled: false, rolloutPercent: 100 });

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/feature-flags');
      if (res.ok) {
        const json = await res.json();
        setFlags(json.flags ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch flags:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const toggleFlag = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/owner/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isEnabled: !current }),
      });
      if (res.ok) await fetchFlags();
    } catch (err) {
      console.error('Failed to toggle:', err);
    }
  };

  const createFlag = async () => {
    if (!newFlag.key.trim() || !newFlag.name.trim()) return;
    try {
      const res = await fetch('/api/owner/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newFlag.key.trim().replaceAll(/\s/g, '_'),
          name: newFlag.name.trim(),
          description: newFlag.description.trim() || null,
          isEnabled: newFlag.isEnabled,
          rolloutPercent: newFlag.rolloutPercent,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewFlag({ key: '', name: '', description: '', isEnabled: false, rolloutPercent: 100 });
        await fetchFlags();
      }
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const deleteFlag = async (id: string) => {
    if (!confirm('Delete this flag?')) return;
    try {
      const res = await fetch(`/api/owner/feature-flags?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchFlags();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Flag className="w-6 h-6 text-gray-900 dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">Toggle features, run experiments, and target users</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLoading(true) || fetchFlags().finally(() => setLoading(false))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-gray-900 dark:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Flag
          </button>
        </div>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/5 p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Feature Flag</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="flag-key" className="block text-gray-600 dark:text-slate-400 text-sm mb-1">Key</label>
              <input
                id="flag-key"
                value={newFlag.key}
                onChange={(e) => setNewFlag((f) => ({ ...f, key: e.target.value }))}
                placeholder="enable_ai_chat_v2"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="flag-name" className="block text-gray-600 dark:text-slate-400 text-sm mb-1">Name</label>
              <input
                id="flag-name"
                value={newFlag.name}
                onChange={(e) => setNewFlag((f) => ({ ...f, name: e.target.value }))}
                placeholder="New AI Chat UI"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="flag-desc" className="block text-gray-600 dark:text-slate-400 text-sm mb-1">Description</label>
              <input
                id="flag-desc"
                value={newFlag.description}
                onChange={(e) => setNewFlag((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="flag-rollout" className="block text-gray-600 dark:text-slate-400 text-sm mb-1">Rollout %</label>
              <input
                id="flag-rollout"
                type="number"
                min={0}
                max={100}
                value={newFlag.rolloutPercent}
                onChange={(e) => {
                const v = Number(e.target.value);
                setNewFlag((f) => ({ ...f, rolloutPercent: Number.isNaN(v) ? 100 : Math.min(100, Math.max(0, v)) }));
              }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFlag.isEnabled}
                  onChange={(e) => setNewFlag((f) => ({ ...f, isEnabled: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-slate-300">Enabled by default</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={createFlag}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-gray-900 dark:text-white"
            >
              <Check className="w-4 h-4" />
              Create
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-slate-300"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-white/5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Flags</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="text-left py-4 px-6 text-gray-600 dark:text-slate-400 font-medium text-sm">Key</th>
                <th className="text-left py-4 px-6 text-gray-600 dark:text-slate-400 font-medium text-sm">Name</th>
                <th className="text-left py-4 px-6 text-gray-600 dark:text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left py-4 px-6 text-gray-600 dark:text-slate-400 font-medium text-sm">Rollout</th>
                <th className="text-left py-4 px-6 text-gray-600 dark:text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-slate-500">
                    <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No feature flags yet. Add one to get started.</p>
                  </td>
                </tr>
              ) : (
                flags.map((f) => (
                  <tr key={f.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:bg-white/5">
                    <td className="py-4 px-6 font-mono text-sm text-violet-400">{f.key}</td>
                    <td className="py-4 px-6">
                      <div>
                        <span className="text-gray-900 dark:text-white">{f.name}</span>
                        {f.description && (
                          <p className="text-gray-500 dark:text-slate-500 text-xs mt-0.5">{f.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleFlag(f.id, f.isEnabled)}
                        className={`flex items-center gap-2 px-2 py-1 rounded ${f.isEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-gray-500 dark:text-slate-500'}`}
                      >
                        {f.isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {f.isEnabled ? 'ON' : 'OFF'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-slate-400">{f.rolloutPercent}%</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => deleteFlag(f.id)}
                        className="p-1.5 rounded text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
