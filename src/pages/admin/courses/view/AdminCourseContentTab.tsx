import { useState } from 'react';
import { HierarchicalTree } from '@/components/ui-custom/tables-and-trees/HierarchicalTree';

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
        onEdit={() => {}}
        onDelete={() => {}}
        onTemplate={() => {}}
        enableDragAndDrop={false}
        showOrderNumber={false}
      />
    </div>
  );
}
