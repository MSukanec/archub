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
    case 'weeks': return 120; // Más ancho para mostrar días individuales
    case 'months': return 120;
    case 'quarters': return 200;
    default: return 120;
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

// Interfaz para columnas del timeline
export interface TimelineColumn {
  key: string;
  label: string;
  date: Date;
  isToday?: boolean;
}

// Genera columnas del timeline según el modo de visualización
export const getTimelineColumns = (start: string, end: string, mode: ViewMode): TimelineColumn[] => {
  const columns: TimelineColumn[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const today = new Date();
  
  switch (mode) {
    case 'weeks': {
      // En modo semanas, mostrar días individuales
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        columns.push({
          key: dateStr,
          label: currentDate.getDate().toString(),
          date: new Date(currentDate),
          isToday: currentDate.toDateString() === today.toDateString()
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;
    }
    
    case 'months': {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (currentDate <= endDate) {
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        columns.push({
          key: `month-${currentDate.getFullYear()}-${currentDate.getMonth()}`,
          label: currentDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
          date: new Date(currentDate),
          isToday: today.getFullYear() === currentDate.getFullYear() && 
                   today.getMonth() === currentDate.getMonth()
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
    }
    
    case 'quarters': {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const startQuarter = Math.floor(startDate.getMonth() / 3);
      
      for (let year = startYear; year <= endYear; year++) {
        const maxQuarter = year === endYear ? Math.floor(endDate.getMonth() / 3) : 3;
        const minQuarter = year === startYear ? startQuarter : 0;
        
        for (let quarter = minQuarter; quarter <= maxQuarter; quarter++) {
          const quarterStart = new Date(year, quarter * 3, 1);
          const quarterEnd = new Date(year, quarter * 3 + 3, 0);
          
          // Crear etiquetas con rangos de meses (ej: "Ene-Mar", "Abr-Jun")
          const quarterMonthRanges = [
            'Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'
          ];
          
          columns.push({
            key: `quarter-${year}-${quarter}`,
            label: `${quarterMonthRanges[quarter]} ${year}`,
            date: quarterStart,
            isToday: today >= quarterStart && today <= quarterEnd
          });
        }
      }
      break;
    }
  }
  
  return columns;
};

// Devuelve array de fechas entre dos fechas (mantenido para compatibilidad)
export const getDateArray = (start: string, end: string): string[] => {
  const columns = getTimelineColumns(start, end, 'weeks');
  return columns.map(col => col.key);
};

// Devuelve el día de la semana en formato corto
export const getWeekday = (date: string): string => {
  return new Date(date).toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase();
};

export const getBarPosition = (
  startDate: string, 
  endDate: string, 
  timelineStart: string,
  timelineEnd: string,
  mode: ViewMode
): { left: number; width: number } | null => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timelineStartDate = new Date(timelineStart);
  
  const columnWidth = getColumnWidth(mode);
  const columns = getTimelineColumns(timelineStart, timelineEnd, mode);
  
  // Find start and end column indices
  let startColumnIndex = -1;
  let endColumnIndex = -1;
  
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    
    // Check if start date falls in this column
    if (startColumnIndex === -1) {
      switch (mode) {
        case 'weeks':
          // En modo semanas, las columnas son días individuales
          if (column.date.toDateString() === start.toDateString()) {
            startColumnIndex = i;
          }
          break;
        case 'months':
          if (start.getFullYear() === column.date.getFullYear() && 
              start.getMonth() === column.date.getMonth()) {
            startColumnIndex = i;
          }
          break;
        case 'quarters':
          const quarter = Math.floor(column.date.getMonth() / 3);
          const startQuarter = Math.floor(start.getMonth() / 3);
          if (start.getFullYear() === column.date.getFullYear() && 
              startQuarter === quarter) {
            startColumnIndex = i;
          }
          break;
      }
    }
    
    // Check if end date falls in this column
    switch (mode) {
      case 'weeks':
        // En modo semanas, las columnas son días individuales
        if (column.date.toDateString() === end.toDateString()) {
          endColumnIndex = i;
        }
        break;
      case 'months':
        if (end.getFullYear() === column.date.getFullYear() && 
            end.getMonth() === column.date.getMonth()) {
          endColumnIndex = i;
        }
        break;
      case 'quarters':
        const quarter = Math.floor(column.date.getMonth() / 3);
        const endQuarter = Math.floor(end.getMonth() / 3);
        if (end.getFullYear() === column.date.getFullYear() && 
            endQuarter === quarter) {
          endColumnIndex = i;
        }
        break;
    }
  }
  
  if (startColumnIndex === -1) return null; // Task starts before timeline
  if (endColumnIndex === -1) endColumnIndex = columns.length - 1; // Task extends beyond timeline
  
  const width = Math.max((endColumnIndex - startColumnIndex + 1) * columnWidth, columnWidth);
  
  return {
    left: startColumnIndex * columnWidth,
    width: width
  };
};

export const formatDateForMode = (date: Date, mode: ViewMode): string => {
  switch (mode) {
    case 'weeks':
      return date.getDate().toString();
    case 'months':
      return date.toLocaleDateString('es-ES', { month: 'short' });
    case 'quarters':
      const quarter = Math.floor(date.getMonth() / 3);
      const quarterRanges = ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'];
      return quarterRanges[quarter];
    default:
      return date.getDate().toString();
  }
};

export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return today.toDateString() === date.toDateString();
};