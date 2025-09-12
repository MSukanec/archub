import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Safely parses a date input, handling timezone issues with ISO date strings
 * @param input - Date to parse (Date object, string, or number)
 * @returns Date object or null if invalid
 */
function parseToDate(input: Date | string | number): Date | null {
  if (!input) return null;
  
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  if (typeof input === 'string') {
    // Handle PostgreSQL date format "YYYY-MM-DD" as local date to avoid timezone issues
    if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = input.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
      return isNaN(date.getTime()) ? null : date;
    }
  }
  
  // Fallback for other date formats
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date in a user-friendly format: "15 ago 2025"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = parseToDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'd MMM yyyy', { locale: es });
}

/**
 * Formats a date with day and month only: "15 ago"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string
 */
export function formatDateShort(date: Date | string | number): string {
  const dateObj = parseToDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'd MMM', { locale: es });
}

/**
 * Formats a date with abbreviated year: "15 ago 25"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string
 */
export function formatDateCompact(date: Date | string | number): string {
  const dateObj = parseToDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'd MMM yy', { locale: es });
}

/**
 * Formats time in HH:mm format: "14:30"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number): string {
  const dateObj = parseToDate(date);
  if (!dateObj) return '—';
  return format(dateObj, 'HH:mm', { locale: es });
}