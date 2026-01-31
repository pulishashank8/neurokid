"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPostSchema, CreatePostInput } from "@/lib/validations/community";
import toast from "react-hot-toast";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef } from "react";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

// ... imports

interface PostEditorProps {
  categories: Category[];
  tags: Tag[];
  onSuccess?: (postId: string) => void;
  initialData?: {
    title: string;
    content: string;
    categoryId: string;
    isAnonymous: boolean;
    tagIds: string[];
  };
  isEditing?: boolean;
  postId?: string;
}

export function PostEditor({
  categories,
  tags,
  onSuccess,
  initialData,
  isEditing = false,
  postId,
}: PostEditorProps) {
  const [isAnonymous, setIsAnonymous] = useState(initialData?.isAnonymous || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || []);
  const [showPreview, setShowPreview] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    setError,
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      categoryId: initialData?.categoryId || "",
      isAnonymous: initialData?.isAnonymous || false,
      tagIds: initialData?.tagIds || [],
    },
    mode: "onChange",
  });

  const content = watch("content");

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const url = isEditing && postId ? `/api/posts/${postId}` : "/api/posts";
      const method = isEditing && postId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          isAnonymous,
          tagIds: selectedTags,
          images: imageUrls,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle field-level errors from Zod (standard API response)
        if (result.error?.details && Array.isArray(result.error.details)) {
          const newFieldErrors: Record<string, string> = {};
          result.error.details.forEach((err: any) => {
            const path = err.path?.[0];
            if (path) {
              newFieldErrors[path] = err.message;
              setError(path as any, { message: err.message });
            }
          });
          setFieldErrors(newFieldErrors);
        }
        // Handle legacy field errors
        else if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          Object.keys(result.fieldErrors).forEach((key) => {
            setError(key as any, { message: result.fieldErrors[key] });
          });
        }

        const errorMessage = result.error?.message ||
          (typeof result.error === "string" ? result.error : null) ||
          result.message ||
          "Failed to save post";

        throw new Error(errorMessage);
      }

      toast.success(isEditing ? "Post updated successfully!" : "Post created successfully!");
      if (!isEditing) {
        reset();
        setSelectedTags([]);
      }
      onSuccess?.(isEditing && postId ? postId : result.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to save post");
      console.error("Error saving post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId].slice(0, 5)
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size limit is 2MB");
      return;
    }

    if (imageUrls.length >= 4) {
      toast.error("Maximum 4 images allowed");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url, type } = await res.json();

      if (!type.startsWith("image/")) {
        toast.error("Only images are allowed");
        return;
      }

      setImageUrls(prev => [...prev, url]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
          Post Title
        </label>
        <input
          type="text"
          placeholder="What would you like to discuss?"
          className="w-full px-4 py-3 sm:py-4 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[48px]"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-[var(--danger)] mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
          Category
        </label>
        <select
          className="w-full px-4 py-3 sm:py-4 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[48px]"
          {...register("categoryId")}
        >
          <option value="">Select a category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-xs text-[var(--danger)] mt-1">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
            Tags (up to 5) {selectedTags.length > 0 && `- ${selectedTags.length} selected`}
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              const isDisabled = !isSelected && selectedTags.length >= 5;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  disabled={isDisabled}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${isSelected
                    ? "bg-[var(--primary)] text-white"
                    : isDisabled
                      ? "bg-[var(--bg-elevated)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)]"
                    }`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
          {fieldErrors.tagIds && (
            <p className="text-xs text-[var(--danger)] mt-1">{fieldErrors.tagIds}</p>
          )}
        </div>
      )}

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-[var(--text-primary)]">
            Content
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>

        {showPreview ? (
          <div className="min-h-[200px] p-4 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-[var(--radius-md)] prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap break-words">
              {content || "Your preview will appear here..."}
            </p>
          </div>
        ) : (
          <textarea
            placeholder="Share your thoughts, tips, or questions. (Markdown supported)"
            className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none min-h-[200px] font-mono text-sm"
            {...register("content")}
          />
        )}

        {errors.content && (
          <p className="text-xs text-[var(--danger)] mt-1">{errors.content.message}</p>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-2">
          {content?.length || 0} / 50,000 characters
        </p>

        {/* Image Upload */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || imageUrls.length >= 4}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-light)] rounded-lg text-sm font-medium text-[var(--text-secondary)] transition-colors disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Add Image {imageUrls.length}/4
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {imageUrls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative w-24 h-24 flex-shrink-0 group">
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-[var(--border-light)]" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Anonymous Toggle */}
      <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4 border border-[var(--border-light)]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-5 h-5 rounded accent-[var(--primary)]"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Post anonymously
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Your username will not be visible. This is helpful for sensitive topics.
            </p>
          </div>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="w-full min-h-[48px] px-6 rounded-[var(--radius-md)] bg-[var(--primary)] text-white hover:opacity-90 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
