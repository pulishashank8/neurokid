"use client";

interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (categoryId: string | undefined) => void;
}

export function CategorySidebar({
  categories,
  selectedId,
  onSelect,
}: CategorySidebarProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide px-3 py-2">
        Categories
      </h3>

      <button
        onClick={() => onSelect(undefined)}
        className={`w-full text-left px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
          !selectedId
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
        }`}
      >
        All Categories
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`w-full text-left px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all flex items-center justify-between ${
            selectedId === category.id
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          }`}
        >
          <span>{category.name}</span>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              selectedId === category.id
                ? "bg-white/20"
                : "bg-[var(--bg-elevated)]"
            }`}
          >
            {category.postCount}
          </span>
        </button>
      ))}
    </div>
  );
}
