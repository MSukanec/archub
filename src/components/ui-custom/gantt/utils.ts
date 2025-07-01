import { ViewMode } from './store';

export interface Phase {
  id: string;
  design_phase_id: string;
  start_date: string | null;
  end_date: string | null;
  design_phases: {
    id: string;
    name: string;
  };
  tasks?: Task[];
}

export interface Task {
  id: string;
  project_phase_id: string;
  name: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  assigned_to?: string | null;
  status: string;
  priority: string;
  position: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export const getColumnWidth = (mode: ViewMode): number => {
  switch (mode) {
    case 'day': return 40;
    case 'week': return 100;
    case 'month': return 160;
    default: return 40;
  }
};

// Calcula el rango de días entre fecha mínima y máxima
export const getTimelineRange = (phases: Phase[]): { start: string; end: string } => {
  if (phases.length === 0) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7);
    const end = new Date(today);
    end.setDate(today.getDate() + 30);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  phases.forEach(phase => {
    // Check phase dates
    if (phase.start_date) {
      const phaseStart = new Date(phase.start_date);
      if (!minDate || phaseStart < minDate) minDate = phaseStart;
    }
    if (phase.end_date) {
      const phaseEnd = new Date(phase.end_date);
      if (!maxDate || phaseEnd > maxDate) maxDate = phaseEnd;
    }

    // Check task dates
    if (phase.tasks) {
      phase.tasks.forEach(task => {
        if (task.start_date) {
          const taskStart = new Date(task.start_date);
          if (!minDate || taskStart < minDate) minDate = taskStart;
        }
        if (task.end_date) {
          const taskEnd = new Date(task.end_date);
          if (!maxDate || taskEnd > maxDate) maxDate = taskEnd;
        }
      });
    }
  });

  // Fallback to reasonable defaults
  if (!minDate || !maxDate) {
    const today = new Date();
    minDate = minDate || new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    maxDate = maxDate || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Add some padding
  const paddedStart = new Date(minDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  const paddedEnd = new Date(maxDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    start: paddedStart.toISOString().split('T')[0],
    end: paddedEnd.toISOString().split('T')[0]
  };
};

// Devuelve array de fechas entre dos fechas
export const getDateArray = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Devuelve el día de la semana en formato corto
export const getWeekday = (date: string): string => {
  return new Date(date).toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase();
};

export const getBarPosition = (
  startDate: string, 
  endDate: string, 
  timelineStart: string,
  mode: ViewMode
): { left: number; width: number } | null => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timelineStartDate = new Date(timelineStart);
  
  const columnWidth = getColumnWidth(mode);
  
  // Calculate days from timeline start
  const startDayOffset = Math.floor((start.getTime() - timelineStartDate.getTime()) / (24 * 60 * 60 * 1000));
  const endDayOffset = Math.floor((end.getTime() - timelineStartDate.getTime()) / (24 * 60 * 60 * 1000));
  
  if (startDayOffset < 0) return null; // Task starts before timeline
  
  const duration = endDayOffset - startDayOffset + 1;
  
  return {
    left: startDayOffset * columnWidth,
    width: Math.max(duration * columnWidth, columnWidth) // Minimum 1 day width
  };
};

export const formatDateForMode = (date: Date, mode: ViewMode): string => {
  switch (mode) {
    case 'day':
      return date.getDate().toString();
    case 'week':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `S${Math.floor(date.getDate() / 7) + 1}`;
    case 'month':
      return date.toLocaleDateString('es-ES', { month: 'short' });
    default:
      return date.getDate().toString();
  }
};

export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return today.toDateString() === date.toDateString();
};