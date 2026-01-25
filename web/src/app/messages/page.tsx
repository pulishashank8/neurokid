"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { 
  Search, UserPlus, Users, MessageCircle, Send, ArrowLeft, 
  Check, X, Clock, MoreVertical, Ban, Flag, Trash2
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

interface Connection {
  id: string;
  connectedAt: string;
  user: {
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

export default function MessagesPage() {
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
    }
  }, [searchParams]);

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
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  const totalPending = pendingReceived.length + pendingSent.length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Messages</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel */}
          <div className={`w-full lg:w-96 ${selectedConversation ? "hidden lg:block" : ""}`}>
            {/* Tabs */}
            <div className="flex bg-[var(--bg-secondary)] rounded-xl p-1 mb-4">
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "search"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all relative ${
                  activeTab === "pending"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Requests</span>
                {totalPending > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {totalPending}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("conversations")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "conversations"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Chats</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden min-h-[400px]">
              {/* Search Tab */}
              {activeTab === "search" && (
                <div className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Search by username..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  {searching ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-primary)] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={user.avatarUrl || "/default-avatar.svg"}
                              alt={user.username}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">
                                {user.displayName}
                              </p>
                              <p className="text-sm text-[var(--text-muted)]">@{user.username}</p>
                            </div>
                          </div>

                          {user.connectionStatus === "none" && (
                            <button
                              onClick={() => setShowConnectionModal(user.id)}
                              className="px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                            >
                              Connect
                            </button>
                          )}
                          {user.connectionStatus === "pending_sent" && (
                            <span className="px-3 py-1.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm rounded-lg flex items-center gap-1">
                              <Clock className="w-4 h-4" /> Pending
                            </span>
                          )}
                          {user.connectionStatus === "pending_received" && (
                            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-600 text-sm rounded-lg">
                              Respond
                            </span>
                          )}
                          {user.connectionStatus === "connected" && (
                            <span className="px-3 py-1.5 bg-green-500/20 text-green-600 text-sm rounded-lg flex items-center gap-1">
                              <Check className="w-4 h-4" /> Connected
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      No users found matching &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Enter a username to search</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Requests Tab */}
              {activeTab === "pending" && (
                <div className="divide-y divide-[var(--border-light)]">
                  {/* Received Requests */}
                  {pendingReceived.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase mb-3">
                        Received ({pendingReceived.length})
                      </h3>
                      <div className="space-y-3">
                        {pendingReceived.map((req) => (
                          <div
                            key={req.id}
                            className="p-3 bg-[var(--bg-primary)] rounded-xl"
                          >
                            <div className="flex items-start gap-3">
                              <Image
                                src={req.sender?.avatarUrl || "/default-avatar.svg"}
                                alt={req.sender?.username || ""}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--text-primary)]">
                                  {req.sender?.displayName}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                  @{req.sender?.username}
                                </p>
                                {req.message && (
                                  <p className="mt-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-2 rounded-lg">
                                    &quot;{req.message}&quot;
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => respondToRequest(req.id, "accept")}
                                className="flex-1 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-4 h-4" /> Accept
                              </button>
                              <button
                                onClick={() => respondToRequest(req.id, "decline")}
                                className="flex-1 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm font-medium rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors flex items-center justify-center gap-1"
                              >
                                <X className="w-4 h-4" /> Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Requests */}
                  {pendingSent.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase mb-3">
                        Sent ({pendingSent.length})
                      </h3>
                      <div className="space-y-3">
                        {pendingSent.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <Image
                                src={req.receiver?.avatarUrl || "/default-avatar.svg"}
                                alt={req.receiver?.username || ""}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                              <div>
                                <p className="font-medium text-[var(--text-primary)]">
                                  {req.receiver?.displayName}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                  @{req.receiver?.username}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => cancelRequest(req.id)}
                              className="px-3 py-1.5 text-red-500 text-sm hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingReceived.length === 0 && pendingSent.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                      <UserPlus className="w-12 h-12 mb-3 opacity-50" />
                      <p>No pending requests</p>
                    </div>
                  )}
                </div>
              )}

              {/* Conversations Tab */}
              {activeTab === "conversations" && (
                <div>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                    </div>
                  ) : conversations.length > 0 ? (
                    <div className="divide-y divide-[var(--border-light)]">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv.id)}
                          className={`w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-primary)] transition-colors text-left ${
                            selectedConversation === conv.id ? "bg-[var(--bg-primary)]" : ""
                          }`}
                        >
                          <Image
                            src={conv.otherUser.avatarUrl || "/default-avatar.svg"}
                            alt={conv.otherUser.username}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-[var(--text-primary)] truncate">
                                {conv.otherUser.displayName}
                              </p>
                              {conv.lastMessage && (
                                <span className="text-xs text-[var(--text-muted)]">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--text-muted)] truncate">
                              {conv.lastMessage
                                ? conv.lastMessage.isFromMe
                                  ? `You: ${conv.lastMessage.content}`
                                  : conv.lastMessage.content
                                : "No messages yet"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                      <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
                      <p className="mb-2">No conversations yet</p>
                      <p className="text-sm">Search for users and connect to start messaging</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Message Thread */}
          <div className={`flex-1 ${!selectedConversation ? "hidden lg:block" : ""}`}>
            {selectedConversation && otherUser ? (
              <div className="bg-[var(--bg-secondary)] rounded-xl h-[calc(100vh-200px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-[var(--border-light)]">
                  <button
                    onClick={() => {
                      setSelectedConversation(null);
                      router.push("/messages", { scroll: false });
                    }}
                    className="lg:hidden p-2 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                  <Image
                    src={otherUser.avatarUrl || "/default-avatar.svg"}
                    alt={otherUser.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">
                      {otherUser.displayName}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">@{otherUser.username}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          msg.isFromMe
                            ? "bg-[var(--primary)] text-white rounded-br-md"
                            : "bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.isFromMe ? "text-white/70" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border-light)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-4 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-[var(--bg-secondary)] rounded-xl h-[calc(100vh-200px)] flex flex-col items-center justify-center text-[var(--text-muted)]">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm">Choose a chat from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Send Connection Request
            </h3>
            <textarea
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              placeholder="Add a message (optional)"
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
              {connectionMessage.length}/300
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowConnectionModal(null);
                  setConnectionMessage("");
                }}
                className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] font-medium rounded-xl hover:bg-[var(--bg-elevated-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendConnectionRequest(showConnectionModal)}
                className="flex-1 py-2.5 bg-[var(--primary)] text-white font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
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
