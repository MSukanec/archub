import { format } from 'date-fns'
import { es } from 'date-fns/locale'
/**
 * ============================================================================
 * CANONICAL DATE UTILITIES - USE THESE EVERYWHERE IN THE APP
 * ============================================================================
 * 
 * The Problem: JavaScript's `new Date("2025-11-27")` interprets date-only 
 * strings as UTC midnight, which then shifts backward when converted to 
 * local time. For example, in UTC-3 (Argentina), "2025-11-27" becomes 
 * "2025-11-26 21:00:00" local time - showing the WRONG day.
 * 
 * The Solution: Always use these functions:
 * - parseLocalDate(): When reading dates from database/API → Date object
 * - formatDateForDB(): When sending dates to database/API → string
 * - formatDate/formatDateShort/etc.: When displaying dates to users
 * ============================================================================
 */
/**
 * Parse a date string as LOCAL date without timezone shift.
 * ALWAYS use this when converting database date strings to Date objects.
 * 
 * @param input - Date to parse (Date object, string "YYYY-MM-DD", or ISO string)
 * @returns Date object in local timezone, or null if invalid
 * 
 * @example
 * // Database returns "2025-11-27"
 * const date = parseLocalDate("2025-11-27") // → Nov 27, 2025 00:00:00 LOCAL
 * 
 * // WRONG - Don't do this:
 * const date = new Date("2025-11-27") // → Nov 26, 2025 21:00:00 in UTC-3!
 */
export function parseLocalDate(input: Date | string | number | null | undefined): Date | null {
  if (!input) return null;
  
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  if (typeof input === 'string') {
    // Handle ISO format (2025-11-27T00:00:00.000Z) - extract date part only
    const datePart = input.split('T')[0];
    
    // Handle PostgreSQL/ISO date format "YYYY-MM-DD" as local date
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = datePart.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return isNaN(date.getTime()) ? null : date;
    }
  }
  
  // Fallback for other date formats (timestamps, etc.)
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}
/**
 * Format a Date object to YYYY-MM-DD string for database storage.
 * ALWAYS use this when sending dates to the backend/database.
 * Uses local date components to avoid timezone shift.
 * 
 * @param date - Date object to format
 * @returns String in "YYYY-MM-DD" format
 * 
 * @example
 * const date = new Date(2025, 10, 27) // Nov 27, 2025
 * formatDateForDB(date) // → "2025-11-27"
 */
export function formatDateForDB(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) {
    return format(new Date(), 'yyyy-MM-dd');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
/**
 * @deprecated Use parseLocalDate instead
 */
function parseToDate(input: Date | string | number): Date | null {
  return parseLocalDate(input);
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