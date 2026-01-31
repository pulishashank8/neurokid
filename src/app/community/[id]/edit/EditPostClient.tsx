"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PostEditor } from "@/components/community/PostEditor";
import { LoadingSpinner } from "@/components/community/LoadingSkeletons";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface EditPostClientProps {
    postId: string;
}

export default function EditPostClient({ postId }: EditPostClientProps) {
    const router = useRouter();

    // Fetch Post Data
    const { data: post, isLoading: postLoading } = useQuery({
        queryKey: ["post", postId],
        queryFn: async () => {
            const res = await fetch(`/api/posts/${postId}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Post not found");
                throw new Error("Failed to fetch post");
            }
            return res.json();
        },
    });

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

    const categories = categoriesData?.categories || [];
    const tags = tagsData?.tags || [];
    const isLoading = postLoading || categoriesLoading || tagsLoading;

    const handleSuccess = (id: string) => {
        router.push(`/community/${id}`);
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen pt-20 text-center">
                <p className="text-xl text-[var(--text-secondary)]">Post not found</p>
            </div>
        );
    }

    // Transform post data for editor
    const initialData = {
        title: post.title,
        content: post.content,
        categoryId: post.categoryId,
        isAnonymous: post.isAnonymous,
        tagIds: post.tags?.map((t: any) => t.id) || [],
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-20 pb-6 sm:pt-24 sm:pb-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 sm:mb-12">
                    <Link href={`/community/${postId}`}>
                        <Button variant="ghost" size="sm">
                            ← Back to Post
                        </Button>
                    </Link>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-4">
                        Edit Post
                    </h1>
                </div>

                {/* Content */}
                <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-light)] p-6 sm:p-8">
                    <PostEditor
                        categories={categories}
                        tags={tags}
                        onSuccess={handleSuccess}
                        initialData={initialData}
                        isEditing={true}
                        postId={postId}
                    />
                </div>
            </div>
        </div>
    );
}
