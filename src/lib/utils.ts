import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a localized date and time
 */
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleString()
}

/**
 * Generate a random string of specified length
 */
export function generateId(length: number = 8) {
  return Math.random().toString(36).substring(2, length + 2)
}
