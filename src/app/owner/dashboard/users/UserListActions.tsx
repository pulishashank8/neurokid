'use client';

import { useState } from 'react';
import { Download, Mail, Loader2, X } from 'lucide-react';
import { PremiumButton } from '@/components/owner/PremiumButton';

export function UserListActions() {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    subject: '',
    message: '',
    targetRole: 'ALL',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportCsv = async () => {
    setExportingCsv(true);
    setMessage(null);

    try {
      const response = await fetch('/api/owner/users/export-csv');
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'CSV exported successfully!' });
    } catch (error) {
      console.error('Export CSV error:', error);
      setMessage({ type: 'error', text: 'Failed to export CSV' });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementData.subject || !announcementData.message) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSendingAnnouncement(true);
    setMessage(null);

    try {
      const response = await fetch('/api/owner/users/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send announcement');
      }

      setMessage({ type: 'success', text: `Announcement sent to ${data.recipientCount} users!` });
      setShowAnnouncementModal(false);
      setAnnouncementData({ subject: '', message: '', targetRole: 'ALL' });
    } catch (error: any) {
      console.error('Send announcement error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to send announcement' });
    } finally {
      setSendingAnnouncement(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <PremiumButton
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          disabled={exportingCsv}
        >
          {exportingCsv ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export CSV
            </>
          )}
        </PremiumButton>

        <PremiumButton
          variant="primary"
          size="sm"
          onClick={() => setShowAnnouncementModal(true)}
        >
          <Mail className="w-4 h-4" />
          Send Announcement
        </PremiumButton>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Send Announcement
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Target Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send To
                </label>
                <select
                  value={announcementData.targetRole}
                  onChange={(e) =>
                    setAnnouncementData({ ...announcementData, targetRole: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="ALL">All Users</option>
                  <option value="PARENT">Parents Only</option>
                  <option value="PROVIDER">Providers Only</option>
                  <option value="THERAPIST">Therapists Only</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={announcementData.subject}
                  onChange={(e) =>
                    setAnnouncementData({ ...announcementData, subject: e.target.value })
                  }
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={announcementData.message}
                  onChange={(e) =>
                    setAnnouncementData({ ...announcementData, message: e.target.value })
                  }
                  placeholder="Enter your announcement message..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  required
                />
              </div>

              {message && message.type === 'error' && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {message.text}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                disabled={sendingAnnouncement}
              >
                Cancel
              </button>
              <PremiumButton
                variant="primary"
                onClick={handleSendAnnouncement}
                disabled={sendingAnnouncement}
              >
                {sendingAnnouncement ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Announcement
                  </>
                )}
              </PremiumButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
