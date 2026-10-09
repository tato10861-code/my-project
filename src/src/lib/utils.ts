import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges conditional class names with Tailwind-aware conflict resolution.
 *
 * @param inputs - Any number of class values (strings, falsy values, or
 *   conditional tuples).
 * @returns A single deduplicated className string.
 * @complexity O(n) time where n is the total number of class tokens.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
