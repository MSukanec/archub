import { format, addDays } from 'date-fns';
import { ConstructionTask } from '@/hooks/use-construction-tasks';
import { ConstructionDependencyWithTasks } from '@/hooks/use-construction-dependencies';

export interface TaskUpdate {
  id: string;
  start_date: string;
  end_date: string;
  duration_in_days: number;
}

/**
 * Propaga automáticamente cambios de fechas a tareas dependientes
 * Cuando una tarea cambia, todas las tareas que dependen de ella se mueven automáticamente
 */
export function propagateDependencyChanges(
  changedTaskId: string,
  newEndDate: string,
  allTasks: ConstructionTask[],
  dependencies: ConstructionDependencyWithTasks[]
): TaskUpdate[] {
  const updates: TaskUpdate[] = [];
  const processedTasks = new Set<string>();
  
  // Función recursiva para propagar cambios
  function propagateRecursive(predecessorTaskId: string, predecessorEndDate: string) {
    // Buscar todas las tareas que dependen de esta
    const dependentTasks = dependencies.filter(dep => 
      dep.predecessor_task_id === predecessorTaskId &&
      dep.type === 'finish-to-start' // Solo finish-to-start por ahora
    );
    
    dependentTasks.forEach(dependency => {
      const successorTaskId = dependency.successor_task_id;
      
      // Evitar procesamiento circular
      if (processedTasks.has(successorTaskId)) return;
      processedTasks.add(successorTaskId);
      
      const successorTask = allTasks.find(task => task.id === successorTaskId);
      if (!successorTask) return;
      
      // Calcular nueva fecha de inicio: día siguiente al final del predecesor
      const predecessorEnd = new Date(predecessorEndDate);
      const lagDays = dependency.lag_days || 0;
      const newSuccessorStartDate = addDays(predecessorEnd, 1 + lagDays);
      
      // Mantener la duración original de la tarea sucesora
      const duration = successorTask.duration_in_days || 1;
      const newSuccessorEndDate = addDays(newSuccessorStartDate, duration - 1);
      
      // Solo actualizar si realmente cambió la fecha
      const currentStartDate = successorTask.start_date ? new Date(successorTask.start_date) : null;
      if (!currentStartDate || currentStartDate.getTime() !== newSuccessorStartDate.getTime()) {
        const update: TaskUpdate = {
          id: successorTaskId,
          start_date: format(newSuccessorStartDate, 'yyyy-MM-dd'),
          end_date: format(newSuccessorEndDate, 'yyyy-MM-dd'),
          duration_in_days: duration
        };
        
        updates.push(update);
        
        // Continuar propagando desde esta tarea hacia sus dependientes
        propagateRecursive(successorTaskId, update.end_date);
      }
    });
  }
  
  // Iniciar la propagación desde la tarea que cambió
  propagateRecursive(changedTaskId, newEndDate);
  
    changedTaskId,
    newEndDate,
    propagatedUpdates: updates.length,
    updates: updates.map(u => ({
      taskId: u.id,
      newStart: u.start_date,
      newEnd: u.end_date
    }))
  });
  
  return updates;
}

/**
 * Aplica las actualizaciones de propagación al caché optimistamente
 */
export function applyOptimisticPropagation(
  oldData: ConstructionTask[] | undefined,
  propagationUpdates: TaskUpdate[]
): ConstructionTask[] | undefined {
  if (!oldData) return oldData;
  
  return oldData.map(task => {
    const update = propagationUpdates.find(u => u.id === task.id);
    if (update) {
      return {
        ...task,
        start_date: update.start_date,
        end_date: update.end_date,
        duration_in_days: update.duration_in_days
      };
    }
    return task;
  });
}