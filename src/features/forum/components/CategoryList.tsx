import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreVertical,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';
import { useDeleteCategory, type ForumCategoryWithCounts } from '../services';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useToast } from '@/hooks/use-toast';
export const ICON_MAP: Record<string, LucideIcon> = {
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
export function getIconComponent(iconName: string | null): LucideIcon {
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
  const isAdmin = useIsAdmin();
  const { openModal } = useGlobalModalStore();
  const deleteMutation = useDeleteCategory();
  const { toast } = useToast();
  const handleEditCategory = (category: ForumCategoryWithCounts, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('forum-category', { category, mode: 'edit'});
  };
  const handleDeleteCategory = (category: ForumCategoryWithCounts, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar Categoría',
      description: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      itemName: category.name,
      itemType: 'categoría',
      consequences: [
        'Todos los temas de esta categoría serán eliminados',
        'Las respuestas y reacciones asociadas también se eliminarán',
      ],
      onDelete: async () => {
        try {
          await deleteMutation.mutateAsync(category.id);
          toast({
            title: 'Categoría eliminada',
            description: 'La categoría ha sido eliminada exitosamente',
          });
          if (selectedCategory === category.slug) {
            onCategorySelect(null);
          }
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo eliminar la categoría',
            variant: 'destructive',
          });
        }
      },
    });
  };
  return (
    <nav className="space-y-1" data-testid="category-list">
      <button
        onClick={() => onCategorySelect(null)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
          selectedCategory === null
            ? 'bg-accent text-white font-medium'
            : 'text-[var(--text-default)] hover:bg-[var(--hover-bg)]'
        )}
        data-testid="category-all"
      >
        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Todos</span>
      </button>
      {categories.map((category) => {
        const Icon = getIconComponent(category.icon);
        const isSelected = selectedCategory === category.slug;
        const threadCount = category.thread_count ?? 0;
        return (
          <div
            key={category.id}
            className="relative group"
          >
            <button
              onClick={() => onCategorySelect(category.slug)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors',
                isSelected
                  ? 'bg-accent text-white font-medium'
                  : 'text-[var(--text-default)] hover:bg-[var(--hover-bg)]'
              )}
              data-testid={`category-${category.slug}`}
            >
              <Icon
                className="h-3.5 w-3.5 flex-shrink-0"
                style={{ color: isSelected ? undefined : category.color || undefined }}
              />
              <span className="flex-1 text-left truncate">{category.name}</span>
              {threadCount > 0 && (
                <Badge
                  variant={isSelected ? 'secondary': 'outline'}
                  className="text-xs px-1.5 py-0"
                >
                  {threadCount}
                </Badge>
              )}
            </button>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                      isSelected ? 'text-white hover:bg-white/20': 'text-muted-foreground hover:bg-muted'
                    )}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`category-menu-${category.slug}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => handleEditCategory(category, e)}
                    data-testid={`category-edit-${category.slug}`}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleDeleteCategory(category, e)}
                    className="text-destructive focus:text-destructive"
                    data-testid={`category-delete-${category.slug}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}
    </nav>
  );
}
