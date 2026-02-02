export function PostCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-premium overflow-hidden">
      <div className="flex gap-4">
        <div className="hidden sm:flex flex-col items-center gap-2 pr-4 border-r border-[var(--border)]/50">
          <div className="w-10 h-10 rounded-xl skeleton" />
          <div className="w-6 h-4 rounded skeleton" />
          <div className="w-10 h-10 rounded-xl skeleton" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full skeleton" />
            <div className="h-4 w-24 rounded-lg skeleton" />
            <div className="h-4 w-16 rounded-lg skeleton" />
          </div>
          
          <div className="space-y-3">
            <div className="h-6 rounded-lg skeleton w-4/5" />
            <div className="h-4 rounded-lg skeleton w-full" />
            <div className="h-4 rounded-lg skeleton w-3/4" />
          </div>
          
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded-full skeleton" />
            <div className="h-7 w-16 rounded-full skeleton" />
            <div className="h-7 w-24 rounded-full skeleton" />
          </div>
          
          <div className="pt-4 border-t border-[var(--border)]/50 flex items-center gap-4">
            <div className="h-10 w-24 rounded-xl skeleton" />
            <div className="flex-1" />
            <div className="h-10 w-20 rounded-xl skeleton" />
            <div className="h-10 w-10 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="py-4 animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full skeleton" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 rounded skeleton" />
            <div className="h-3 w-16 rounded skeleton" />
          </div>
          <div className="space-y-2">
            <div className="h-4 rounded skeleton w-full" />
            <div className="h-4 rounded skeleton w-4/5" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-16 rounded-lg skeleton" />
            <div className="h-8 w-16 rounded-lg skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-[var(--surface2)]`}
        />
        <div
          className={`${sizeClasses[size]} rounded-full border-2 border-transparent border-t-[var(--primary)] animate-spin absolute inset-0`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse`} />
        </div>
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-16 page-transition">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="h-12 w-64 rounded-xl skeleton" />
          <div className="h-6 w-96 rounded-lg skeleton" />
          <div className="grid gap-4 mt-8">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
