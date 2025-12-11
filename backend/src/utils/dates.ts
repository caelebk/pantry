/**
 * Date utility functions
 */

/**
 * Converts a string or Date object to a Date object.
 * If the input is already a Date, it returns it.
 * If the input is a string, it creates a new Date from it.
 * @param value - The date string or Date object
 * @returns Date object
 */
export function toDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}
