"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MessageCircle,
  MoreVertical,
  Phone,
  Smile,
  Paperclip,
  Mic,
  ArrowLeft,
  Check,
  CheckCheck,
  UserPlus,
  Users,
  X,
  File,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow, format } from "date-fns";

// --- Types ---

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
    isRead: boolean;
  } | null;
  unreadCount?: number;
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

// --- WhatsApp Specific Colors & Assets ---

const WA_BG_LIGHT = "bg-[#efeae2]";
const WA_BG_DARK = "dark:bg-[#0b141a]";
const WA_HEADER_LIGHT = "bg-[#f0f2f5]";
const WA_HEADER_DARK = "dark:bg-[#202c33]";
const WA_SIDEBAR_LIGHT = "bg-white";
const WA_SIDEBAR_DARK = "dark:bg-[#111b21]";
const WA_INCOMING_LIGHT = "bg-white";
const WA_INCOMING_DARK = "dark:bg-[#202c33]";
const WA_OUTGOING_LIGHT = "bg-[#d9fdd3]";
const WA_OUTGOING_DARK = "dark:bg-[#005c4b]";

// --- Components ---

function Avatar({ name, size = "md", url }: { name?: string; size?: "sm" | "md" | "lg" | "xl"; url?: string }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-24 h-24 text-2xl"
  };

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-100 dark:border-gray-700`}
      />
    );
  }

  const initial = name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-medium`}>
      {initial}
    </div>
  );
}

function StatusTick({ isRead }: { isRead: boolean }) {
  return isRead ? (
    <CheckCheck className="w-4 h-4 text-[#53bdeb]" /> // Blue ticks
  ) : (
    <Check className="w-4 h-4 text-gray-400" /> // Gray tick
  );
}

// Doodle Background Component
function ChatBackground() {
  return (
    <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.06] pointer-events-none z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h10v10H10z' fill='%23000' fill-opacity='0.4'/%3E%3C/svg%3E")`
      }}
    />
  );
}

// Temporary icon for empty state
function MonitorIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fillOpacity="0.1" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MessagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [activeTab, setActiveTab] = useState<"chats" | "search" | "pending">("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: string; username: string; displayName: string; avatarUrl?: string; lastActiveAt?: string } | null>(null);

  // Search & Pending
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);

  // Messaging
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connection Modal
  const [showConnectionModal, setShowConnectionModal] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
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
      // Auto-switch to chats tab if we were elsewhere
      setActiveTab("chats");
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch("/api/connections?type=pending-received");
      if (res.ok) {
        const data = await res.json();
        setPendingReceived(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setOtherUser(data.conversation?.otherUser || null);
        // Optimistically update conversation list last message
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim()) || isSending || !selectedConversation) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConversation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages(selectedConversation);
      }
    } catch (err) {
      toast.error("Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File limit 5MB");
      return;
    }

    const toastId = toast.loading("Uploading...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const { url, type } = await uploadRes.json();

      await fetch(`/api/messages/conversations/${selectedConversation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "",
          attachmentUrl: url,
          attachmentType: type.startsWith("image/") ? "image" : "file"
        }),
      });

      fetchMessages(selectedConversation);
      toast.success("Sent", { id: toastId });
    } catch (err) {
      toast.error("Error sending file", { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, message: connectionMessage }),
      });

      if (res.ok) {
        toast.success("Request sent");
        setShowConnectionModal(null);
        setConnectionMessage("");
        setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, connectionStatus: "pending_sent" } : u));
      } else {
        toast.error("Failed");
      }
    } catch {
      toast.error("Error");
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await fetch(`/api/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      toast.success("Accepted connection");
      fetchPendingRequests();
      fetchConversations();
    } catch {
      toast.error("Failed");
    }
  };

  if (status === "loading") return (
    <div className="bg-[#111b21] h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <MessageCircle className="w-12 h-12 text-[#00a884] animate-pulse" />
        <div className="w-64 h-1 bg-[#202c33] rounded overflow-hidden">
          <div className="h-full bg-[#00a884] animate-progress"></div>
        </div>
        <p className="text-[#8696a0] text-sm">End-to-end encrypted</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#d1d7db] dark:bg-[#0b141a] relative">
      {/* Background container for the whole app effect (Web version usually has a margin) */}
      <div className="absolute top-0 w-full h-32 bg-[#00a884] z-0 hidden lg:block"></div>

      <div className="z-10 w-full h-full lg:h-[calc(100vh-38px)] lg:m-auto lg:max-w-[1600px] lg:top-[19px] lg:rounded-none flex shadow-lg bg-[#111b21] overflow-hidden">

        {/* --- LEFT SIDEBAR --- */}
        <div className={`w-full lg:w-[400px] flex flex-col border-r border-gray-200 dark:border-gray-800 ${selectedConversation ? "hidden lg:flex" : "flex"} ${WA_SIDEBAR_LIGHT} ${WA_SIDEBAR_DARK}`}>

          {/* Header */}
          <div className={`px-4 py-2.5 flex justify-between items-center ${WA_HEADER_LIGHT} ${WA_HEADER_DARK}`}>
            <Avatar name={session?.user?.name || "Me"} url={session?.user?.image || undefined} />
            <div className="flex gap-4 text-[#54656f] dark:text-[#aebac1]">
              <button onClick={() => setActiveTab("chats")} className={activeTab === "chats" ? "text-emerald-500" : ""} title="Chats">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTab("search")} className={activeTab === "search" ? "text-emerald-500" : ""} title="New Chat">
                <UserPlus className="w-5 h-5" />
              </button>
              <div className="relative">
                <button onClick={() => setActiveTab("pending")} className={activeTab === "pending" ? "text-emerald-500" : ""} title="Pending Requests">
                  <Users className="w-5 h-5" />
                </button>
                {pendingReceived.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00a884] rounded-full"></span>}
              </div>
              <button><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Search Bar */}
          <div className={`p-2 border-b border-gray-200 dark:border-gray-800 ${WA_SIDEBAR_LIGHT} ${WA_SIDEBAR_DARK}`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-4 w-4 text-[#54656f] dark:text-[#aebac1] ${activeTab === "search" || activeTab === "pending" ? "text-[#00a884]" : ""}`} />
              </div>
              <input
                type="text"
                placeholder={activeTab === "search" ? "Search for new users..." : activeTab === "pending" ? "Filter requests..." : "Search"}
                value={searchQuery}
                onChange={(e) => {
                  if (activeTab === "chats") setSearchQuery(e.target.value); // Just a filter for chats ideally
                  else handleSearch(e.target.value);
                }}
                className={`block w-full pl-10 pr-3 py-1.5 rounded-lg text-sm bg-[#f0f2f5] dark:bg-[#202c33] border-none text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#54656f] dark:placeholder:text-[#aebac1] focus:ring-0`}
              />
            </div>
            {/* Filter buttons */}
            <div className="flex gap-2 mt-2 px-1">
              <button
                onClick={() => setActiveTab("chats")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeTab === "chats" ? "bg-[#e7fce3] dark:bg-[#0a332c] text-[#008069] dark:text-[#00a884]" : "bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >All</button>
              <button
                className={`px-3 py-1 rounded-full text-xs font-medium bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-gray-200 dark:hover:bg-gray-700`}
              >Unread</button>
              <button
                className={`px-3 py-1 rounded-full text-xs font-medium bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] hover:bg-gray-200 dark:hover:bg-gray-700`}
              >Groups</button>
            </div>
          </div>

          {/* List Area */}
          <div className={`flex-1 overflow-y-auto ${WA_SIDEBAR_LIGHT} ${WA_SIDEBAR_DARK} custom-scrollbar`}>
            {activeTab === "chats" && (
              <>
                {/* Archive Row (Visual only) */}
                <div className="flex items-center px-4 py-3 gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer transition-colors">
                  <div className="w-10 flex justify-center"><div className="w-5 h-5 border-2 border-[#54656f] dark:border-[#aebac1] opacity-50 rounded sm" /></div>
                  <span className="font-medium text-[#111b21] dark:text-[#e9edef]">Archived</span>
                </div>
                {/* Chat List */}
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv.id);
                      const newUrl = new URL(window.location.href);
                      newUrl.searchParams.set("conversation", conv.id);
                      window.history.pushState({}, "", newUrl);
                    }}
                    className={`flex items-center px-3 py-3 gap-3 cursor-pointer border-b border-gray-100 dark:border-gray-800 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors ${selectedConversation === conv.id ? "bg-[#f0f2f5] dark:bg-[#2a3942]" : ""}`}
                  >
                    <Avatar name={conv.otherUser.displayName} url={conv.otherUser.avatarUrl} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="font-normal text-[#111b21] dark:text-[#e9edef] truncate">{conv.otherUser.displayName}</h3>
                        {conv.lastMessage && (
                          <span className={`text-xs ${conv.unreadCount ? "text-[#00a884] font-medium" : "text-[#54656f] dark:text-[#aebac1]"}`}>
                            {format(new Date(conv.lastMessage.createdAt), "HH:mm")}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-[#54656f] dark:text-[#aebac1] truncate flex items-center gap-1">
                          {conv.lastMessage?.isFromMe && (
                            <StatusTick isRead={conv.lastMessage.isRead} />
                          )}
                          {conv.lastMessage?.content || "Photo"}
                        </p>
                        {/* Unread Badge (Mock) */}
                        {/* <span className="w-5 h-5 bg-[#25d366] text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span> */}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === "search" && (
              <div className="py-2">
                {isSearching ? (
                  <div className="p-4 text-center text-[#54656f] dark:text-[#aebac1]">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <div key={user.id} className="flex items-center px-4 py-3 gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] cursor-pointer">
                      <Avatar name={user.displayName} url={user.avatarUrl} />
                      <div className="flex-1">
                        <h3 className="font-medium text-[#111b21] dark:text-[#e9edef]">{user.displayName}</h3>
                        <p className="text-sm text-[#54656f] dark:text-[#aebac1]">@{user.username}</p>
                      </div>
                      {user.connectionStatus === "connected" ? (
                        <button
                          onClick={async () => {
                            // 1. Check local
                            const conv = conversations.find(c => c.otherUser.id === user.id);
                            if (conv) {
                              setSelectedConversation(conv.id);
                              setActiveTab("chats");
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
                                body: JSON.stringify({ targetUserId: user.id })
                              });

                              const data = await res.json();

                              if (res.ok && data.conversation) {
                                await fetchConversations(); // Refresh list to include new conv
                                setSelectedConversation(data.conversation.id);
                                setActiveTab("chats");

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
                          }}
                          className="p-2 text-[#00a884] hover:bg-[#25d366]/10 rounded-full"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      ) : user.connectionStatus === "none" ? (
                        <button
                          onClick={() => setShowConnectionModal(user.id)}
                          className="p-2 text-[#00a884] hover:bg-[#25d366]/10 rounded-full"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-xs text-[#54656f]">Pending</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[#54656f] dark:text-[#aebac1]">
                    <p>Search for people to chat with</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pending" && (
              <div className="py-2">
                {pendingReceived.length === 0 ? (
                  <div className="p-8 text-center text-[#54656f] dark:text-[#aebac1]">No pending requests</div>
                ) : (
                  pendingReceived.map(req => (
                    <div key={req.id} className="flex items-center px-4 py-3 gap-4 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]">
                      <Avatar name={req.sender?.displayName} />
                      <div className="flex-1">
                        <h3 className="font-medium text-[#111b21] dark:text-[#e9edef]">{req.sender?.displayName}</h3>
                        <p className="text-xs text-[#54656f] dark:text-[#aebac1]">{req.message || "Wants to connect"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptRequest(req.id)} className="p-2 bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#e9edef] rounded-full">
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>

        {/* --- RIGHT CHAT AREA --- */}
        {selectedConversation && otherUser ? (
          <div className={`flex-1 w-full flex flex-col relative ${WA_BG_LIGHT} ${WA_BG_DARK} ${!selectedConversation ? "hidden lg:flex" : "flex"}`}>
            <ChatBackground />

            {/* Header */}
            <div className={`px-4 py-2.5 flex items-center justify-between border-l border-gray-200 dark:border-gray-800 z-10 ${WA_HEADER_LIGHT} ${WA_HEADER_DARK}`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedConversation(null)} className="lg:hidden text-[#54656f] dark:text-[#aebac1] mr-2">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <Avatar name={otherUser.displayName} url={otherUser.avatarUrl} size="md" />
                <div className="flex flex-col">
                  <span className="font-normal text-[#111b21] dark:text-[#e9edef] text-base leading-tight cursor-pointer">
                    {otherUser.displayName}
                  </span>
                  <span className="text-xs text-[#54656f] dark:text-[#aebac1] truncate">
                    {otherUser.lastActiveAt
                      ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastActiveAt))} ago`
                      : "Online"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-[#54656f] dark:text-[#aebac1]">
                <Search className="w-5 h-5 cursor-pointer" />
                <Phone className="w-5 h-5 cursor-pointer" />
                <MoreVertical className="w-5 h-5 cursor-pointer" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-2 z-10 custom-scrollbar relative">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isChained = i > 0 && messages[i - 1].isFromMe === msg.isFromMe;
                  return (
                    <div key={msg.id} className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"} mb-1 group max-w-full`}>
                      <div className={`relative max-w-[85%] sm:max-w-[65%] px-2 py-1.5 rounded-lg text-sm shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] 
                                      ${msg.isFromMe
                          ? `${WA_OUTGOING_LIGHT} ${WA_OUTGOING_DARK} text-[#111b21] dark:text-[#e9edef] rounded-tr-none`
                          : `${WA_INCOMING_LIGHT} ${WA_INCOMING_DARK} text-[#111b21] dark:text-[#e9edef] rounded-tl-none`
                        }`}
                      >
                        {/* Tail SVG (Simulated with pseudo elements or just simple CSS corners for now) */}

                        {msg.attachmentUrl && (
                          <div className="mb-1 rounded overflow-hidden">
                            {msg.attachmentType === "image" ? (
                              <img src={msg.attachmentUrl} alt="Att" className="max-w-full max-h-[300px] object-cover" />
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-black/5 dark:bg-white/5 rounded">
                                <File className="w-8 h-8 text-gray-500" />
                                <span className="underline">Download</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-end gap-x-2">
                          <span className="whitespace-pre-wrap leading-relaxed px-1">{msg.content}</span>
                          <div className="flex items-center gap-0.5 ml-auto h-4 select-none">
                            <span className={`text-[11px] ${msg.isFromMe ? "text-[#54656f] dark:text-[#8696a0]" : "text-[#54656f] dark:text-[#8696a0]"}`}>
                              {format(new Date(msg.createdAt), "HH:mm")}
                            </span>
                            {msg.isFromMe && <StatusTick isRead={!!msg.readAt} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`px-4 py-3 flex items-end gap-2 z-10 ${WA_HEADER_LIGHT} ${WA_HEADER_DARK}`}>
              <div className="flex items-center gap-2 pb-2 text-[#54656f] dark:text-[#aebac1]">
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"><Smile className="w-6 h-6" /></button>
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-6 h-6" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>

              <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg flex items-center border border-transparent focus-within:border-transparent min-h-[42px] px-4 py-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message"
                  className="w-full bg-transparent text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#54656f] dark:placeholder:text-[#8696a0] focus:outline-none text-base"
                />
              </div>

              <div className="pb-2 text-[#54656f] dark:text-[#aebac1]">
                {newMessage.trim() ? (
                  <button onClick={sendMessage} className="p-2 text-[#00a884]"><Check className="w-6 h-6" /></button> // Using Check as Send for now or create Send icon
                ) : (
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><Mic className="w-6 h-6" /></button>
                )}
              </div>
            </div>

          </div>
        ) : (
          // --- EMPTY STATE (Default WhatsApp Web Screen) ---
          <div className={`hidden lg:flex flex-1 flex-col items-center justify-center border-b-[6px] border-[#25d366] ${WA_HEADER_LIGHT} ${WA_HEADER_DARK}`}>
            <div className="max-w-[560px] text-center px-8">
              <div className="mb-10 text-center flex justify-center">
                <div className="relative">
                  <MonitorIcon className="w-48 h-48 text-[#e9edef] dark:text-[#374248]" />
                </div>
              </div>
              <h1 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">
                Download WhatsApp for Windows
              </h1>
              <p className="text-[#667781] dark:text-[#8696a0] mb-8 text-sm leading-6">
                Make calls, share your screen and get a faster experience when you download the Windows app.
              </p>
              <button className="bg-[#008069] hover:bg-[#00a884] text-white rounded-full px-8 py-2.5 font-medium text-sm transition shadow-sm">
                Get from Microsoft Store
              </button>

              <div className="mt-16 flex items-center justify-center gap-2 text-[#8696a0] text-xs">
                <MessageCircle className="w-3 h-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Connection Modal */}
      {showConnectionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#202c33] rounded-xl w-full max-w-md shadow-lg overflow-hidden animate-scale-in">
            <div className="p-6">
              <h3 className="text-xl font-medium text-[#111b21] dark:text-[#e9edef] mb-4">Send Invite</h3>
              <textarea
                value={connectionMessage}
                onChange={(e) => setConnectionMessage(e.target.value)}
                placeholder="Hi! I'd like to connect on NeuroKind."
                className="w-full p-3 bg-[#f0f2f5] dark:bg-[#111b21] rounded-lg text-[#111b21] dark:text-[#d1d7db] placeholder:text-[#8696a0] focus:outline-none border-b-2 border-[#00a884] min-h-[100px]"
              />
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowConnectionModal(null)}
                  className="px-4 py-2 text-[#00a884] font-medium hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendConnectionRequest(showConnectionModal)}
                  className="px-6 py-2 bg-[#00a884] text-white font-medium rounded-full hover:bg-[#008069] shadow-sm transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(134, 150, 160, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        @keyframes progress {
           from { width: 0%; } to { width: 100%; }
        }
        .animate-progress {
            animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function MessagesClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
