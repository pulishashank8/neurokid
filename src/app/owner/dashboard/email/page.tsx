'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Mail,
  Send,
  History,
  FileText,
  Search,
  X,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  PremiumPageHeader,
  PremiumCard,
} from '@/components/owner/PremiumSection';
import { PremiumButton } from '@/components/owner/PremiumButton';

interface EmailRecord {
  id: string;
  subject: string;
  recipientCount: number;
  status: string;
  sentAt: string | null;
  createdAt: string;
  recipientEmails: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface UserOption {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
}

type Tab = 'send' | 'history' | 'templates';

export default function EmailPage() {
  const [tab, setTab] = useState<Tab>('send');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [recipientIds, setRecipientIds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Map<string, UserOption>>(new Map());
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<UserOption[]>([]);
  const [userSearching, setUserSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [emailsTotal, setEmailsTotal] = useState(0);
  const [emailsLoading, setEmailsLoading] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '', category: 'GENERAL' });
  const [templateError, setTemplateError] = useState<string | null>(null);

  const fetchEmails = useCallback(() => {
    setEmailsLoading(true);
    fetch('/api/owner/email')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load email history');
        return r.json();
      })
      .then((d) => {
        setEmails(d.emails ?? []);
        setEmailsTotal(d.total ?? 0);
      })
      .catch(() => setEmails([]))
      .finally(() => setEmailsLoading(false));
  }, []);

  const fetchTemplates = useCallback(() => {
    setTemplatesLoading(true);
    fetch('/api/owner/email/templates')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load templates');
        return r.json();
      })
      .then((d) => setTemplates(d.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, []);

  const [searchError, setSearchError] = useState<string | null>(null);

  const GROUP_KEYWORDS = ['all', 'parents', 'therapist', 'therapists'] as const;

  const searchUsers = useCallback(
    (query?: string) => {
      const q = (query !== undefined ? query : userSearch.trim()).toLowerCase();
      setUserSearching(true);
      setSearchError(null);
      const params = new URLSearchParams();

      // Check if user typed a group keyword: all, parents, therapist
      const isGroup = GROUP_KEYWORDS.includes(q as (typeof GROUP_KEYWORDS)[number]);
      if (isGroup) {
        params.set('group', q === 'therapists' ? 'therapist' : q);
        params.set('limit', '500');
      } else {
        params.set('limit', '50');
        if (q) params.set('search', q);
      }

      fetch(`/api/owner/users?${params}`)
        .then((r) => {
          if (!r.ok) throw new Error(r.status === 401 ? 'Please log in again' : 'Failed to load users');
          return r.json();
        })
        .then((d) => {
          const list = (d.users ?? []) as UserOption[];
          if (isGroup) {
            if (list.length > 0) {
              // Add all users from group as recipients at once
              setRecipientIds((prev) => {
                const next = new Set(prev);
                list.forEach((u) => next.add(u.id));
                return next;
              });
              setSelectedUsers((prev) => {
                const next = new Map(prev);
                list.forEach((u) => next.set(u.id, u));
                return next;
              });
              setUserResults([]);
              setUserSearch('');
            } else {
              setSearchError(`No users found in group "${q}". Try a different group.`);
            }
          } else {
            setUserResults(list.filter((u) => !recipientIds.has(u.id)));
          }
        })
        .catch((err) => {
          setUserResults([]);
          setSearchError(err instanceof Error ? err.message : 'Failed to load users');
        })
        .finally(() => setUserSearching(false));
    },
    [userSearch, recipientIds]
  );

  useEffect(() => {
    if (tab === 'history') fetchEmails();
  }, [tab, fetchEmails]);

  useEffect(() => {
    if (tab === 'templates' || tab === 'send') fetchTemplates();
  }, [tab, fetchTemplates]);

  const applyTemplate = (t: EmailTemplate) => {
    setSubject(t.subject);
    setBody(t.body);
    setSelectedTemplateId(t.id);
  };

  const toggleRecipient = (id: string) => {
    setRecipientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedUsers((m) => {
          const m2 = new Map(m);
          m2.delete(id);
          return m2;
        });
      } else next.add(id);
      return next;
    });
  };

  const addRecipient = (u: UserOption) => {
    setRecipientIds((prev) => new Set(prev).add(u.id));
    setSelectedUsers((prev) => new Map(prev).set(u.id, u));
    setUserResults((r) => r.filter((x) => x.id !== u.id));
  };

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      setSendResult({ ok: false, message: 'Subject and body are required' });
      return;
    }
    if (recipientIds.size === 0) {
      setSendResult({ ok: false, message: 'Select at least one recipient' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/owner/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          recipientUserIds: Array.from(recipientIds),
          templateId: selectedTemplateId || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendResult({ ok: false, message: data.error || 'Failed to send' });
        return;
      }

      setSendResult({
        ok: true,
        message: `Sent to ${data.sentCount}/${data.total} recipients${data.failedCount > 0 ? ` (${data.failedCount} failed)` : ''}`,
      });
      setSubject('');
      setBody('');
      setRecipientIds(new Set());
      setSelectedUsers(new Map());
      setSelectedTemplateId('');
      fetchEmails();
    } catch (err) {
      setSendResult({ ok: false, message: 'Network error' });
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.subject.trim()) {
      setTemplateError('Name and subject are required');
      return;
    }
    setTemplateError(null);
    try {
      const url = editingTemplate
        ? `/api/owner/email/templates/${editingTemplate.id}`
        : '/api/owner/email/templates';
      const res = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingTemplate(null);
        setNewTemplate({ name: '', subject: '', body: '', category: 'GENERAL' });
        fetchTemplates();
      } else {
        setTemplateError(data.error || 'Failed to save template');
      }
    } catch {
      setTemplateError('Network error');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/owner/email/templates/${id}`, { method: 'DELETE' });
    fetchTemplates();
  };

  const tabs: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: 'send', label: 'Send Email', icon: Send },
    { id: 'history', label: 'History', icon: History },
    { id: 'templates', label: 'Templates', icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <PremiumPageHeader
        title="Communication Center"
        subtitle="Send emails, manage templates, and view history"
        breadcrumbs={[
          { label: 'Owner', href: '/owner' },
          { label: 'Dashboard', href: '/owner/dashboard' },
          { label: 'Email' },
        ]}
        actions={
          <PremiumButton
            onClick={() => {
              if (tab === 'history') fetchEmails();
              else if (tab === 'templates') fetchTemplates();
            }}
            variant="secondary"
            icon={RefreshCw}
            size="sm"
          >
            Refresh
          </PremiumButton>
        }
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
      />

      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <PremiumCard variant="glass" className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Template (optional)</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedTemplateId(id);
                const t = templates.find((x) => x.id === id);
                if (t) applyTemplate(t);
              }}
              className="w-full max-w-md px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground"
            >
              <option value="">— None —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Body (HTML supported)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body..."
              rows={8}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Recipients</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.from(recipientIds).map((id) => {
                const u = selectedUsers.get(id) || { id, email: id, displayName: null, username: null };
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm"
                  >
                    {u.email}
                    <button onClick={() => toggleRecipient(id)} className="hover:text-foreground">
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchUsers())}
                  placeholder="Search by email, username, or name... Or type: all, parents, therapist"
                  className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                  aria-label="Search users"
                />
                <PremiumButton
                  onClick={() => searchUsers()}
                  disabled={userSearching}
                  variant="secondary"
                  icon={Search}
                  loading={userSearching}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Search
                </PremiumButton>
                <PremiumButton
                  onClick={() => searchUsers('')}
                  disabled={userSearching}
                  variant="success"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  Load recent
                </PremiumButton>
              </div>
              {searchError && (
                <p className="text-sm text-red-400">{searchError}</p>
              )}
            </div>
            {userResults.length > 0 && (
              <div className="mt-2 p-3 rounded-xl bg-muted/30 border border-border max-h-40 overflow-y-auto">
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addRecipient(u)}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm"
                  >
                    <span className="text-foreground">{u.email}</span>
                    {(u.displayName || u.username) && (
                      <span className="text-muted-foreground ml-2">({u.displayName || u.username})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-muted-foreground text-xs mt-2">
              Search and click to add users. Type <strong>all</strong>, <strong>parents</strong>, or <strong>therapist</strong> and search to add entire groups. Selected: {recipientIds.size}
            </p>
          </div>

          {sendResult && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                sendResult.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {sendResult.ok ? <Check size={20} /> : <AlertCircle size={20} />}
              <span>{sendResult.message}</span>
            </div>
          )}

          <PremiumButton
            onClick={sendEmail}
            disabled={sending || recipientIds.size === 0}
            variant="primary"
            icon={Mail}
            loading={sending}
            className="px-6 py-3"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </PremiumButton>
        </PremiumCard>
      )}

      {tab === 'history' && (
        <PremiumCard variant="glass" className="overflow-hidden">
          {emailsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center">
              <History className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">No emails sent yet</p>
              <p className="text-muted-foreground text-sm mt-1">Emails you send will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4">Subject</th>
                    <th className="p-4">Recipients</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((e) => (
                    <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="text-foreground font-medium">{e.subject}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {e.recipientCount} ({e.recipientEmails?.slice(0, 3).join(', ')}
                        {e.recipientCount > 3 ? '...' : ''})
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            e.status === 'SENT'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : e.status === 'FAILED'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {e.sentAt ? format(new Date(e.sentAt), 'MMM d, yyyy HH:mm') : format(new Date(e.createdAt), 'MMM d')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>
      )}

      {tab === 'templates' && (
        <div className="space-y-6">
          <PremiumCard variant="glass" className="p-6">
            <h2 className="font-bold text-foreground mb-4">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Name</label>
                <input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate((t) => ({ ...t, name: e.target.value }))}
                  placeholder="Template name"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Subject</label>
                <input
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate((t) => ({ ...t, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-xl text-foreground"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-muted-foreground mb-1">Body</label>
              <textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate((t) => ({ ...t, body: e.target.value }))}
                rows={6}
                placeholder="HTML body..."
                className="w-full px-4 py-2 bg-secondary border border-border rounded-xl text-foreground font-mono text-sm"
              />
            </div>
            {templateError && (
              <p className="mt-3 text-sm text-red-400">{templateError}</p>
            )}
            <div className="mt-4 flex gap-2">
              <PremiumButton
                onClick={saveTemplate}
                variant="success"
                size="sm"
              >
                {editingTemplate ? 'Update' : 'Create'}
              </PremiumButton>
              {editingTemplate && (
                <PremiumButton
                  onClick={() => {
                    setEditingTemplate(null);
                    setNewTemplate({ name: '', subject: '', body: '', category: 'GENERAL' });
                    setTemplateError(null);
                  }}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </PremiumButton>
              )}
            </div>
          </PremiumCard>

          <PremiumCard variant="glass" className="overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Saved Templates</h2>
            </div>
            {templatesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No templates yet. Create one above.</div>
            ) : (
              <div className="divide-y divide-border">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">{t.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <PremiumButton
                        onClick={() => {
                          setEditingTemplate(t);
                          setNewTemplate({
                            name: t.name,
                            subject: t.subject,
                            body: t.body,
                            category: t.category,
                          });
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </PremiumButton>
                      <PremiumButton
                        onClick={() => deleteTemplate(t.id)}
                        variant="danger"
                        size="sm"
                      >
                        Delete
                      </PremiumButton>
                      <PremiumButton
                        onClick={() => {
                          applyTemplate(t);
                          setTab('send');
                        }}
                        variant="success"
                        size="sm"
                      >
                        Use
                      </PremiumButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <Link href="/owner/dashboard/notifications" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          View system notifications →
        </Link>
      </div>
    </div>
  );
}
