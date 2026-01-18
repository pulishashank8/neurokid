"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";

type Tab = "profile" | "security" | "subscription" | "help";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    displayName: "",
    username: "",
    location: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Contact form state
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/settings");
    }
  }, [status, router]);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          displayName: data.profile?.displayName || "",
          username: data.profile?.username || "",
          location: data.profile?.location || "",
        });
        setContactData(prev => ({
          ...prev,
          name: data.profile?.displayName || data.profile?.username || "",
          email: session?.user?.email || "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session?.user, fetchProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSavingPassword(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    if (!confirm("Are you absolutely sure? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      toast.success("Account deleted. Redirecting...");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      toast.error(errorMessage);
      setIsDeleting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
    
    if (typeof formspreeEndpoint !== "string" || !formspreeEndpoint) {
      toast.error("Support form not configured");
      return;
    }

    setIsSendingMessage(true);

    try {
      const response = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      toast.success("Message sent. We will reply soon!");
      setContactData(prev => ({ ...prev, message: "" }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(errorMessage);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          <p className="mt-4 text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      {/* Page Header - Removed duplicate nav */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Settings</h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--muted)]">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)] mb-6 sm:mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === "profile"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === "security"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Login & Security
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === "subscription"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Subscription
          </button>
          <button
            onClick={() => setActiveTab("help")}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === "help"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            Help & Support
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 sm:p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Profile Information</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-lg">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={session.user?.email || ""}
                    disabled
                    className="w-full px-4 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg text-[var(--muted)] cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Your display name"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">This is how your name appears to others</p>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Location (Optional)
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                    placeholder="City, State"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">Helps find local providers and resources</p>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-8">
              {/* Change Password */}
              <div>
                <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                      required
                      minLength={8}
                    />
                    <p className="mt-1 text-xs text-[var(--muted)]">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text)] mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full sm:w-auto"
                  >
                    {isSavingPassword ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </div>

              {/* Delete Account */}
              <div className="pt-8 border-t border-[var(--border)]">
                <h2 className="text-xl font-semibold text-[var(--error)] mb-4">Danger Zone</h2>
                <div className="max-w-lg bg-[var(--error-bg)] border border-[var(--error)] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Delete Account</h3>
                  <p className="text-sm text-[var(--muted)] mb-4">
                    Once you delete your account, there is no going back. Your posts will be anonymized and you will lose access to all data.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="deleteConfirm" className="block text-sm font-medium text-[var(--text)] mb-2">
                        Type <strong>DELETE</strong> to confirm
                      </label>
                      <input
                        id="deleteConfirm"
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--error)]"
                        placeholder="DELETE"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE" || isDeleting}
                      className="px-4 py-2 bg-[var(--error)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isDeleting ? "Deleting..." : "Delete My Account"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Subscription</h2>
              <div className="max-w-lg">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-lg p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Premium Features Coming Soon</h3>
                  <p className="text-[var(--text-secondary)] mb-6">
                    We are working on premium subscription plans with exclusive features, priority support, and ad-free experience.
                  </p>
                  <div className="bg-white border border-[var(--border-light)] rounded-lg p-4 mb-4">
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-[var(--text-primary)]">$9.99</span>
                      <span className="text-[var(--text-muted)]">/month</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Estimated pricing</p>
                  </div>
                  <Button disabled className="w-full opacity-50 cursor-not-allowed">
                    Manage Subscription
                  </Button>
                  <p className="mt-3 text-xs text-[var(--text-muted)]">Currently, all features are free for everyone</p>
                </div>
              </div>
            </div>
          )}

          {/* Help Tab */}
          {activeTab === "help" && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Contact Support</h2>
              {(typeof process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT === "undefined" || !process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT) ? (
                <div className="max-w-lg bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-semibold text-[var(--text)] mb-1">Support form not configured</p>
                      <p className="text-sm text-[var(--muted)]">
                        Set <code className="px-1 py-0.5 bg-[var(--surface2)] rounded text-xs">NEXT_PUBLIC_FORMSPREE_ENDPOINT</code> to enable the contact form.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-lg">
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-sm p-6">
                    <form onSubmit={handleContactSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="contactName" className="block text-sm font-medium text-[var(--text)] mb-2">
                          Name
                        </label>
                        <input
                          id="contactName"
                          type="text"
                          value={contactData.name}
                          onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                          placeholder="Your Name"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="contactEmail" className="block text-sm font-medium text-[var(--text)] mb-2">
                          Email
                        </label>
                        <input
                          id="contactEmail"
                          type="email"
                          value={contactData.email}
                          onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
                          placeholder="Your Email"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-[var(--text)] mb-2">
                          Message
                        </label>
                        <textarea
                          id="message"
                          value={contactData.message}
                          onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
                          placeholder="How can we help you?"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSendingMessage}
                        className="w-full"
                      >
                        {isSendingMessage ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
