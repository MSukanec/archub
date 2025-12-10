import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGlobalModalStore } from '@/components/modal';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { StatCard, StatCardTitle, StatCardMeta } from '@/components/ui-custom/KPICard';
import { MessageSquare, Plus, Pencil, Trash2, GripVertical, Inbox } from 'lucide-react';
import type { ForumCategory } from '@/features/forum/services';

interface AdminCourseForumTabProps {
  courseId: string;
}

export default function AdminCourseForumTab({ courseId }: AdminCourseForumTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'MessageSquare',
    color: '#3b82f6',
  });

  const { data: categories = [], isLoading } = useQuery<ForumCategory[]>({
    queryKey: ['/api/forum/courses', courseId, 'categories'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/forum/courses/${courseId}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!courseId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', `/api/forum/courses/${courseId}/categories`, data);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al crear categoría');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/courses', courseId, 'categories'] });
      toast({ title: 'Categoría creada', description: 'La categoría se ha creado correctamente' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest('PATCH', `/api/forum/categories/${id}`, data);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al actualizar categoría');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/courses', courseId, 'categories'] });
      toast({ title: 'Categoría actualizada', description: 'Los cambios se han guardado' });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
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
      toast({ title: 'Categoría eliminada', description: 'La categoría ha sido eliminada' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: 'MessageSquare', color: '#3b82f6' });
  };

  const handleEdit = (category: ForumCategory) => {
    setEditingCategory(category);
    setIsCreating(true);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'MessageSquare',
      color: category.color || '#3b82f6',
    });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
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

  return (
    <div className="p-6 space-y-6" data-testid="admin-course-forum-tab">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Foro del Curso</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura las categorías del foro para que los estudiantes puedan discutir sobre el contenido del curso.
            Cada curso tiene su propio foro independiente.
          </p>
        </div>

        <div className="space-y-4">
          {!isCreating ? (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full"
              data-testid="button-add-category"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Categoría
            </Button>
          ) : (
            <StatCard>
              <StatCardTitle showArrow={false}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </StatCardTitle>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Dudas Generales"
                    data-testid="input-category-name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el propósito de esta categoría"
                    rows={2}
                    data-testid="textarea-category-description"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                      data-testid="input-category-color"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {(createMutation.isPending || updateMutation.isPending) 
                      ? 'Guardando...' 
                      : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    data-testid="button-cancel-category"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </StatCard>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Categorías Configuradas</h3>
        <Table
          columns={columns}
          data={categories}
          isLoading={isLoading}
          emptyStateConfig={{
            icon: <Inbox className="w-10 h-10" />,
            title: 'Sin categorías',
            description: 'No hay categorías configuradas para el foro de este curso',
            actionButton: {
              label: 'Agregar Categoría',
              onClick: () => setIsCreating(true),
            },
          }}
        />
      </div>
    </div>
  );
}
