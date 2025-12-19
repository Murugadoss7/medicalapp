/**
 * Treatment Dashboard Service
 * API calls for treatment dashboard features
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Axios instance with auth
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PatientSummary {
  patient: {
    mobile_number: string;
    first_name: string;
    last_name: string;
    uuid: string;
    age: number;
    gender: string;
    email?: string;
  };
  summary: {
    last_consultation_date: string | null;
    primary_doctor: {
      id: string;
      name: string;
      specialization: string;
    } | null;
    total_appointments: number;
    completed_appointments: number;
    scheduled_appointments: number;
    pending_procedures: number;
    completed_procedures: number;
    total_procedures: number;
    active_prescriptions: number;
    treatment_status: 'active' | 'completed' | 'planned';
  };
}

export interface TimelineEvent {
  date: string;
  time: string | null;
  type: 'appointment' | 'prescription' | 'observation' | 'procedure';
  event: {
    id: string;
    title: string;
    doctor?: string;
    description?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface ProcedureGroup {
  upcoming: Array<{
    id: string;
    procedure_name: string;
    procedure_code: string;
    tooth_numbers: string;
    description: string | null;
    status: string;
    procedure_date: string | null;
    estimated_cost: number | null;
    duration_minutes: number | null;
  }>;
  completed: Array<any>;
  cancelled: Array<any>;
}

export interface PatientListParams {
  doctor_id?: string;
  status?: 'active' | 'completed' | 'planned';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

/**
 * Get list of patients with treatment summary
 */
export const fetchPatients = async (params: PatientListParams = {}) => {
  const response = await axiosInstance.get('/treatments/patients', { params });
  return response.data;
};

/**
 * Get patient treatment timeline
 */
export const fetchPatientTimeline = async (
  mobile: string,
  firstName: string
) => {
  const response = await axiosInstance.get(
    `/treatments/patients/${mobile}/${firstName}/timeline`
  );
  return response.data;
};

/**
 * Get patient procedures grouped by status
 */
export const fetchPatientProcedures = async (
  mobile: string,
  firstName: string
) => {
  const response = await axiosInstance.get(
    `/treatments/patients/${mobile}/${firstName}/procedures`
  );
  return response.data;
};

const treatmentService = {
  fetchPatients,
  fetchPatientTimeline,
  fetchPatientProcedures,
};

export default treatmentService;
