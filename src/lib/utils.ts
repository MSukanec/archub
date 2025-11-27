import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string (YYYY-MM-DD or ISO format) as a local date without timezone shift.
 * This prevents the common issue where "2025-11-27" is interpreted as UTC midnight
 * and then shifted back when converted to local time (causing it to show as Nov 26).
 */
export function parseLocalDate(dateString: string | null | undefined): Date {
  if (!dateString) return new Date();
  
  // Handle ISO format (2025-11-27T00:00:00.000Z) or simple date (2025-11-27)
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create date using local timezone constructor (months are 0-indexed)
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object to YYYY-MM-DD string for database storage.
 * Uses local date components to avoid timezone shift issues.
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
