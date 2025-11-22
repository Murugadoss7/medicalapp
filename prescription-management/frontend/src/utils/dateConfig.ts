/**
 * Centralized Date Format Configuration
 * Following ISO 8601 standards for consistency across Frontend, Backend, and Database
 */

// Standard Date Formats - ISO 8601 compliant
export const DATE_FORMATS = {
  // Database and API standard formats
  DATE_ONLY: 'yyyy-MM-dd',                    // 2025-10-31
  TIME_ONLY: 'HH:mm:ss',                     // 14:30:00  
  DATETIME_ISO: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'', // 2025-10-31T14:30:00Z
  DATETIME_LOCAL: 'yyyy-MM-dd\'T\'HH:mm:ss',   // 2025-10-31T14:30:00
  
  // Display formats for UI
  DISPLAY_DATE: 'MMM dd, yyyy',              // Oct 31, 2025
  DISPLAY_TIME: 'HH:mm',                     // 14:30
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',    // Oct 31, 2025 14:30
  DISPLAY_DATETIME_FULL: 'MMM dd, yyyy \'at\' HH:mm', // Oct 31, 2025 at 14:30
  
  // Calendar and scheduling formats
  CALENDAR_MONTH: 'MMMM yyyy',               // October 2025
  CALENDAR_DAY: 'd',                         // 31
  APPOINTMENT_SLOT: 'HH:mm',                 // 14:30
  
  // Form input formats
  INPUT_DATE: 'yyyy-MM-dd',                  // HTML date input
  INPUT_DATETIME_LOCAL: 'yyyy-MM-dd\'T\'HH:mm', // HTML datetime-local input
} as const;

// Timezone configuration
export const TIMEZONE_CONFIG = {
  DEFAULT: 'UTC',
  LOCAL: Intl.DateTimeFormat().resolvedOptions().timeZone,
} as const;

// Date validation patterns
export const DATE_PATTERNS = {
  DATE_ONLY: /^\d{4}-\d{2}-\d{2}$/,
  TIME_ONLY: /^\d{2}:\d{2}:\d{2}$/,
  DATETIME_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  DATETIME_LOCAL: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
} as const;

// Standard field names for consistency
export const DATE_FIELD_NAMES = {
  APPOINTMENT_DATE: 'appointment_date',      // Date only
  APPOINTMENT_TIME: 'appointment_time',      // Time only  
  APPOINTMENT_DATETIME: 'appointment_datetime', // Full datetime
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const;

// Export types for TypeScript
export type DateFormat = typeof DATE_FORMATS[keyof typeof DATE_FORMATS];
export type DateFieldName = typeof DATE_FIELD_NAMES[keyof typeof DATE_FIELD_NAMES];