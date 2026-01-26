"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { 
  Search, UserPlus, MessageCircle, Send, ArrowLeft, 
  Check, X, Clock, User, Sparkles, Users, Inbox
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

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
        <User className="w-6 h-6 text-white/90" />
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
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, message: connectionMessage }),
      });
      
      if (res.ok) {
        toast.success("Connection request sent!");
        setShowConnectionModal(null);
        setConnectionMessage("");
        handleSearch(searchQuery);
        fetchPendingRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send request");
      }
    } catch (err) {
      toast.error("Failed to send request");
    }
  };

  const handleConnectionAction = async (requestId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/connections/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok) {
        toast.success(action === "accept" ? "Connection accepted!" : "Request declined");
        fetchPendingRequests();
        fetchConversations();
      }
    } catch (err) {
      toast.error("Failed to process request");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConversation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      
      if (res.ok) {
        setNewMessage("");
        fetchMessages(selectedConversation);
        fetchConversations();
      } else {
        toast.error("Failed to send message");
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
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

  const pendingCount = pendingReceived.length + pendingSent.length;

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-light)]">
              <button
                onClick={() => setActiveTab("conversations")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "conversations" 
                    ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Inbox className="w-4 h-4 inline mr-1" /> Chats
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === "pending" 
                    ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-1" /> Pending
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "search" 
                    ? "text-[var(--primary)] border-b-2 border-[var(--primary)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-1" /> Find
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {activeTab === "conversations" && (
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                      <p className="text-[var(--text-muted)]">No conversations yet</p>
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Find users to connect with!
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          fetchMessages(conv.id);
                        }}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                          selectedConversation === conv.id
                            ? "bg-[var(--primary)]/10"
                            : "hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        <AvatarPlaceholder name={conv.otherUser.displayName} size="sm" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">
                            {conv.otherUser.displayName}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-sm text-[var(--text-muted)] truncate">
                              {conv.lastMessage.isFromMe ? "You: " : ""}{conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === "pending" && (
                <div className="space-y-4">
                  {pendingReceived.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Received</h3>
                      {pendingReceived.map((req) => (
                        <div key={req.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl mb-2">
                          <div className="flex items-center gap-3">
                            <AvatarPlaceholder name={req.sender?.displayName} size="sm" />
                            <div className="flex-1">
                              <p className="font-medium text-[var(--text-primary)]">
                                {req.sender?.displayName}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                @{req.sender?.username}
                              </p>
                            </div>
                          </div>
                          {req.message && (
                            <p className="text-sm text-[var(--text-secondary)] mt-2 italic">
                              "{req.message}"
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleConnectionAction(req.id, "accept")}
                              className="flex-1 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90"
                            >
                              <Check className="w-4 h-4 inline mr-1" /> Accept
                            </button>
                            <button
                              onClick={() => handleConnectionAction(req.id, "reject")}
                              className="flex-1 py-2 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="w-4 h-4 inline mr-1" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {pendingSent.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Sent</h3>
                      {pendingSent.map((req) => (
                        <div key={req.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl mb-2 flex items-center gap-3">
                          <AvatarPlaceholder name={req.receiver?.displayName} size="sm" />
                          <div className="flex-1">
                            <p className="font-medium text-[var(--text-primary)]">
                              {req.receiver?.displayName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Pending...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {pendingReceived.length === 0 && pendingSent.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                      <p className="text-[var(--text-muted)]">No pending requests</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "search" && (
                <div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  
                  {searching ? (
                    <div className="text-center py-4 text-[var(--text-muted)]">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div key={user.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl flex items-center gap-3">
                          <AvatarPlaceholder name={user.displayName} size="sm" />
                          <div className="flex-1">
                            <p className="font-medium text-[var(--text-primary)]">{user.displayName}</p>
                            <p className="text-xs text-[var(--text-muted)]">@{user.username}</p>
                          </div>
                          {user.connectionStatus === "none" && (
                            <button
                              onClick={() => setShowConnectionModal(user.id)}
                              className="p-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          {user.connectionStatus === "pending_sent" && (
                            <span className="text-xs text-[var(--text-muted)]">Pending</span>
                          )}
                          {user.connectionStatus === "connected" && (
                            <span className="text-xs text-green-600">Connected</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <div className="text-center py-8 text-[var(--text-muted)]">No users found</div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
                      <p className="text-[var(--text-muted)]">Search for users to connect</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-light)] overflow-hidden flex flex-col min-h-[60vh]">
            {selectedConversation && otherUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[var(--border-light)] flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 hover:bg-[var(--bg-elevated)] rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <AvatarPlaceholder name={otherUser.displayName} size="sm" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{otherUser.displayName}</p>
                    <p className="text-xs text-[var(--text-muted)]">@{otherUser.username}</p>
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
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.isFromMe ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-[var(--border-light)]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-4 py-3 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
                  <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">Select a conversation</h3>
                  <p className="text-[var(--text-muted)]">Choose a chat from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-surface)] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Send Connection Request</h3>
            <textarea
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowConnectionModal(null);
                  setConnectionMessage("");
                }}
                className="flex-1 py-2 border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                Cancel
              </button>
              <button
                onClick={() => sendConnectionRequest(showConnectionModal)}
                className="flex-1 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90"
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

export default function MessagesClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
