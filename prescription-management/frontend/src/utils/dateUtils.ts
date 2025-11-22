/**
 * Date Utility Functions
 * Standardized date handling across the application
 */

import { format, parse, isValid, parseISO, formatISO } from 'date-fns';
import { DATE_FORMATS, DATE_PATTERNS, TIMEZONE_CONFIG } from './dateConfig';

/**
 * Parse date from various input formats
 */
export const parseDate = {
  /**
   * Parse ISO date string (2025-10-31T14:30:00Z)
   */
  fromISO: (isoString: string): Date | null => {
    try {
      const date = parseISO(isoString);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  },

  /**
   * Parse date-only string (2025-10-31)
   */
  fromDateString: (dateString: string): Date | null => {
    try {
      if (!DATE_PATTERNS.DATE_ONLY.test(dateString)) return null;
      const date = parse(dateString, DATE_FORMATS.DATE_ONLY, new Date());
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  },

  /**
   * Parse time-only string (14:30:00)
   */
  fromTimeString: (timeString: string, baseDate: Date = new Date()): Date | null => {
    try {
      if (!DATE_PATTERNS.TIME_ONLY.test(timeString)) return null;
      const date = parse(timeString, DATE_FORMATS.TIME_ONLY, baseDate);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  },

  /**
   * Parse appointment datetime from backend format
   */
  fromAppointmentDatetime: (datetimeString: string): Date | null => {
    // Try different formats that backend might send
    const formats = [
      DATE_FORMATS.DATETIME_ISO,
      DATE_FORMATS.DATETIME_LOCAL,
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'',
    ];

    for (const fmt of formats) {
      try {
        const date = fmt.includes('T') ? parseISO(datetimeString) : parse(datetimeString, fmt, new Date());
        if (isValid(date)) return date;
      } catch {
        continue;
      }
    }
    return null;
  },
};

/**
 * Format dates for different purposes
 */
export const formatDate = {
  /**
   * Format for API requests (ISO format)
   */
  forAPI: {
    dateOnly: (date: Date): string => format(date, DATE_FORMATS.DATE_ONLY),
    timeOnly: (date: Date): string => format(date, DATE_FORMATS.TIME_ONLY),
    datetime: (date: Date): string => formatISO(date),
    datetimeLocal: (date: Date): string => format(date, DATE_FORMATS.DATETIME_LOCAL),
  },

  /**
   * Format for display in UI
   */
  forDisplay: {
    date: (date: Date): string => format(date, DATE_FORMATS.DISPLAY_DATE),
    time: (date: Date): string => format(date, DATE_FORMATS.DISPLAY_TIME),
    datetime: (date: Date): string => format(date, DATE_FORMATS.DISPLAY_DATETIME),
    datetimeFull: (date: Date): string => format(date, DATE_FORMATS.DISPLAY_DATETIME_FULL),
  },

  /**
   * Format for calendar components
   */
  forCalendar: {
    month: (date: Date): string => format(date, DATE_FORMATS.CALENDAR_MONTH),
    day: (date: Date): string => format(date, DATE_FORMATS.CALENDAR_DAY),
    appointmentSlot: (date: Date): string => format(date, DATE_FORMATS.APPOINTMENT_SLOT),
  },

  /**
   * Format for form inputs
   */
  forInput: {
    date: (date: Date): string => format(date, DATE_FORMATS.INPUT_DATE),
    datetimeLocal: (date: Date): string => format(date, DATE_FORMATS.INPUT_DATETIME_LOCAL),
  },
};

/**
 * Safe date formatting with fallbacks
 */
export const safeFormatDate = (
  dateInput: string | Date | null | undefined,
  formatter: (date: Date) => string,
  fallback: string = 'Invalid Date'
): string => {
  if (!dateInput) return fallback;
  
  let date: Date | null;
  
  if (typeof dateInput === 'string') {
    date = parseDate.fromAppointmentDatetime(dateInput) || parseDate.fromISO(dateInput);
  } else {
    date = isValid(dateInput) ? dateInput : null;
  }
  
  if (!date) return fallback;
  
  try {
    return formatter(date);
  } catch {
    return fallback;
  }
};

/**
 * Appointment-specific date utilities
 */
export const appointmentDate = {
  /**
   * Format appointment datetime for display
   */
  displayDateTime: (datetimeString: string): string => {
    return safeFormatDate(datetimeString, formatDate.forDisplay.datetime, 'Date not available');
  },

  /**
   * Format appointment date only
   */
  displayDate: (datetimeString: string): string => {
    return safeFormatDate(datetimeString, formatDate.forDisplay.date, 'Date not available');
  },

  /**
   * Format appointment time only
   */
  displayTime: (datetimeString: string): string => {
    return safeFormatDate(datetimeString, formatDate.forDisplay.time, 'Time not available');
  },

  /**
   * Get calendar key for grouping appointments by date
   */
  getCalendarKey: (datetimeString: string): string => {
    return safeFormatDate(datetimeString, formatDate.forAPI.dateOnly, '');
  },

  /**
   * Check if appointment is today
   */
  isToday: (datetimeString: string): boolean => {
    const appointmentDate = parseDate.fromAppointmentDatetime(datetimeString);
    if (!appointmentDate) return false;
    
    const today = new Date();
    return formatDate.forAPI.dateOnly(appointmentDate) === formatDate.forAPI.dateOnly(today);
  },

  /**
   * Create appointment datetime from separate date and time
   */
  combine: (dateString: string, timeString: string): string => {
    const date = parseDate.fromDateString(dateString);
    if (!date) return '';
    
    const time = parseDate.fromTimeString(timeString, date);
    if (!time) return '';
    
    return formatDate.forAPI.datetime(time);
  },
};

/**
 * Validation utilities
 */
export const validateDate = {
  /**
   * Check if string is valid date format
   */
  isValidDateString: (dateString: string): boolean => {
    return DATE_PATTERNS.DATE_ONLY.test(dateString) && !!parseDate.fromDateString(dateString);
  },

  /**
   * Check if string is valid time format
   */
  isValidTimeString: (timeString: string): boolean => {
    return DATE_PATTERNS.TIME_ONLY.test(timeString) && !!parseDate.fromTimeString(timeString);
  },

  /**
   * Check if string is valid datetime format
   */
  isValidDateTimeString: (datetimeString: string): boolean => {
    return !!parseDate.fromAppointmentDatetime(datetimeString);
  },
};

// Export commonly used combinations
export const commonDateFormats = {
  // Current date/time in standard formats
  now: {
    iso: () => formatDate.forAPI.datetime(new Date()),
    dateOnly: () => formatDate.forAPI.dateOnly(new Date()),
    timeOnly: () => formatDate.forAPI.timeOnly(new Date()),
    display: () => formatDate.forDisplay.datetime(new Date()),
  },
  
  // Today's date in various formats
  today: {
    iso: () => formatDate.forAPI.dateOnly(new Date()),
    display: () => formatDate.forDisplay.date(new Date()),
    input: () => formatDate.forInput.date(new Date()),
  },
};