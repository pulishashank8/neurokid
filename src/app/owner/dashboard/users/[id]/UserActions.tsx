'use client';

import { useState } from 'react';
import { Ban, ShieldCheck, StickyNote, Plus, Trash2, X, AlertTriangle, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: string;
  note: string;
  createdAt: Date | string;
}

interface UserActionsProps {
  userId: string;
  isBanned: boolean;
  bannedReason: string | null;
  initialNotes: Note[];
}

export default function UserActions({ userId, isBanned, bannedReason, initialNotes }: UserActionsProps) {
  const [banned, setBanned] = useState(isBanned);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExportData(format: 'json' | 'csv' = 'json') {
    setExporting(true);
    try {
      const res = await fetch(`/api/owner/users/${userId}/export?format=${format}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neurokind-export-${userId}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleWarn() {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/users/${userId}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: warnReason || undefined }),
      });
      if (res.ok) {
        setShowWarnModal(false);
        setWarnReason('');
      }
    } catch (error) {
      console.error('Error sending warning:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBan() {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      });
      if (res.ok) {
        setBanned(true);
        setShowBanModal(false);
        setBanReason('');
      }
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnban() {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/users/${userId}/ban`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBanned(false);
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/users/${userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setNewNote('');
        setShowNoteModal(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const res = await fetch(`/api/owner/users/${userId}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  return (
    <>
      <div className="flex gap-3 mb-6">
        {banned ? (
          <button
            onClick={handleUnban}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            Unban User
          </button>
        ) : (
          <button
            onClick={() => setShowBanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Ban size={16} />
            Ban User
          </button>
        )}
        <button
          onClick={() => setShowWarnModal(true)}
          disabled={banned}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
        >
          <AlertTriangle size={16} />
          Warn User
        </button>
        <button
          onClick={() => setShowNoteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus size={16} />
          Add Note
        </button>
        <button
          onClick={() => handleExportData('json')}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? 'Exporting…' : 'Export Data (GDPR)'}
        </button>
      </div>

      {showWarnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Warn User</h3>
              <button onClick={() => setShowWarnModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="text-muted-foreground mb-4">
              Send a warning email to this user about their community guidelines. They will receive an email from NeuroKid.
            </p>
            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="Reason for warning (optional, included in email)"
              className="w-full p-3 border border-border rounded-lg mb-4 resize-none bg-background text-foreground"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarnModal(false)}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleWarn}
                disabled={loading}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="text-amber-600 dark:text-amber-400" size={20} />
            <h3 className="font-semibold text-foreground">Owner Notes</h3>
          </div>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-card p-3 rounded-lg border border-border">
                <div className="flex items-start justify-between">
                  <p className="text-foreground">{note.note}</p>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-muted-foreground hover:text-red-500 ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Ban User</h3>
              <button onClick={() => setShowBanModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="text-muted-foreground mb-4">
              This will prevent the user from logging in and accessing the platform.
            </p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban (optional)"
              className="w-full p-3 border border-border rounded-lg mb-4 resize-none bg-background text-foreground"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {loading ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add Note</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="text-muted-foreground mb-4">
              Add a private note about this user. Only you can see these notes.
            </p>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              className="w-full p-3 border border-border rounded-lg mb-4 resize-none bg-background text-foreground"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={loading || !newNote.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
