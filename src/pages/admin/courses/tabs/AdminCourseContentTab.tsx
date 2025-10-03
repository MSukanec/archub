import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { HierarchicalTree } from '@/components/ui-custom/tables-and-trees/HierarchicalTree';
import { useToast } from '@/hooks/use-toast';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

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
}

export default function AdminCourseContentTab({ courseId, modules = [], lessons = [] }: AdminCourseContentTabProps) {
  const { toast } = useToast();
  const { openModal } = useGlobalModalStore();
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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
      const module = modules.find(m => m.id === node.id);
      openModal('course-module', { module, isEditing: true });
    } else {
      const lesson = lessons.find(l => l.id === node.id);
      openModal('lesson', { lesson, isEditing: true });
    }
  };

  const handleDelete = (nodeId: string) => {
    toast({
      title: 'Eliminar',
      description: 'Función en desarrollo',
    });
  };

  const reorderModuleMutation = useMutation({
    mutationFn: async ({ moduleId, newIndex }: { moduleId: string; newIndex: number }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('course_modules')
        .update({ sort_index: newIndex })
        .eq('id', moduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      toast({ title: 'Orden actualizado', description: 'El orden de los módulos se actualizó correctamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo actualizar el orden.', variant: 'destructive' });
    }
  });

  const moveLessonMutation = useMutation({
    mutationFn: async ({ lessonId, newModuleId, newIndex }: { lessonId: string; newModuleId: string; newIndex: number }) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('lessons')
        .update({ 
          module_id: newModuleId,
          sort_index: newIndex 
        })
        .eq('id', lessonId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', courseId] });
      toast({ title: 'Lección movida', description: 'La lección se movió correctamente.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'No se pudo mover la lección.', variant: 'destructive' });
    }
  });

  const handleTemplate = (node: TreeNode) => {
    // No usado para cursos
  };

  const handleReorder = (reorderedItems: TreeNode[]) => {
    // Reordenar módulos en el nivel superior
    reorderedItems.forEach((item, index) => {
      if (item.type === 'module' && item.order !== index) {
        reorderModuleMutation.mutate({ moduleId: item.id, newIndex: index });
      }
      
      // Reordenar lecciones dentro de cada módulo
      if (item.children) {
        item.children.forEach((child, childIndex) => {
          if (child.type === 'lesson' && child.order !== childIndex) {
            moveLessonMutation.mutate({ 
              lessonId: child.id, 
              newModuleId: item.id, 
              newIndex: childIndex 
            });
          }
        });
      }
    });
  };

  const handleParentChange = (childId: string, newParentId: string | null) => {
    // Solo aplicable a lecciones (children)
    const lesson = lessons.find(l => l.id === childId);
    if (!lesson || !newParentId) return;
    
    // Encontrar el nuevo módulo
    const newModule = modules.find(m => m.id === newParentId);
    if (!newModule) return;
    
    // Calcular nuevo índice (al final del módulo)
    const lessonsInNewModule = lessons.filter(l => l.module_id === newParentId);
    const newIndex = lessonsInNewModule.length;
    
    moveLessonMutation.mutate({ 
      lessonId: childId, 
      newModuleId: newParentId, 
      newIndex 
    });
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
        <p className="text-sm text-muted-foreground">
          Usa los botones en el header para agregar módulos y lecciones
        </p>
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
        onDelete={handleDelete}
        onTemplate={handleTemplate}
        enableDragAndDrop={true}
        onReorder={handleReorder}
        onParentChange={handleParentChange}
        showOrderNumber={false}
      />
    </div>
  );
}
