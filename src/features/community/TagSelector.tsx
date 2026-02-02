"use client";

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

interface TagSelectorProps {
  tags: Tag[];
  selectedIds?: string[];
  onSelect: (tagIds: string[]) => void;
  maxTags?: number;
}

export function TagSelector({
  tags,
  selectedIds = [],
  onSelect,
  maxTags = 5,
}: TagSelectorProps) {
  const handleToggle = (tagId: string) => {
    let newSelected: string[];
    if (selectedIds.includes(tagId)) {
      newSelected = selectedIds.filter((id) => id !== tagId);
    } else {
      if (selectedIds.length < maxTags) {
        newSelected = [...selectedIds, tagId];
      } else {
        return; // Max tags reached
      }
    }
    onSelect(newSelected);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
          Tags
        </h3>
        {selectedIds.length > 0 && (
          <button
            onClick={() => onSelect([])}
            className="text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleToggle(tag.id)}
            disabled={
              !selectedIds.includes(tag.id) && selectedIds.length >= maxTags
            }
            className={`px-3 py-2 rounded-full text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedIds.includes(tag.id)
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)]"
            }`}
            title={tag.name}
          >
            #{tag.name}
          </button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {selectedIds.length} of {maxTags} tags selected
        </p>
      )}
    </div>
  );
}
