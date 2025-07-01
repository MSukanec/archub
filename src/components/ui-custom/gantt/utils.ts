import { ViewMode } from './store';

export const getColumnWidth = (mode: ViewMode): number => {
  switch (mode) {
    case 'day': return 40;
    case 'week': return 100;
    case 'month': return 160;
    default: return 40;
  }
};

export const getDayOffset = (startDate: string): number => {
  const date = new Date(startDate);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Check if date is in current month/year
  if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
    return -1; // Invalid offset
  }
  
  return date.getDate() - 1; // 0-based day offset
};

export const getBarPosition = (
  startDate: string, 
  endDate: string, 
  mode: ViewMode
): { left: number; width: number } | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Check if dates are in current month/year
  if (start.getMonth() !== currentMonth || start.getFullYear() !== currentYear) {
    return null;
  }
  
  const columnWidth = getColumnWidth(mode);
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  let left: number;
  let width: number;
  
  switch (mode) {
    case 'day':
      left = (startDay - 1) * columnWidth;
      width = (endDay - startDay + 1) * columnWidth;
      break;
    case 'week':
      // For week view, group days into weeks
      const startWeek = Math.floor((startDay - 1) / 7);
      const endWeek = Math.floor((endDay - 1) / 7);
      left = startWeek * columnWidth;
      width = (endWeek - startWeek + 1) * columnWidth;
      break;
    case 'month':
      // For month view, show entire month
      left = 0;
      width = columnWidth;
      break;
    default:
      left = (startDay - 1) * columnWidth;
      width = (endDay - startDay + 1) * columnWidth;
  }
  
  return { left, width };
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