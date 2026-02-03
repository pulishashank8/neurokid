"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PostEditor } from "@/features/community/PostEditor";
import { LoadingSpinner } from "@/features/community/LoadingSkeletons";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowLeft, PenLine } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function NewPostClient() {
  const router = useRouter();

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  // Fetch tags
  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      return res.json();
    },
  });

  const categories: Category[] = categoriesData?.categories || [];
  const tags: Tag[] = tagsData?.tags || [];
  const isLoading = categoriesLoading || tagsLoading;

  const handleSuccess = (postId: string) => {
    router.push(`/community/${postId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20 pb-6 sm:pt-28 sm:pb-16 px-4 sm:px-6">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-tr from-teal-500/8 via-emerald-500/5 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '-6s' }} />
        
        {/* Noise Texture */}
        <div className="absolute inset-0 noise-overlay opacity-30" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Premium Header */}
        <div className="mb-10 sm:mb-14">
          {/* Back Button - Glass Effect */}
          <Link href="/community">
            <Button 
              variant="ghost" 
              size="sm" 
              className="group -ml-2 px-3 py-2 h-auto text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]/50 rounded-full transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="text-sm font-medium">Back to Community</span>
            </Button>
          </Link>

          {/* Title Section with Premium Typography */}
          <div className="mt-8 sm:mt-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Create Something Amazing
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text)] tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-[var(--text)] via-[var(--text)] to-[var(--primary)] bg-clip-text">
                Create a New Post
              </span>
            </h1>
            
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[var(--muted)] max-w-xl leading-relaxed">
              Share your thoughts, questions, or tips with our community. 
              Your voice matters and could help others on their journey.
            </p>
          </div>
        </div>

        {/* Premium Content Card */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="relative group">
            {/* Card Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
            
            {/* Main Card */}
            <div className="relative bg-[var(--surface)] rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-premium overflow-hidden">
              {/* Card Header with Icon */}
              <div className="relative px-6 sm:px-10 py-6 border-b border-[var(--border)] bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface2)]/30">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                    <PenLine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">Post Details</h2>
                    <p className="text-sm text-[var(--muted)]">Fill in the information below</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 sm:px-10 py-8">
                <PostEditor
                  categories={categories}
                  tags={tags}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </div>
        )}

        {/* Premium Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--muted)]">
            By posting, you agree to our{" "}
            <Link href="/guidelines" className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline transition-colors">
              Community Guidelines
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
