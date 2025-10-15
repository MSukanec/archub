import { useState } from 'react';
import { HierarchicalTree } from '@/components/ui-custom/tables-and-trees/HierarchicalTree';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AdminCourseContentTabProps {
  courseId?: string;
  modules?: any[];
  lessons?: any[];
}

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  order?: number;
  type?: 'module' | 'lesson';
  module_id?: string; // Para saber a qué módulo pertenece una lección
}

export default function AdminCourseContentTab({ courseId, modules = [], lessons = [] }: AdminCourseContentTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Transform modules and lessons into tree structure
  const treeData: TreeNode[] = modules.map((module) => ({
    id: module.id,
    name: module.title,
    type: 'module' as const,
    order: module.sort_index,
    children: lessons
      .filter((lesson: any) => lesson.module_id === module.id)
      .map((lesson: any) => ({
        id: lesson.id,
        name: lesson.title,
        type: 'lesson' as const,
        order: lesson.sort_index,
        module_id: module.id,
      })),
  }));

  const handleToggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEdit = (node: TreeNode) => {
    if (node.type === 'module') {
      // Encontrar el módulo completo en los datos originales
      const moduleData = modules.find(m => m.id === node.id);
      openModal('course-module', {
        module: moduleData,
        courseId,
        isEditing: true,
      });
    } else if (node.type === 'lesson') {
      // Encontrar la lección completa en los datos originales
      const lessonData = lessons.find(l => l.id === node.id);
      openModal('lesson', {
        lesson: lessonData,
        courseId,
        isEditing: true,
      });
    }
  };

  const handleReorder = async (reorderedItems: TreeNode[]) => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Actualizar el orden de todos los elementos reordenados
      const updates: Promise<any>[] = [];

      reorderedItems.forEach((item, index) => {
        if (item.type === 'module') {
          // Actualizar módulo
          updates.push(
            fetch(`/api/admin/modules/${item.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ sort_index: index })
            })
          );
        } else if (item.type === 'lesson') {
          // Actualizar lección
          updates.push(
            fetch(`/api/admin/lessons/${item.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ sort_index: index })
            })
          );
        }
      });

      await Promise.all(updates);

      // Invalidar cache para refrescar los datos
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/modules', courseId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons', courseId] });

      toast({
        title: 'Orden actualizado',
        description: 'El orden de los elementos se actualizó correctamente',
      });
    } catch (error) {
      console.error('Error al actualizar el orden:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el orden de los elementos',
      });
    }
  };

  const handleParentChange = async (childId: string, newParentId: string | null) => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado');
      }

      // Solo permitir cambiar el módulo padre de las lecciones
      const lesson = lessons.find(l => l.id === childId);
      if (!lesson) return;

      if (!newParentId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Las lecciones deben pertenecer a un módulo',
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Actualizar el module_id de la lección
      const res = await fetch(`/api/admin/lessons/${childId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ module_id: newParentId })
      });

      if (!res.ok) throw new Error('Failed to update lesson');

      // Invalidar cache
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/lessons', courseId] });

      toast({
        title: 'Lección movida',
        description: 'La lección se movió al nuevo módulo correctamente',
      });
    } catch (error) {
      console.error('Error al cambiar el módulo padre:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo mover la lección al nuevo módulo',
      });
    }
  };

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">No hay módulos en este curso</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HierarchicalTree
        categories={treeData}
        expandedCategories={expandedCategories}
        onToggleExpanded={handleToggleExpanded}
        onEdit={handleEdit}
        onDelete={() => {}}
        onTemplate={() => {}}
        enableDragAndDrop={true}
        showOrderNumber={true}
        onReorder={handleReorder}
        onParentChange={handleParentChange}
      />
    </div>
  );
}
