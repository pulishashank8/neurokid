"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle } from "lucide-react";

interface MessageButtonProps {
  targetUserId: string;
  targetUsername: string;
  className?: string;
  showText?: boolean;
}

export function MessageButton({ 
  targetUserId, 
  targetUsername, 
  className = "",
  showText = false 
}: MessageButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!session?.user?.id || session.user.id === targetUserId) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          alert("Cannot message this user");
          return;
        }
        if (res.status === 429) {
          alert("Too many conversations created. Please wait before starting new ones.");
          return;
        }
        throw new Error(data.error || "Failed to start conversation");
      }

      const data = await res.json();
      router.push(`/messages?conversation=${data.conversation.id}`);
    } catch (err: any) {
      console.error("Error starting conversation:", err);
      alert(err.message || "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--primary)] transition-colors disabled:opacity-50 ${className}`}
      title={`Message @${targetUsername}`}
    >
      <MessageCircle className="w-4 h-4" />
      {showText && <span className="text-xs font-medium">Message</span>}
    </button>
  );
}
