"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PostEditor } from "@/components/community/PostEditor";
import { LoadingSpinner } from "@/components/community/LoadingSkeletons";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function NewPostPage() {
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
    <div className="min-h-screen bg-[var(--bg-primary)] pt-20 pb-6 sm:pt-24 sm:pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              ← Back to Community
            </Button>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-4">
            Create a New Post
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Share your thoughts, questions, or tips with the community
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8">
            <PostEditor
              categories={categories}
              tags={tags}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
