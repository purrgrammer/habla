import { useState } from "react";
import Tag from "./tag";

// Types
type TagSize = "sm" | "md" | "lg" | "xl";
type TagWithSize = {
  name: string;
  count: number;
  size: TagSize;
};

// Classification function
const classifyTags = (tags: Record<string, number>): TagWithSize[] => {
  const entries = Object.entries(tags);
  if (entries.length === 0) return [];

  const counts = entries.map(([_, count]) => count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min;

  return entries
    .map(([name, count]) => {
      let size: TagSize = "sm";
      const normalized = range === 0 ? 1 : (count - min) / range;

      if (normalized < 0.25) size = "sm";
      else if (normalized < 0.5) size = "md";
      else if (normalized < 0.75) size = "lg";
      else size = "xl";

      return { name, count, size };
    })
    .sort((a, b) => b.count - a.count);
};

// TagCloud component
export function TagCloud({ tags }: { tags: Record<string, number> }) {
  const [classifiedTags] = useState<TagWithSize[]>(() => classifyTags(tags));

  const renderBadge = (tag: TagWithSize, index: number) => {
    return (
      <Tag
        key={`${tag.name}-${index}`}
        className={`tag-badge transition-all duration-200 hover:scale-110 hover:z-10`}
        tag={tag.name}
        size={tag.size}
      />
    );
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 items-center justify-center">
      {classifiedTags.map(renderBadge)}
    </div>
  );
}
