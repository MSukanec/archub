import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Briefcase,
  HelpCircle,
  Lightbulb,
  Users,
  Megaphone,
  BookOpen,
  Wrench,
  Star,
  Folder,
  type LucideIcon,
} from 'lucide-react';
import type { ForumCategoryWithCounts } from '../services';

const ICON_MAP: Record<string, LucideIcon> = {
  'message-square': MessageSquare,
  'briefcase': Briefcase,
  'help-circle': HelpCircle,
  'lightbulb': Lightbulb,
  'users': Users,
  'megaphone': Megaphone,
  'book-open': BookOpen,
  'wrench': Wrench,
  'star': Star,
  'folder': Folder,
};

function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName) return MessageSquare;
  return ICON_MAP[iconName] || MessageSquare;
}

interface CategoryListProps {
  categories: ForumCategoryWithCounts[];
  selectedCategory: string | null;
  onCategorySelect: (categorySlug: string | null) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryListProps) {
  return (
    <nav className="space-y-1" data-testid="category-list">
      <button
        onClick={() => onCategorySelect(null)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          selectedCategory === null
            ? 'bg-accent text-white'
            : 'text-[var(--text-default)] hover:bg-[var(--hover-bg)]'
        )}
        data-testid="category-all"
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">Todos</span>
      </button>

      {categories.map((category) => {
        const Icon = getIconComponent(category.icon);
        const isSelected = selectedCategory === category.slug;
        const threadCount = category.thread_count ?? 0;

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.slug)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isSelected
                ? 'bg-accent text-white'
                : 'text-[var(--text-default)] hover:bg-[var(--hover-bg)]'
            )}
            data-testid={`category-${category.slug}`}
          >
            <Icon
              className="h-4 w-4 flex-shrink-0"
              style={{ color: isSelected ? undefined : category.color || undefined }}
            />
            <span className="flex-1 text-left truncate">{category.name}</span>
            {threadCount > 0 && (
              <Badge
                variant={isSelected ? 'secondary' : 'outline'}
                className="text-xs px-1.5 py-0"
              >
                {threadCount}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}
