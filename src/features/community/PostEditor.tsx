"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPostSchema, CreatePostInput } from "@/lib/validations/community";
import toast from "react-hot-toast";
import { 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  EyeOff, 
  Check,
  ChevronDown,
  Hash,
  Type,
  FileText,
  Shield,
  Sparkles
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

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
    setValue,
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
  const title = watch("title");
  const categoryId = watch("categoryId");

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Title Field - Premium Styling */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Type className="w-4 h-4 text-[var(--primary)]" />
          Post Title
        </label>
        <div className="relative group">
          <input
            type="text"
            placeholder="What would you like to discuss?"
            className="w-full px-4 py-3.5 bg-[var(--background)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-300 input-premium"
            {...register("title")}
          />
          {/* Focus Glow */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-focus-within:from-emerald-500/5 group-focus-within:via-teal-500/5 group-focus-within:to-cyan-500/5 pointer-events-none transition-all duration-500 -z-10 blur-xl" />
        </div>
        {errors.title && (
          <p className="text-sm text-[var(--error)] flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--error)]" />
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Category Field - Fixed Dark Mode & Premium */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Hash className="w-4 h-4 text-[var(--primary)]" />
          Category
        </label>
        <div className="relative group">
          <select
            className="w-full px-4 py-3.5 bg-[var(--background)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 transition-all duration-300 appearance-none cursor-pointer dark:bg-[var(--surface2)] dark:text-[var(--text)]"
            style={{
              // Fix for dark mode option visibility
              colorScheme: 'dark light',
            }}
            {...register("categoryId")}
          >
            <option value="" className="bg-[var(--surface)] text-[var(--text)] dark:bg-[var(--surface2)] dark:text-[var(--text)]">
              Select a category...
            </option>
            {categories.map((cat) => (
              <option 
                key={cat.id} 
                value={cat.id}
                className="bg-[var(--surface)] text-[var(--text)] dark:bg-[var(--surface2)] dark:text-[var(--text)]"
              >
                {cat.name}
              </option>
            ))}
          </select>
          {/* Custom Chevron */}
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)] pointer-events-none transition-colors group-hover:text-[var(--primary)]" />
          
          {/* Selected Category Badge */}
          {categoryId && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <span className="px-2 py-0.5 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                {categories.find(c => c.id === categoryId)?.name}
              </span>
            </div>
          )}
        </div>
        {errors.categoryId && (
          <p className="text-sm text-[var(--error)] flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--error)]" />
            {errors.categoryId.message}
          </p>
        )}
      </div>

      {/* Tags Section - Premium Pill Design */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Hash className="w-4 h-4 text-[var(--primary)]" />
            Tags
            <span className="text-xs font-normal text-[var(--muted)]">
              (up to 5)
            </span>
            {selectedTags.length > 0 && (
              <span className="ml-auto text-xs font-medium text-[var(--primary)]">
                {selectedTags.length} selected
              </span>
            )}
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
                  className={`group relative px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105"
                      : isDisabled
                        ? "bg-[var(--surface2)] text-[var(--muted)] opacity-40 cursor-not-allowed"
                        : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-[var(--surface2)]/80 hover:text-[var(--text)] hover:shadow-md border border-transparent hover:border-[var(--border)]"
                  }`}
                >
                  {/* Selected Shine Effect */}
                  {isSelected && (
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  )}
                  <span className="relative flex items-center gap-1">
                    #{tag.name}
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
          
          {fieldErrors.tagIds && (
            <p className="text-sm text-[var(--error)]">{fieldErrors.tagIds}</p>
          )}
        </div>
      )}

      {/* Content Field - Premium Textarea */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <FileText className="w-4 h-4 text-[var(--primary)]" />
            Content
          </label>
          
          {/* Preview Toggle - Premium Button */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]/80 transition-all duration-200"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Preview
              </>
            )}
          </button>
        </div>

        <div className="relative group">
          {showPreview ? (
            <div className="min-h-[220px] p-5 bg-[var(--background)] border-2 border-[var(--border)] rounded-xl prose prose-sm dark:prose-invert max-w-none">
              {content ? (
                <p className="text-[var(--text)] whitespace-pre-wrap break-words leading-relaxed">
                  {content}
                </p>
              ) : (
                <p className="text-[var(--muted)]/50 italic">
                  Your preview will appear here...
                </p>
              )}
            </div>
          ) : (
            <textarea
              placeholder="Share your thoughts, tips, or questions. (Markdown supported)"
              className="w-full px-4 py-4 bg-[var(--background)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 resize-none min-h-[220px] leading-relaxed transition-all duration-300 input-premium"
              {...register("content")}
            />
          )}
        </div>

        {errors.content && (
          <p className="text-sm text-[var(--error)] flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--error)]" />
            {errors.content.message}
          </p>
        )}
        
        {/* Character Count - Premium Style */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted)]">
            <span className={`font-medium ${content?.length > 45000 ? 'text-[var(--warning)]' : 'text-[var(--primary)]'}`}>
              {content?.length || 0}
            </span>
            <span className="text-[var(--muted)]"> / 50,000 characters</span>
          </p>
          
          {/* Markdown Hint */}
          <p className="text-xs text-[var(--muted)]/70">
            Markdown supported
          </p>
        </div>

        {/* Image Upload - Premium Design */}
        <div className="pt-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || imageUrls.length >= 4}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface2)] hover:bg-[var(--surface2)]/80 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)]/50 rounded-xl text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
              )}
              <span>Add Image</span>
              <span className="px-1.5 py-0.5 bg-[var(--border)] rounded-md text-xs">
                {imageUrls.length}/4
              </span>
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Image Previews - Premium Grid */}
          {imageUrls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto py-3 mt-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative w-24 h-24 flex-shrink-0 group rounded-xl overflow-hidden border-2 border-[var(--border)]">
                  <img 
                    src={url} 
                    alt={`Upload ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-[var(--error)] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Anonymous Toggle - Premium Card */}
      <div className="relative overflow-hidden rounded-xl border-2 border-[var(--border)] bg-gradient-to-r from-[var(--surface)] to-[var(--surface2)]/30 p-5 hover:border-[var(--primary)]/30 transition-colors duration-300 group">
        {/* Subtle Glow */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-2xl group-hover:bg-[var(--primary)]/10 transition-colors duration-500" />
        
        <label className="relative flex items-start gap-4 cursor-pointer">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-6 h-6 rounded-lg border-2 border-[var(--border)] bg-[var(--background)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all duration-300 flex items-center justify-center">
              <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${isAnonymous ? 'scale-100' : 'scale-0'}`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--primary)]" />
              <p className="text-sm font-semibold text-[var(--text)]">
                Post anonymously
              </p>
            </div>
            <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
              Your username will not be visible. This is helpful for sensitive topics and provides additional privacy.
            </p>
          </div>
        </label>
      </div>

      {/* Submit Button - Premium Design */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="relative w-full group overflow-hidden"
        >
          {/* Button Background with Gradient */}
          <div className={`
            relative w-full py-4 rounded-xl font-semibold text-white
            bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500
            bg-[length:200%_100%] animate-gradient
            shadow-lg shadow-emerald-500/25
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]
            active:scale-[0.98]
          `}>
            {/* Shine Effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            {/* Button Content */}
            <span className="relative flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isEditing ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{isEditing ? "Update Post" : "Create Post"}</span>
                </>
              )}
            </span>
          </div>
        </button>
        
        {/* Helper Text */}
        <p className="text-center text-xs text-[var(--muted)] mt-3">
          Press <kbd className="px-1.5 py-0.5 bg-[var(--surface2)] rounded text-[var(--text)] font-mono text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-[var(--surface2)] rounded text-[var(--text)] font-mono text-xs">Enter</kbd> to submit
        </p>
      </div>
    </form>
  );
}
