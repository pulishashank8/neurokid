"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Search, UserPlus, MessageCircle, Send, ArrowLeft,
  Check, X, Clock, User, Sparkles, Users, Inbox, Heart, Star,
  Paperclip, FileUp
} from "lucide-react";
import toast from "react-hot-toast";
import { ActionMenu } from "@/features/community/ActionMenu";
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
  readAt?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

// Premium 3D Avatar Component
function AvatarPlaceholder({ name, size = "md", online = false }: { name?: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
    lg: "w-16 h-16"
  };

  const ringSize = {
    sm: "w-14 h-14",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  };

  const initial = name?.charAt(0)?.toUpperCase() || "";
  const colors = [
    "from-emerald-400 via-teal-400 to-cyan-500",
    "from-blue-400 via-indigo-400 to-purple-500",
    "from-purple-400 via-pink-400 to-rose-500",
    "from-amber-400 via-orange-400 to-red-500",
    "from-cyan-400 via-blue-400 to-indigo-500",
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className="relative group">
      {/* Animated glow ring */}
      <div className={`absolute inset-0 ${ringSize[size]} -m-1 rounded-full bg-gradient-to-r ${colors[colorIndex]} opacity-0 group-hover:opacity-60 blur-md transition-all duration-500 animate-pulse`}></div>

      {/* 3D ring effect */}
      <div className={`relative ${sizeClasses[size]} rounded-full p-[2px] bg-gradient-to-br ${colors[colorIndex]} shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
        style={{
          boxShadow: `0 4px 15px -3px rgba(16, 185, 129, 0.3),
                      0 10px 20px -5px rgba(0, 0, 0, 0.1),
                      inset 0 -2px 5px rgba(0,0,0,0.1)`
        }}>
        <div className={`w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center`}
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
          {initial ? (
            <span className="text-white font-bold text-lg drop-shadow-lg">{initial}</span>
          ) : (
            <User className="w-6 h-6 text-white/90 drop-shadow-lg" />
          )}
        </div>
      </div>

      {/* Online indicator */}
      {online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-full h-full bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      )}
    </div>
  );
}

// Floating animated orbs background
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Main gradient orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-900/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400/5 dark:bg-purple-900/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Subtle sparkle particles */}
      <div className="absolute top-20 left-1/4 w-2 h-2 bg-emerald-400/50 rounded-full animate-sparkle"></div>
      <div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-sparkle" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-teal-400/50 rounded-full animate-sparkle" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 right-20 w-1 h-1 bg-blue-400/50 rounded-full animate-sparkle" style={{ animationDelay: '3s' }}></div>
    </div>
  );
}

// Premium Glass Card Component
function GlassCard({ children, className = "", hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`
      relative overflow-hidden
      bg-white/80 dark:bg-black/40
      backdrop-blur-xl
      border border-white/20 dark:border-white/10
      rounded-3xl
      shadow-lg
      ${hover ? 'hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200/50 dark:hover:border-emerald-500/30' : ''}
      transition-all duration-500 ease-out
      ${className}
    `}>
      {/* Subtle inner glow for light mode only */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none rounded-3xl dark:opacity-0"></div>
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Animated Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Animated icon container */}
      <div className="relative mb-8">
        {/* Pulsing rings */}
        <div className="absolute inset-0 w-32 h-32 -m-4 rounded-full bg-gradient-to-r from-emerald-400/20 to-teal-400/20 animate-ping opacity-75"></div>
        <div className="absolute inset-0 w-28 h-28 -m-2 rounded-full bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 animate-pulse"></div>

        {/* Main icon circle */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-400/20 flex items-center justify-center backdrop-blur-sm border border-emerald-200/50"
          style={{
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 2px 8px rgba(255,255,255,0.5)'
          }}>
          <Icon className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 w-4 h-4">
          <Sparkles className="w-4 h-4 text-amber-400 animate-sparkle" />
        </div>
        <div className="absolute -bottom-1 -left-3 w-3 h-3">
          <Star className="w-3 h-3 text-emerald-400 animate-sparkle" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent mb-3">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs leading-relaxed">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Premium Tab Button
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-1 py-4 px-4 text-sm font-semibold transition-all duration-300
        ${active
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }
      `}
    >
      <span className="flex items-center justify-center gap-2">
        <Icon className={`w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
        <span>{label}</span>
      </span>

      {/* Badge */}
      {badge && badge > 0 && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-pulse">
          {badge}
        </span>
      )}

      {/* Active indicator */}
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
      )}
    </button>
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
  const [otherUser, setOtherUser] = useState<{ id: string; username: string; displayName: string; avatarUrl?: string; lastActiveAt?: string } | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleUpdateMessage = async (messageId: string, content: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        toast.success("Message updated");
        setEditingMessageId(null);
        if (selectedConversation) fetchMessages(selectedConversation);
      } else {
        toast.error("Failed to update message");
      }
    } catch {
      toast.error("Failed to update message");
    }
  };

  const handleDeleteMessage = async (messageId: string, type: "me" | "everyone") => {
    try {
      const res = await fetch(`/api/messages/${messageId}?type=${type}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(type === "everyone" ? "Message deleted for everyone" : "Message deleted for you");
        if (selectedConversation) fetchMessages(selectedConversation);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete message");
      }
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size limit is 5MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only images (JPG, PNG, WEBP) are allowed");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Clear input so same file can be selected again if needed (though we just selected it)
    e.target.value = "";
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  // Clean up preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setOtherUser(data.conversation?.otherUser || null);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv.id);
    setOtherUser(conv.otherUser);
    fetchMessages(conv.id);

    // Update URL without triggering router navigation/effect
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("conversation", conv.id);
    window.history.pushState({}, "", newUrl);
  };

  const handleOpenChat = async (targetUserId: string) => {
    // 1. Check local
    const conv = conversations.find(c => c.otherUser.id === targetUserId);
    if (conv) {
      setSelectedConversation(conv.id);
      setOtherUser(conv.otherUser);
      setActiveTab("conversations");
      fetchMessages(conv.id);
      // Update URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("conversation", conv.id);
      window.history.pushState({}, "", newUrl);
      return;
    }

    // 2. Try to create/get from server
    const toastId = toast.loading("Opening chat...");
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })
      });

      const data = await res.json();

      if (res.ok && data.conversation) {
        await fetchConversations(); // Refresh list to include new conv
        setSelectedConversation(data.conversation.id);
        setOtherUser(data.conversation.otherUser);
        setActiveTab("conversations");
        fetchMessages(data.conversation.id);

        // Update URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("conversation", data.conversation.id);
        window.history.pushState({}, "", newUrl);

        toast.dismiss(toastId);
      } else {
        toast.error(data.error || "Failed to open chat", { id: toastId });
      }
    } catch (err) {
      toast.error("Error opening chat", { id: toastId });
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
    } catch {
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
    } catch {
      toast.error("Failed to process request");
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      formData.append("content", newMessage.trim());
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const res = await fetch(`/api/messages/conversations/${selectedConversation}`, {
        method: "POST",
        body: formData,
        // Content-Type is set automatically by fetch when using FormData
      });

      if (res.ok) {
        setNewMessage("");
        clearSelection();
        fetchMessages(selectedConversation);
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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="relative z-10">
          {/* Premium loading spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 animate-pulse flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = pendingReceived.length + pendingSent.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black relative transition-colors duration-500">
      <FloatingOrbs />

      <div className="container max-w-7xl mx-auto px-4 py-8 pt-24 relative z-10">
        {/* Premium Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            {/* Icon container */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-xl shadow-emerald-500/25 transform transition-transform duration-300 group-hover:scale-105"
              style={{
                boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)'
              }}>
              <MessageCircle className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
              Messages
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Connect and chat with your community
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <GlassCard className={`overflow-hidden h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] ${selectedConversation ? 'hidden lg:block' : 'block'}`} hover={false}>
            {/* Tabs */}
            {/* Tabs */}
            <div className="flex border-b border-gray-200/50 dark:border-white/10 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-white/5 dark:to-white/5">
              <TabButton
                active={activeTab === "conversations"}
                onClick={() => setActiveTab("conversations")}
                icon={Inbox}
                label="Chats"
              />
              <TabButton
                active={activeTab === "pending"}
                onClick={() => setActiveTab("pending")}
                icon={Clock}
                label="Pending"
                badge={pendingCount}
              />
              <TabButton
                active={activeTab === "search"}
                onClick={() => setActiveTab("search")}
                icon={UserPlus}
                label="Find"
              />
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {activeTab === "conversations" && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="No conversations yet"
                      description="Start connecting with others to begin your messaging journey!"
                      action={
                        <button
                          onClick={() => setActiveTab("search")}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-400/30 hover:shadow-xl hover:shadow-emerald-400/40 transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                          Find Friends
                        </button>
                      }
                    />
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`
                          w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 cursor-pointer touch-manipulation
                          ${selectedConversation === conv.id
                            ? "bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-500/20"
                            : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                          }
                        `}
                      >
                        <AvatarPlaceholder name={conv.otherUser.displayName} size="sm" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                            {conv.otherUser.displayName}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
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
                <div className="space-y-6">
                  {pendingReceived.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                        <Heart className="w-3 h-3" /> Received
                      </h3>
                      {pendingReceived.map((req) => (
                        <div key={req.id} className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-3 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex items-center gap-4">
                            <AvatarPlaceholder name={req.sender?.displayName} size="sm" />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 dark:text-gray-100">
                                {req.sender?.displayName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                @{req.sender?.username}
                              </p>
                            </div>
                          </div>
                          {req.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 p-3 bg-gray-100/50 dark:bg-gray-700/30 rounded-xl italic">
                              "{req.message}"
                            </p>
                          )}
                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => handleConnectionAction(req.id, "accept")}
                              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-400/30 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" /> Accept
                            </button>
                            <button
                              onClick={() => handleConnectionAction(req.id, "reject")}
                              className="flex-1 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingSent.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Sent Requests</h3>
                      {pendingSent.map((req) => (
                        <div key={req.id} className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-3 border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
                          <AvatarPlaceholder name={req.receiver?.displayName} size="sm" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {req.receiver?.displayName}
                            </p>
                            <p className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> Awaiting response...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingReceived.length === 0 && pendingSent.length === 0 && (
                    <EmptyState
                      icon={Clock}
                      title="All caught up!"
                      description="No pending connection requests at the moment."
                    />
                  )}
                </div>
              )}

              {activeTab === "search" && (
                <div>
                  {/* Premium Search Input */}
                  <div className="relative mb-6 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-white/5 border-2 border-transparent dark:border-white/10 rounded-2xl text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:dark:border-emerald-500/50 focus:bg-white dark:focus:bg-black/40 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {searching ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div key={user.id} className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700/50 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                          <AvatarPlaceholder name={user.displayName} size="sm" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{user.displayName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                          </div>
                          {user.connectionStatus === "none" && (
                            <button
                              onClick={() => setShowConnectionModal(user.id)}
                              className="p-3 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-400/30 transform hover:scale-105 transition-all duration-300"
                            >
                              <UserPlus className="w-5 h-5" />
                            </button>
                          )}
                          {user.connectionStatus === "pending_sent" && (
                            <span className="text-xs text-amber-500 font-medium px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">Pending</span>
                          )}
                          {user.connectionStatus === "connected" && (
                            <button
                              onClick={() => handleOpenChat(user.id)}
                              className="text-xs text-emerald-500 font-medium px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Connected
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <EmptyState
                      icon={Search}
                      title="No users found"
                      description="Try searching with a different name or username."
                    />
                  ) : (
                    <EmptyState
                      icon={Search}
                      title="Find new friends"
                      description="Search for users by name or username to connect with them."
                    />
                  )}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Chat Area */}
          <div className={`lg:col-span-2 overflow-hidden flex flex-col h-[calc(100vh-140px)] bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-xl relative z-20 ${!selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
            {selectedConversation && otherUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-4 bg-white/50 dark:bg-white/5 backdrop-blur-md z-20">
                  <button
                    onClick={() => router.push("/messages")}
                    className="lg:hidden p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  {(() => {
                    const lastActive = otherUser.lastActiveAt ? new Date(otherUser.lastActiveAt) : null;
                    const isOnline = lastActive && (Date.now() - lastActive.getTime() < 5 * 60 * 1000);
                    return (
                      <>
                        <AvatarPlaceholder name={otherUser.displayName} size="md" online={!!isOnline} />
                        <div>
                          <h2 className="font-bold text-gray-900 dark:text-white text-lg">{otherUser.displayName}</h2>
                          <p className={`text-xs font-medium flex items-center gap-1 ${isOnline ? "text-emerald-500 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                            {isOnline && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>}
                            {isOnline
                              ? "Online"
                              : (lastActive ? `Active ${formatDistanceToNow(lastActive)} ago` : "Offline")
                            }
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar relative">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"} mb-1 group/message`}
                      >
                        <div className={`
                        relative max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-[15px] leading-relaxed
                        ${msg.isFromMe
                            ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-[rgba(255,255,255,0.9)] rounded-tr-none"
                            : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-[rgba(255,255,255,0.9)] rounded-tl-none"
                          }
                      `}>
                          {editingMessageId === msg.id ? (
                            <div className="min-w-[200px]">
                              <input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-2 py-1 bg-black/5 dark:bg-white/5 rounded text-inherit focus:outline-none mb-2"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingMessageId(null)} className="text-xs opacity-70 hover:opacity-100">Cancel</button>
                                <button onClick={() => handleUpdateMessage(msg.id, editContent)} className="text-xs font-bold hover:opacity-90 text-emerald-600 dark:text-emerald-400">Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.attachmentUrl && (
                                <div className="mb-2">
                                  {msg.attachmentType === "image" ? (
                                    <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full rounded-lg" />
                                  ) : (
                                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/10 rounded-lg">
                                      <FileUp className="w-5 h-5" />
                                      <span className="text-sm underline">Download File</span>
                                    </a>
                                  )}
                                </div>
                              )}
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className={`text-[10px] text-right mt-1 font-medium flex justify-end items-center gap-1 ${msg.isFromMe ? "text-emerald-900/40 dark:text-emerald-100/40" : "text-gray-400 dark:text-gray-500"}`}>
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                {msg.isFromMe && (
                                  <span className={`ml-1 ${msg.readAt ? "text-blue-500" : "text-gray-400"}`}>
                                    {msg.readAt
                                      ? `Seen ${new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                      : "Sent"
                                    }
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          {msg.isFromMe && !editingMessageId && (
                            <div className="absolute top-0 right-full mr-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                              <ActionMenu
                                isOwner={true}
                                resourceName="Message"
                                onEdit={() => {
                                  setEditingMessageId(msg.id);
                                  setEditContent(msg.content);
                                }}
                                onDelete={() => {
                                  // Prompt for delete type? For now, we'll try to keep it simple in the UI or default to everyone if possible, 
                                  // but the user explicitly asked for generic options. 
                                  // We can use the toast to ask or just default 'everyone' for now since that's what usually people want for sent messages, 
                                  // or we can add a small UI. 
                                  // Let's implement a simple confirm that sets a state.
                                  if (confirm("Delete for everyone?")) {
                                    handleDeleteMessage(msg.id, "everyone");
                                  } else if (confirm("Delete just for me?")) {
                                    handleDeleteMessage(msg.id, "me");
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="px-4 pt-3 pb-1 bg-gray-100 dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800 flex justify-start">
                    <div className="relative group">
                      <img src={previewUrl} alt="Preview" className="h-24 w-auto rounded-xl object-cover border-2 border-emerald-500/30 shadow-sm" />
                      <button
                        onClick={clearSelection}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-all transform hover:scale-110 active:scale-95"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 bg-gray-100 dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800 flex items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-all"
                    title="Attach file"
                    disabled={uploadingFile}
                  >
                    <Paperclip className="w-6 h-6" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl flex items-center border border-transparent focus-within:border-emerald-500/50 transition-all">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Type a message"
                      className="w-full px-4 py-3 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && !uploadingFile) || sendingMessage}
                    className="p-3 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                icon={MessageCircle}
                title="Your Personal Space"
                description="Select a conversation to start chatting securely with your community."
              />
            )}
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-2xl">
                <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Send Connection Request</h3>
            </div>
            <textarea
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              placeholder="Add a friendly message (optional)"
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all duration-300 resize-none"
              rows={4}
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowConnectionModal(null);
                  setConnectionMessage("");
                }}
                className="flex-1 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => sendConnectionRequest(showConnectionModal)}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-emerald-400/30 transform hover:-translate-y-0.5 transition-all duration-300"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #14b8a6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0d9488);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function MessagesClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
