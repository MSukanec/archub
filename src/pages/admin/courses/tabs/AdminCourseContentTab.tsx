import { useState } from 'react';
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

  const handleTemplate = (node: TreeNode) => {
    // No usado para cursos
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
        enableDragAndDrop={false}
        showOrderNumber={false}
      />
    </div>
  );
}
