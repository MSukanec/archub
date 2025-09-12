import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formats a date in a user-friendly format: "15 ago 2025"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
  try {
    const dateObj = new Date(date)
    return format(dateObj, 'd MMM yyyy', { locale: es })
  } catch (error) {
    return 'Fecha inválida'
  }
}

/**
 * Formats a date with day and month only: "15 ago"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string
 */
export function formatDateShort(date: Date | string | number): string {
  try {
    const dateObj = new Date(date)
    return format(dateObj, 'd MMM', { locale: es })
  } catch (error) {
    return 'Fecha inválida'
  }
}

/**
 * Formats a date with abbreviated year: "15 ago 25"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted date string
 */
export function formatDateCompact(date: Date | string | number): string {
  try {
    const dateObj = new Date(date)
    return format(dateObj, 'd MMM yy', { locale: es })
  } catch (error) {
    return 'Fecha inválida'
  }
}

/**
 * Formats time in HH:mm format: "14:30"
 * @param date - Date to format (Date object, string, or number)
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number): string {
  try {
    const dateObj = new Date(date)
    return format(dateObj, 'HH:mm', { locale: es })
  } catch (error) {
    return '--:--'
  }
}