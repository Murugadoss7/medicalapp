// Utility functions for doctor-related operations
import { store } from '../store';

/**
 * Get the current doctor's profile ID from the authenticated user
 * This handles the mapping between user ID and doctor profile ID
 */
export const getCurrentDoctorId = (): string => {
  const state = store.getState();
  const user = state.auth.user;

  if (!user || user.role !== 'doctor') {
    throw new Error('User is not a doctor or not logged in');
  }

  if (!user.doctor_id) {
    throw new Error('Doctor profile ID not found. Please contact support.');
  }

  return user.doctor_id;
};

/**
 * Check if the current user is a doctor and has a doctor profile
 */
export const isCurrentUserDoctor = (userRole?: string): boolean => {
  return userRole === 'doctor';
};