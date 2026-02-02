'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, Lock, Unlock, Pin, PinOff, RefreshCw } from 'lucide-react';

interface PostModerationProps {
  postId: string;
  status: string;
  isLocked: boolean;
  isPinned: boolean;
  onStatusChange?: (newStatus: string) => void;
}

export default function PostModeration({ postId, status: initialStatus, isLocked: initialLocked, isPinned: initialPinned, onStatusChange }: PostModerationProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/posts/${postId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok) {
        let newStatus = status;
        switch (action) {
          case 'remove':
            newStatus = 'REMOVED';
            setStatus(newStatus);
            break;
          case 'restore':
            newStatus = 'ACTIVE';
            setStatus(newStatus);
            break;
          case 'lock':
            setIsLocked(true);
            break;
          case 'unlock':
            setIsLocked(false);
            break;
          case 'pin':
            setIsPinned(true);
            break;
          case 'unpin':
            setIsPinned(false);
            break;
        }
        if (onStatusChange && (action === 'remove' || action === 'restore')) {
          onStatusChange(newStatus);
        }
      }
    } catch (error) {
      console.error('Error moderating post:', error);
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  }

  const statusBadge = status !== initialStatus && (
    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
      status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
      status === 'REMOVED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
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
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-40">
            {status === 'ACTIVE' ? (
              <button
                onClick={() => handleAction('remove')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 text-sm"
              >
                <Trash2 size={14} />
                Remove
              </button>
            ) : (
              <button
                onClick={() => handleAction('restore')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-green-600 hover:bg-green-50 text-sm"
              >
                <RefreshCw size={14} />
                Restore
              </button>
            )}
            
            {isLocked ? (
              <button
                onClick={() => handleAction('unlock')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
              >
                <Unlock size={14} />
                Unlock
              </button>
            ) : (
              <button
                onClick={() => handleAction('lock')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-yellow-600 hover:bg-yellow-50 text-sm"
              >
                <Lock size={14} />
                Lock
              </button>
            )}

            {isPinned ? (
              <button
                onClick={() => handleAction('unpin')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
              >
                <PinOff size={14} />
                Unpin
              </button>
            ) : (
              <button
                onClick={() => handleAction('pin')}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 text-sm"
              >
                <Pin size={14} />
                Pin
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
