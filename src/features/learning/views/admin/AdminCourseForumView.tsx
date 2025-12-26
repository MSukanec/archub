import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useGlobalModalStore } from '@/components/modal';
import { HierarchicalTree } from '@/components/shared/trees/HierarchicalTree';
import { Inbox } from 'lucide-react';
import type { ForumCategory } from '@/features/forum/services';

interface AdminCourseForumTabProps {
  courseId: string;
}

interface CategoryTreeNode {
  id: string;
  name: string;
  code?: string;
  children?: CategoryTreeNode[];
  order?: number;
  color?: string;
  description?: string | null;
  icon?: string | null;
}

export default function AdminCourseForumTab({ courseId }: AdminCourseForumTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();
  const [expandedCategories] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading } = useQuery<ForumCategory[]>({
    queryKey: ['/api/forum/courses', courseId, 'categories'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/forum/courses/${courseId}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!courseId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/forum/categories/${id}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al eliminar categoría');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/courses', courseId, 'categories'] });
      toast({ title: 'Categoría eliminada', description: 'La categoría se ha eliminado correctamente' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await apiRequest('POST', `/api/forum/courses/${courseId}/categories/reorder`, { orderedIds });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al reordenar categorías');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/forum/courses', courseId, 'categories'] });
      toast({ title: 'Orden actualizado', description: 'El orden de las categorías se ha guardado' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (category: CategoryTreeNode) => {
    const originalCategory = categories.find(c => c.id === category.id);
    if (originalCategory) {
      openModal('course-forum-category', { courseId, category: originalCategory, mode: 'edit' });
    }
  };

  const handleDelete = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      openModal('delete-confirmation', {
        mode: 'delete',
        title: 'Eliminar Categoría',
        description: 'Esta acción eliminará la categoría y todos sus hilos asociados.',
        itemName: category.name,
        onDelete: () => deleteMutation.mutate(categoryId),
      });
    }
  };

  const handleReorder = (reorderedItems: CategoryTreeNode[]) => {
    const orderedIds = reorderedItems.map(item => item.id);
    reorderMutation.mutate(orderedIds);
  };

  const treeCategories: CategoryTreeNode[] = categories.map((cat, index) => ({
    id: cat.id,
    name: cat.name,
    code: cat.icon || 'MessageSquare',
    order: cat.sort_order ?? index,
    color: cat.color || '#3b82f6',
    description: cat.description,
    icon: cat.icon,
  }));

  if (isLoading) {
    return (
      <div className="p-6" data-testid="admin-course-forum-tab">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="p-6" data-testid="admin-course-forum-tab">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Sin categorías</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Aún no hay categorías en el foro de este curso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admin-course-forum-tab">
      <HierarchicalTree
        categories={treeCategories}
        expandedCategories={expandedCategories}
        onToggleExpanded={() => {}}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTemplate={() => {}}
        enableDragAndDrop={true}
        onReorder={handleReorder}
        showOrderNumber={true}
      />
    </div>
  );
}
