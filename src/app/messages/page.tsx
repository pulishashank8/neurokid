"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  Search, UserPlus, MessageCircle, Send, ArrowLeft, 
  Check, X, Clock, User, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

type TabType = "search" | "pending" | "conversations";

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  connectionStatus: "none" | "pending_sent" | "pending_received" | "connected";
}

interface PendingRequest {
  id: string;
  message?: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  receiver?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  updatedAt: string;
  isBlocked: boolean;
}

interface Message {
  id: string;
  content: string;
  isFromMe: boolean;
  createdAt: string;
}

function AvatarPlaceholder({ name, size = "md" }: { name?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-14 h-14"
  };
  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7"
  };
  
  const initial = name?.charAt(0)?.toUpperCase() || "";
  const colors = [
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-purple-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-blue-500",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  
  return (
    <div className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center shadow-lg ring-2 ring-white/20`}>
      {initial ? (
        <span className="text-white font-bold text-lg drop-shadow-sm">{initial}</span>
      ) : (
        <User className={`${iconSizes[size]} text-white/90`} />
      )}
    </div>
  );
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [showConnectionModal, setShowConnectionModal] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{id: string; username: string; displayName: string; avatarUrl?: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
      fetchPendingRequests();
    }
  }, [status]);

  useEffect(() => {
    const convId = searchParams.get("conversation");
    if (convId) {
      setSelectedConversation(convId);
      fetchMessages(convId);
      markMessagesAsRead(convId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "pending" && pendingReceived.length > 0) {
      markConnectionRequestsAsSeen();
    }
  }, [activeTab, pendingReceived.length]);

  const markConnectionRequestsAsSeen = async () => {
    try {
      await fetch("/api/notifications/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "connection-requests" }),
      });
    } catch (error) {
      console.error("Error marking requests as seen:", error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await fetch("/api/notifications/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "messages", conversationId }),
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch("/api/connections?type=pending-received"),
        fetch("/api/connections?type=pending-sent"),
      ]);

      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setPendingReceived(data.requests || []);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setPendingSent(data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setOtherUser(data.conversation?.otherUser || null);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const searchUsers = async (query: string) => {
    try {
      setSearching(true);
      const res = await fetch(`/api/users/search?username=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setSearching(false);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, message: connectionMessage.trim() || null }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Connection request sent!");
        setShowConnectionModal(null);
        setConnectionMessage("");
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === receiverId ? { ...u, connectionStatus: "pending_sent" as const } : u
          )
        );
        fetchPendingRequests();
      } else {
        toast.error(data.error || "Failed to send request");
      }
    } catch {
      toast.error("Failed to send connection request");
    }
  };

  const respondToRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch(`/api/connections/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast.success(action === "accept" ? "Connection accepted!" : "Request declined");
        fetchPendingRequests();
        if (action === "accept") {
          fetchConversations();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to respond");
      }
    } catch {
      toast.error("Failed to respond to request");
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/connections/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (res.ok) {
        toast.success("Request cancelled");
        fetchPendingRequests();
      }
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConversation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        fetchConversations();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send message");
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const selectConversation = (convId: string) => {
    setSelectedConversation(convId);
    router.push(`/messages?conversation=${convId}`, { scroll: false });
    fetchMessages(convId);
    markMessagesAsRead(convId);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--primary)]/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[var(--primary)] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const totalPending = pendingReceived.length + pendingSent.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)]/30 to-[var(--bg-primary)]">
      <div className="container max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-emerald-600 shadow-lg shadow-[var(--primary)]/20">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Messages</h1>
            <p className="text-[var(--text-muted)] text-sm">Connect and chat with your community</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className={`w-full lg:w-[400px] ${selectedConversation ? "hidden lg:block" : ""}`}>
            <div className="backdrop-blur-xl bg-[var(--bg-surface)]/80 rounded-3xl border border-[var(--border-light)]/50 shadow-xl shadow-black/5 overflow-hidden">
              <div className="p-2 border-b border-[var(--border-light)]/50">
                <div className="flex bg-[var(--bg-primary)]/50 rounded-2xl p-1.5">
                  <button
                    onClick={() => setActiveTab("search")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      activeTab === "search"
                        ? "bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white shadow-lg shadow-[var(--primary)]/30"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                      activeTab === "pending"
                        ? "bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white shadow-lg shadow-[var(--primary)]/30"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50"
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Requests</span>
                    {totalPending > 0 && (
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                        {totalPending}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("conversations")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      activeTab === "conversations"
                        ? "bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white shadow-lg shadow-[var(--primary)]/30"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chats</span>
                  </button>
                </div>
              </div>

              <div className="min-h-[500px] max-h-[600px] overflow-y-auto">
                {activeTab === "search" && (
                  <div className="p-5">
                    <div className="relative mb-5">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-emerald-500/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <input
                        type="text"
                        placeholder="Find people by username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-5 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-light)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-300"
                      />
                    </div>

                    {searching ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-[var(--primary)]/20 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-[var(--primary)] rounded-full animate-spin"></div>
                        </div>
                        <p className="text-[var(--text-muted)] mt-4 text-sm">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-3">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-elevated)]/50 border border-[var(--border-light)]/50 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <AvatarPlaceholder name={user.displayName} size="md" />
                              <div>
                                <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                                  {user.displayName}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">@{user.username}</p>
                              </div>
                            </div>

                            {user.connectionStatus === "none" && (
                              <button
                                onClick={() => setShowConnectionModal(user.id)}
                                className="px-5 py-2.5 bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--primary)]/30 hover:scale-105 active:scale-95 transition-all duration-200"
                              >
                                Connect
                              </button>
                            )}
                            {user.connectionStatus === "pending_sent" && (
                              <span className="px-4 py-2.5 bg-amber-500/10 text-amber-600 text-sm font-medium rounded-xl flex items-center gap-2 border border-amber-500/20">
                                <Clock className="w-4 h-4" /> Pending
                              </span>
                            )}
                            {user.connectionStatus === "pending_received" && (
                              <span className="px-4 py-2.5 bg-blue-500/10 text-blue-600 text-sm font-medium rounded-xl border border-blue-500/20">
                                Respond
                              </span>
                            )}
                            {user.connectionStatus === "connected" && (
                              <span className="px-4 py-2.5 bg-emerald-500/10 text-emerald-600 text-sm font-medium rounded-xl flex items-center gap-2 border border-emerald-500/20">
                                <Check className="w-4 h-4" /> Connected
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length >= 2 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
                          <Search className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[var(--text-muted)]">No users found matching &quot;{searchQuery}&quot;</p>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-emerald-500/10 flex items-center justify-center">
                          <Sparkles className="w-10 h-10 text-[var(--primary)]" />
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-1">Find Your Community</p>
                        <p className="text-[var(--text-muted)] text-sm">Enter a username to start connecting</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "pending" && (
                  <div className="divide-y divide-[var(--border-light)]/50">
                    {pendingReceived.length > 0 && (
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                            Received ({pendingReceived.length})
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {pendingReceived.map((req) => (
                            <div
                              key={req.id}
                              className="p-5 bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-elevated)]/30 rounded-2xl border border-[var(--border-light)]/50 hover:border-[var(--primary)]/20 transition-all duration-300"
                            >
                              <div className="flex items-start gap-4">
                                <AvatarPlaceholder name={req.sender?.displayName} size="md" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[var(--text-primary)]">
                                    {req.sender?.displayName}
                                  </p>
                                  <p className="text-sm text-[var(--text-muted)]">
                                    @{req.sender?.username}
                                  </p>
                                  {req.message && (
                                    <div className="mt-3 p-3 bg-[var(--bg-surface)]/50 rounded-xl border-l-3 border-[var(--primary)]">
                                      <p className="text-sm text-[var(--text-secondary)] italic">
                                        &quot;{req.message}&quot;
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-3 mt-4">
                                <button
                                  onClick={() => respondToRequest(req.id, "accept")}
                                  className="flex-1 py-3 bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--primary)]/30 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <Check className="w-4 h-4" /> Accept
                                </button>
                                <button
                                  onClick={() => respondToRequest(req.id, "decline")}
                                  className="flex-1 py-3 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm font-semibold rounded-xl hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-light)] transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <X className="w-4 h-4" /> Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingSent.length > 0 && (
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                            Sent ({pendingSent.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {pendingSent.map((req) => (
                            <div
                              key={req.id}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-elevated)]/30 rounded-2xl border border-[var(--border-light)]/50"
                            >
                              <div className="flex items-center gap-4">
                                <AvatarPlaceholder name={req.receiver?.displayName} size="md" />
                                <div>
                                  <p className="font-semibold text-[var(--text-primary)]">
                                    {req.receiver?.displayName}
                                  </p>
                                  <p className="text-sm text-[var(--text-muted)]">
                                    @{req.receiver?.username}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => cancelRequest(req.id)}
                                className="px-4 py-2 text-rose-500 text-sm font-medium hover:bg-rose-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-rose-500/20"
                              >
                                Cancel
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingReceived.length === 0 && pendingSent.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 mb-4 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-emerald-500/10 flex items-center justify-center">
                          <UserPlus className="w-10 h-10 text-[var(--primary)]" />
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-1">No Pending Requests</p>
                        <p className="text-[var(--text-muted)] text-sm">Search for users to connect</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "conversations" && (
                  <div>
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-[var(--primary)]/20 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-[var(--primary)] rounded-full animate-spin"></div>
                        </div>
                      </div>
                    ) : conversations.length > 0 ? (
                      <div className="p-2">
                        {conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            className={`w-full p-4 flex items-center gap-4 rounded-2xl transition-all duration-300 text-left mb-1 ${
                              selectedConversation === conv.id 
                                ? "bg-gradient-to-r from-[var(--primary)]/10 to-emerald-500/10 border-2 border-[var(--primary)]/30" 
                                : "hover:bg-[var(--bg-elevated)]/50 border-2 border-transparent"
                            }`}
                          >
                            <AvatarPlaceholder name={conv.otherUser.displayName} size="lg" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className={`font-semibold truncate ${
                                  selectedConversation === conv.id 
                                    ? "text-[var(--primary)]" 
                                    : "text-[var(--text-primary)]"
                                }`}>
                                  {conv.otherUser.displayName}
                                </p>
                                {conv.lastMessage && (
                                  <span className="text-xs text-[var(--text-muted)] font-medium ml-2 flex-shrink-0">
                                    {formatTime(conv.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              {conv.lastMessage && (
                                <p className="text-sm text-[var(--text-muted)] truncate">
                                  {conv.lastMessage.isFromMe && (
                                    <span className="text-[var(--primary)]">You: </span>
                                  )}
                                  {conv.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 mb-4 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-emerald-500/10 flex items-center justify-center">
                          <MessageCircle className="w-10 h-10 text-[var(--primary)]" />
                        </div>
                        <p className="text-[var(--text-primary)] font-medium mb-1">No Conversations Yet</p>
                        <p className="text-[var(--text-muted)] text-sm text-center px-4">Connect with others to start messaging</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`flex-1 ${!selectedConversation ? "hidden lg:flex lg:items-center lg:justify-center" : ""}`}>
            {selectedConversation ? (
              <div className="backdrop-blur-xl bg-[var(--bg-surface)]/80 rounded-3xl border border-[var(--border-light)]/50 shadow-xl shadow-black/5 h-[650px] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-light)]/50 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-elevated)]/30">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setSelectedConversation(null);
                        router.push("/messages", { scroll: false });
                      }}
                      className="lg:hidden p-2.5 hover:bg-[var(--bg-primary)] rounded-xl transition-all duration-200"
                    >
                      <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                    </button>
                    {otherUser && (
                      <>
                        <AvatarPlaceholder name={otherUser.displayName} size="md" />
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--text-primary)] text-lg">
                            {otherUser.displayName}
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">@{otherUser.username}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-[var(--bg-primary)]/20">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-emerald-500/10 flex items-center justify-center">
                        <Send className="w-8 h-8 text-[var(--primary)]" />
                      </div>
                      <p className="text-[var(--text-muted)]">Start the conversation!</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-5 py-3 ${
                          msg.isFromMe
                            ? "bg-gradient-to-br from-[var(--primary)] to-emerald-500 text-white rounded-2xl rounded-br-md shadow-lg shadow-[var(--primary)]/20"
                            : "bg-[var(--bg-surface)] border border-[var(--border-light)]/50 text-[var(--text-primary)] rounded-2xl rounded-bl-md shadow-md"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-2 ${msg.isFromMe ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border-light)]/50 bg-[var(--bg-surface)]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-5 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-light)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-300"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-5 py-4 bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white rounded-2xl hover:shadow-lg hover:shadow-[var(--primary)]/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-emerald-500/10 flex items-center justify-center shadow-lg shadow-[var(--primary)]/5">
                  <MessageCircle className="w-12 h-12 text-[var(--primary)]" />
                </div>
                <p className="text-xl font-semibold text-[var(--text-primary)] mb-2">Select a Conversation</p>
                <p className="text-[var(--text-muted)]">Choose a chat from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-surface)] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[var(--border-light)]/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-emerald-500 shadow-lg shadow-[var(--primary)]/30">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Send Connection Request
                </h3>
                <p className="text-sm text-[var(--text-muted)]">Add a personal message</p>
              </div>
            </div>
            <textarea
              placeholder="Hi! I'd love to connect with you..."
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              rows={4}
              maxLength={300}
              className="w-full px-5 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-light)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 resize-none mb-2 transition-all duration-300"
            />
            <p className="text-xs text-[var(--text-muted)] text-right mb-6">{connectionMessage.length}/300</p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowConnectionModal(null);
                  setConnectionMessage("");
                }}
                className="flex-1 py-3.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-semibold rounded-2xl hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-light)] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => sendConnectionRequest(showConnectionModal)}
                className="flex-1 py-3.5 bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-[var(--primary)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--primary)]/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[var(--primary)] rounded-full animate-spin"></div>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
