import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useGlobalModalStore } from '@/components/modal';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { MessageSquare, Pencil, Trash2, Inbox } from 'lucide-react';
import type { ForumCategory } from '@/features/forum/services';

interface AdminCourseForumTabProps {
  courseId: string;
}

export default function AdminCourseForumTab({ courseId }: AdminCourseForumTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();

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

  const handleEdit = (category: ForumCategory) => {
    openModal('course-forum-category', { courseId, category, mode: 'edit' });
  };

  const handleDelete = (category: ForumCategory) => {
    openModal('delete-confirmation', {
      mode: 'delete',
      title: 'Eliminar Categoría',
      description: 'Esta acción eliminará la categoría y todos sus hilos asociados.',
      itemName: category.name,
      onDelete: () => deleteMutation.mutate(category.id),
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Categoría',
      render: (category: ForumCategory) => (
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <MessageSquare className="w-4 h-4" style={{ color: category.color || undefined }} />
          </div>
          <div>
            <p className="font-medium text-sm">{category.name}</p>
            {category.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {category.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sort_order',
      label: 'Orden',
      render: (category: ForumCategory) => (
        <span className="text-sm text-muted-foreground">{category.sort_order}</span>
      ),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (category: ForumCategory) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(category);
            }}
            data-testid={`button-edit-category-${category.id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(category);
            }}
            data-testid={`button-delete-category-${category.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

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
      <Table
        data={categories}
        columns={columns}
        emptyMessage="No hay categorías configuradas"
      />
    </div>
  );
}
