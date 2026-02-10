"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, UserPlus, Check, Clock, ArrowLeft, MessageCircle, FileText, Heart, Bookmark, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  createdAt: string;
}

interface ConnectionStatus {
  status: "none" | "pending_sent" | "pending_received" | "connected";
  requestId?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  _count?: {
    comments: number;
  };
  upvotes?: number;
}

type TabType = "posts" | "likes" | "saved";

/** Format count for display: 1000 → "1K", 1.5K, 1M (same as resources and community) */
function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [username, setUsername] = useState<string>("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: "none" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    params.then((p) => setUsername(decodeURIComponent(p.username)));
  }, [params]);

  useEffect(() => {
    if (!username) return;
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("User not found");
          } else {
            setError("Failed to load profile");
          }
          return;
        }
        const data = await res.json();
        setProfile(data.user);
        setConnectionStatus(data.connectionStatus || { status: "none" });
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await fetch(`/api/posts?authorId=${profile.id}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [profile]);

  const isOwnProfile = session?.user?.id === profile?.id;

  useEffect(() => {
    if (!isOwnProfile && activeTab !== "posts") {
      setActiveTab("posts");
    }
  }, [isOwnProfile, activeTab]);

  useEffect(() => {
    if (!profile || activeTab !== "likes" || !isOwnProfile) return;
    if (likedPosts.length > 0) return;
    
    const fetchLiked = async () => {
      setLikesLoading(true);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/upvoted`);
        if (res.ok) {
          const data = await res.json();
          setLikedPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch liked posts:", err);
      } finally {
        setLikesLoading(false);
      }
    };

    fetchLiked();
  }, [profile, activeTab, username, likedPosts.length, isOwnProfile]);

  useEffect(() => {
    if (!profile || activeTab !== "saved" || !isOwnProfile) return;
    if (savedPosts.length > 0) return;
    
    const fetchSaved = async () => {
      setSavedLoading(true);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(username)}/saved`);
        if (res.ok) {
          const data = await res.json();
          setSavedPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch saved posts:", err);
      } finally {
        setSavedLoading(false);
      }
    };

    fetchSaved();
  }, [profile, activeTab, username, savedPosts.length, isOwnProfile]);

  const handleSendRequest = async () => {
    if (!profile || sending) return;
    
    setSending(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverUsername: profile.username,
          message: requestMessage.trim() || undefined,
        }),
      });
      
      if (res.ok) {
        setConnectionStatus({ status: "pending_sent" });
        setShowMessageInput(false);
        setRequestMessage("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send request");
      }
    } catch (err) {
      alert("Failed to send request");
    } finally {
      setSending(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/community" className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Community
          </Link>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center">
            <User className="w-16 h-16 mx-auto text-[var(--muted)] mb-4" />
            <h1 className="text-xl font-bold text-[var(--text)] mb-2">{error}</h1>
            <p className="text-[var(--muted)]">The user you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const renderPostsList = (postsList: Post[], isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      );
    }

    if (postsList.length === 0) {
      return (
        <div className="text-center py-12 text-[var(--muted)]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[var(--border)]">
        {postsList.map((post) => (
          <Link
            key={post.id}
            href={`/community/post/${post.id}`}
            className="block p-4 hover:bg-[var(--surface2)] transition-colors"
          >
            <h3 className="font-semibold text-[var(--text)] mb-1 line-clamp-1">{post.title}</h3>
            <p className="text-sm text-[var(--muted)] line-clamp-2 mb-2">{post.content}</p>
            <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {post._count?.comments !== undefined && (
                <span>{post._count.comments} comments</span>
              )}
              {post.upvotes !== undefined && (
                <span>{formatCompactCount(post.upvotes)} upvotes</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pt-24 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/community" className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </Link>

        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 rounded-full bg-[var(--surface)] border-4 border-[var(--surface)] flex items-center justify-center shadow-lg">
                <User className="w-10 h-10 text-[var(--muted)]" />
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--text)]">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-[var(--muted)]">@{profile.username}</p>
              <p className="text-sm text-[var(--muted)] mt-2">
                Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            {!isOwnProfile && session && (
              <div className="border-t border-[var(--border)] pt-6">
                {connectionStatus.status === "none" && (
                  <div>
                    {!showMessageInput ? (
                      <button
                        onClick={() => setShowMessageInput(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
                      >
                        <UserPlus className="w-5 h-5" />
                        Send Connection Request
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-[var(--muted)]">Add a message to your connection request (optional):</p>
                        <textarea
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value.slice(0, 300))}
                          placeholder="Hi! I'd love to connect with you..."
                          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                          rows={3}
                          maxLength={300}
                        />
                        <p className="text-xs text-[var(--muted)] text-right">{requestMessage.length}/300</p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleSendRequest}
                            disabled={sending}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all"
                          >
                            {sending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-5 h-5" />
                                Send Request
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowMessageInput(false);
                              setRequestMessage("");
                            }}
                            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] font-medium hover:bg-[var(--surface2)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {connectionStatus.status === "pending_sent" && (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                    <Clock className="w-5 h-5" />
                    Connection Request Pending
                  </div>
                )}

                {connectionStatus.status === "pending_received" && (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                    <UserPlus className="w-5 h-5" />
                    This user has sent you a request
                    <Link href="/messages?tab=pending" className="underline ml-2">View</Link>
                  </div>
                )}

                {connectionStatus.status === "connected" && (
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Check className="w-5 h-5" />
                      Connected
                    </div>
                    <Link
                      href="/messages"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold hover:bg-[var(--surface2)] transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message
                    </Link>
                  </div>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div className="border-t border-[var(--border)] pt-6">
                <p className="text-[var(--muted)] text-sm">This is your profile.</p>
              </div>
            )}

            {!session && (
              <div className="border-t border-[var(--border)] pt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                >
                  Sign in to connect
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "posts"
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)] -mb-px"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <FileText className="w-4 h-4" />
              Posts ({posts.length})
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab("likes")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "likes"
                      ? "text-[var(--primary)] border-b-2 border-[var(--primary)] -mb-px"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  My Likes
                </button>
                <button
                  onClick={() => setActiveTab("saved")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "saved"
                      ? "text-[var(--primary)] border-b-2 border-[var(--primary)] -mb-px"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Saved
                </button>
              </>
            )}
          </div>

          {activeTab === "posts" && renderPostsList(posts, postsLoading, "No posts yet")}
          {activeTab === "likes" && isOwnProfile && renderPostsList(likedPosts, likesLoading, "No liked posts yet")}
          {activeTab === "saved" && isOwnProfile && renderPostsList(savedPosts, savedLoading, "No saved posts yet")}
        </div>
      </div>
    </div>
  );
}
