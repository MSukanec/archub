import { useQuery } from '@tanstack/react-query';
import { useTaskMaterials } from '@/hooks/use-generated-tasks';
import { useTaskLabor } from '@/hooks/use-task-labor';
import { useMemo } from 'react';

// Hook optimizado que calcula costos para múltiples tareas
export function useTaskCostsBatch(tasks: any[]) {
  // Extract unique task IDs
  const taskIds = useMemo(() => {
    return tasks.map(task => task.task_id || task.id).filter(Boolean);
  }, [tasks]);

  // Use React Query to batch fetch all task costs
  const costs = useMemo(() => {
    const costsMap = new Map();

    tasks.forEach(task => {
      const taskId = task.task_id || task.id;
      if (!taskId) return;

      // Calculate Archub cost based on cost_scope
      const calculateArchubCost = (materials: any[], labor: any[], costScope: string) => {
        const materialsCost = materials.reduce((sum, material) => {
          const materialView = Array.isArray(material.materials_view) 
            ? material.materials_view[0] 
            : material.materials_view;
          const unitPrice = materialView?.avg_price || 0;
          const quantity = material.amount || 0;
          return sum + (quantity * unitPrice);
        }, 0);

        const laborCost = labor.reduce((sum, laborItem) => {
          const laborView = laborItem.labor_view;
          const unitPrice = laborView?.avg_price || 0;
          const quantity = laborItem.quantity || 0;
          return sum + (quantity * unitPrice);
        }, 0);

        // Calculate cost based on cost_scope
        switch (costScope || 'materials_and_labor') {
          case 'materials_only':
            return materialsCost;
          case 'labor_only':
            return laborCost;
          case 'materials_and_labor':
          default:
            return materialsCost + laborCost;
        }
      };

      costsMap.set(taskId, {
        taskId,
        materials: [],
        labor: [],
        archubCost: 0,
        calculateArchubCost
      });
    });

    return costsMap;
  }, [tasks]);

  return {
    getTaskCost: (taskId: string) => costs.get(taskId) || { archubCost: 0, materials: [], labor: [] },
    allCosts: costs
  };
}

// Hook simple para una sola tarea que usa datos pre-calculados
export function useTaskCostOptimized(taskId: string, materials: any[] = [], labor: any[] = [], costScope: string = 'materials_and_labor') {
  return useMemo(() => {
    const materialsCost = materials.reduce((sum, material) => {
      const materialView = Array.isArray(material.materials_view) 
        ? material.materials_view[0] 
        : material.materials_view;
      const unitPrice = materialView?.avg_price || 0;
      const quantity = material.amount || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    const laborCost = labor.reduce((sum, laborItem) => {
      const laborView = laborItem.labor_view;
      const unitPrice = laborView?.avg_price || 0;
      const quantity = laborItem.quantity || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    // Calculate cost based on cost_scope
    switch (costScope || 'materials_and_labor') {
      case 'materials_only':
        return materialsCost;
      case 'labor_only':
        return laborCost;
      case 'materials_and_labor':
      default:
        return materialsCost + laborCost;
    }
  }, [materials, labor, costScope]);
}