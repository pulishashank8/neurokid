'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, EyeOff, RefreshCw } from 'lucide-react';

interface CommentModerationProps {
  commentId: string;
  status: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function CommentModeration({ commentId, status: initialStatus, onStatusChange }: CommentModerationProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/comments/${commentId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok) {
        let newStatus = status;
        switch (action) {
          case 'remove':
            newStatus = 'REMOVED';
            break;
          case 'hide':
            newStatus = 'HIDDEN';
            break;
          case 'restore':
            newStatus = 'ACTIVE';
            break;
        }
        setStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      console.error('Error moderating comment:', error);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  }

  const statusBadge = status !== initialStatus && (
    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
      status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
      status === 'REMOVED' ? 'bg-red-100 text-red-700' :
      status === 'HIDDEN' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
    }`}>
      {status}
    </span>
  );

  return (
    <div className="relative flex items-center">
      {statusBadge}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded"
        disabled={loading}
      >
        {loading ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <MoreVertical size={16} />
        )}
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-36">
            {status === 'ACTIVE' ? (
              <>
                <button
                  onClick={() => handleAction('remove')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 text-sm"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
                <button
                  onClick={() => handleAction('hide')}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-yellow-600 hover:bg-yellow-50 text-sm"
                >
                  <EyeOff size={14} />
                  Hide
                </button>
              </>
            ) : (
              <button
                onClick={() => handleAction('restore')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-green-600 hover:bg-green-50 text-sm"
              >
                <RefreshCw size={14} />
                Restore
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
