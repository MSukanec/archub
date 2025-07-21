export type GanttRowProps = {
  id: string;
  name: string;
  type: 'task' | 'group' | 'phase';
  level: number;
  startDate?: string;
  endDate?: string;           // Optional: exact end date
  durationInDays?: number;    // Optional: duration in days from start
  isHeader?: boolean;         // True for group headers
  phaseData?: any;            // Data for phase rows
  taskData?: any;             // Data for task rows
  phaseTasks?: any[];         // Tasks contained in phase for automatic date calculation
  onClick?: (item: GanttRowProps) => void;
};

export type GanttContainerProps = {
  data: GanttRowProps[];
  dependencies?: Array<{
    id: string;
    predecessor_task_id: string;
    successor_task_id: string;
    type: string;
  }>;
  onItemClick?: (item: GanttRowProps) => void;
  allTasks?: any[]; // Array de tareas para propagación de dependencias
  projectId?: string; // ID del proyecto
};

export interface ResolvedDateRange {
  startDate: Date;
  resolvedEndDate: Date;
  wasCalculated: boolean;
  isValid: boolean;
  durationInDays: number;
}

// Utility function to calculate resolved end date with proper validation
export function calculateResolvedEndDate(item: GanttRowProps): ResolvedDateRange {
  // Skip validation for groups without dates - but allow phases with dates to show bars
  if (item.type === 'group' || (!item.startDate && item.type !== 'phase')) {
    return {
      startDate: new Date(),
      resolvedEndDate: new Date(),
      wasCalculated: false,
      isValid: true,
      durationInDays: 1
    };
  }

  // For phases: try to calculate from contained tasks first
  if (item.type === 'phase' && item.phaseTasks && item.phaseTasks.length > 0) {
    // Calculate dates based on contained tasks
    const taskDates = item.phaseTasks
      .filter(task => task.start_date)
      .map(task => ({
        start: new Date(task.start_date + 'T00:00:00'),
        end: task.end_date ? new Date(task.end_date + 'T00:00:00') : 
             task.duration_in_days ? new Date(new Date(task.start_date + 'T00:00:00').getTime() + (task.duration_in_days - 1) * 24 * 60 * 60 * 1000) :
             new Date(task.start_date + 'T00:00:00')
      }));
    
    if (taskDates.length > 0) {
      const startDate = new Date(Math.min(...taskDates.map(d => d.start.getTime())));
      const resolvedEndDate = new Date(Math.max(...taskDates.map(d => d.end.getTime())));
      const durationInDays = Math.ceil((resolvedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 1000)) + 1;
      
      return {
        startDate,
        resolvedEndDate,
        wasCalculated: true,
        isValid: true,
        durationInDays
      };
    }
  }

  // For phases or headers without startDate, return invalid
  if (!item.startDate) {
    return {
      startDate: new Date(),
      resolvedEndDate: new Date(),
      wasCalculated: false,
      isValid: false,
      durationInDays: 1
    };
  }

  // Normalize startDate to avoid UTC interpretation issues
  const startDate = new Date(item.startDate + 'T00:00:00');
  
  // Validate that startDate is a valid date
  if (isNaN(startDate.getTime())) {
    console.warn(`Invalid start date for item ${item.id}: ${item.startDate}`);
    const today = new Date();
    return {
      startDate: today,
      resolvedEndDate: today,
      wasCalculated: false,
      isValid: false,
      durationInDays: 1
    };
  }
  
  // Calculate resolved end date with priority logic
  let resolvedEndDate: Date;
  let wasCalculated = false;
  
  if (item.endDate) {
    // Priority 1: Use endDate if provided and normalize
    resolvedEndDate = new Date(item.endDate + 'T00:00:00');
    if (isNaN(resolvedEndDate.getTime())) {
      // If endDate is invalid, fallback to startDate
      resolvedEndDate = new Date(startDate.getTime());
    }
  } else if (item.durationInDays && item.durationInDays > 0) {
    // Priority 2: Calculate from durationInDays using normalized date methods
    resolvedEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + item.durationInDays - 1);
    wasCalculated = true;
  } else {
    // Fallback: 1 day duration (same day start and end)
    resolvedEndDate = new Date(startDate.getTime());
  }
  
  // Validate dates - if start > end, use same day
  const isValid = startDate.getTime() <= resolvedEndDate.getTime();
  if (!isValid) {
    console.warn(`Invalid date range for item ${item.id}: startDate > endDate`);
    resolvedEndDate = new Date(startDate.getTime());
    wasCalculated = false;
  }
  
  // Calculate actual duration in days
  const actualDurationInDays = Math.ceil((resolvedEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  
  return {
    startDate,
    resolvedEndDate,
    wasCalculated,
    isValid,
    durationInDays: actualDurationInDays
  };
}