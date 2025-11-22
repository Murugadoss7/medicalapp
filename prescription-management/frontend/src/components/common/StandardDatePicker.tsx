/**
 * Standardized Date Picker Component
 * Centralized date handling for all modules across the frontend
 */

import React from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import { format, parse, isValid, isFuture, isPast, subYears, addYears } from 'date-fns';

// Date validation constants
const MIN_BIRTH_YEAR = 1900;
const MAX_FUTURE_APPOINTMENT_DAYS = 365;
const MIN_APPOINTMENT_ADVANCE_HOURS = 1;

// Date type definitions
export type DateType = 'date_of_birth' | 'appointment_date' | 'prescription_date' | 'visit_date' | 'general';

export interface StandardDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  dateType?: DateType;
  allowPast?: boolean;
  allowFuture?: boolean;
  error?: boolean;
  helperText?: string;
  textFieldProps?: Partial<TextFieldProps>;
}

// Date validation functions
export const validateDateOfBirth = (date: Date | null): string | null => {
  if (!date || !isValid(date)) {
    return 'Invalid date';
  }
  
  if (isFuture(date)) {
    return 'Date of birth cannot be in the future';
  }
  
  if (date.getFullYear() < MIN_BIRTH_YEAR) {
    return `Date of birth cannot be before ${MIN_BIRTH_YEAR}`;
  }
  
  const age = new Date().getFullYear() - date.getFullYear();
  if (age > 150) {
    return 'Invalid date of birth (age cannot exceed 150 years)';
  }
  
  return null;
};

export const validateAppointmentDate = (date: Date | null, allowPast = false): string | null => {
  if (!date || !isValid(date)) {
    return 'Invalid date';
  }
  
  if (!allowPast && isPast(date) && !isToday(date)) {
    return 'Appointment date cannot be in the past';
  }
  
  const maxFutureDate = addYears(new Date(), 1);
  if (date > maxFutureDate) {
    return 'Appointment cannot be scheduled more than 1 year in advance';
  }
  
  return null;
};

export const validatePrescriptionDate = (date: Date | null, allowFuture = false): string | null => {
  if (!date || !isValid(date)) {
    return 'Invalid date';
  }
  
  if (!allowFuture && isFuture(date)) {
    return 'Prescription date cannot be in the future';
  }
  
  const minDate = subYears(new Date(), 5);
  if (date < minDate) {
    return 'Prescription date cannot be more than 5 years old';
  }
  
  return null;
};

export const validateVisitDate = (date: Date | null): string | null => {
  if (!date || !isValid(date)) {
    return 'Invalid date';
  }
  
  if (isFuture(date)) {
    return 'Visit date cannot be in the future';
  }
  
  return null;
};

// Utility functions
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getDateValidationFunction = (dateType: DateType) => {
  switch (dateType) {
    case 'date_of_birth':
      return validateDateOfBirth;
    case 'appointment_date':
      return (date: Date | null) => validateAppointmentDate(date, false);
    case 'prescription_date':
      return (date: Date | null) => validatePrescriptionDate(date, false);
    case 'visit_date':
      return validateVisitDate;
    default:
      return () => null;
  }
};

const getDateConstraints = (dateType: DateType) => {
  const today = new Date();
  
  switch (dateType) {
    case 'date_of_birth':
      return {
        maxDate: today,
        minDate: new Date(MIN_BIRTH_YEAR, 0, 1),
      };
    case 'appointment_date':
      return {
        minDate: today,
        maxDate: addYears(today, 1),
      };
    case 'prescription_date':
      return {
        minDate: subYears(today, 5),
        maxDate: today,
      };
    case 'visit_date':
      return {
        maxDate: today,
      };
    default:
      return {};
  }
};

export const formatDateForAPI = (date: Date | null): string | null => {
  if (!date || !isValid(date)) return null;
  return format(date, 'yyyy-MM-dd');
};

export const parseDateFromAPI = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  try {
    // Handle ISO format strings
    const cleanDateString = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const parsedDate = parse(cleanDateString, 'yyyy-MM-dd', new Date());
    
    return isValid(parsedDate) ? parsedDate : null;
  } catch {
    return null;
  }
};

export const calculateAge = (birthDate: Date | null, referenceDate: Date = new Date()): number => {
  if (!birthDate || !isValid(birthDate)) return 0;
  
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

const StandardDatePicker: React.FC<StandardDatePickerProps> = ({
  value,
  onChange,
  label = 'Select Date',
  required = false,
  disabled = false,
  dateType = 'general',
  allowPast,
  allowFuture,
  error: externalError = false,
  helperText: externalHelperText,
  textFieldProps = {},
}) => {
  // Get validation function for this date type
  const validateDate = getDateValidationFunction(dateType);
  const dateConstraints = getDateConstraints(dateType);
  
  // Validate current value
  const validationError = value ? validateDate(value) : null;
  const hasError = externalError || !!validationError;
  const displayHelperText = externalHelperText || validationError || '';
  
  const handleDateChange = (newDate: Date | null) => {
    onChange(newDate);
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
        label={label}
        value={value}
        onChange={handleDateChange}
        disabled={disabled}
        format="dd/MM/yyyy"
        minDate={dateConstraints.minDate}
        maxDate={dateConstraints.maxDate}
        slotProps={{
          textField: {
            required,
            error: hasError,
            helperText: displayHelperText,
            fullWidth: true,
            ...textFieldProps,
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default StandardDatePicker;