/**
 * Dental API Service
 * Handles all API calls for dental observations and procedures
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Types
export interface DentalObservation {
  id: string;
  prescription_id?: string;
  appointment_id?: string;
  patient_mobile_number: string;
  patient_first_name: string;
  tooth_number: string;
  tooth_surface?: string;
  condition_type: string;
  severity?: string;
  observation_notes?: string;
  treatment_required: boolean;
  treatment_done: boolean;
  treatment_date?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Template support
  selected_template_ids?: string;  // Comma-separated UUIDs stored in DB
  custom_notes?: string;
}

export interface DentalProcedure {
  id: string;
  observation_id?: string;
  prescription_id?: string;
  appointment_id?: string;
  procedure_code: string;
  procedure_name: string;
  tooth_numbers?: string;
  description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  duration_minutes?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  procedure_date?: string;
  completed_date?: string;
  procedure_notes?: string;
  complications?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ToothStatus {
  tooth_number: string;
  observations: DentalObservation[];
  procedures: DentalProcedure[];
  has_active_issues: boolean;
  last_treatment_date?: string;
}

export interface DentalChart {
  patient_mobile_number: string;
  patient_first_name: string;
  dentition_type: 'permanent' | 'primary' | 'mixed';
  teeth: ToothStatus[];
  total_observations: number;
  total_procedures: number;
  active_treatments: number;
}

export interface DentalStatistics {
  total_observations: number;
  total_procedures: number;
  observations_by_condition: Record<string, number>;
  procedures_by_status: Record<string, number>;
  most_affected_teeth: Array<{ tooth_number: string; count: number }>;
  treatment_completion_rate: number;
}

export interface CreateObservationData {
  prescription_id?: string;
  appointment_id?: string;
  patient_mobile_number: string;
  patient_first_name: string;
  tooth_number: string;
  tooth_surface?: string;
  condition_type: string;
  severity?: string;
  observation_notes?: string;
  treatment_required: boolean;
  treatment_done?: boolean;
  treatment_date?: string;
  // Template support
  selected_template_ids?: string[];
  custom_notes?: string;
}

export interface UpdateObservationData {
  tooth_surface?: string;
  condition_type?: string;
  severity?: string;
  observation_notes?: string;
  treatment_required?: boolean;
  treatment_done?: boolean;
  treatment_date?: string;
  // Template support
  selected_template_ids?: string[];
  custom_notes?: string;
}

export interface CreateProcedureData {
  observation_id?: string;
  prescription_id?: string;
  appointment_id?: string;
  procedure_code: string;
  procedure_name: string;
  tooth_numbers?: string;
  description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  duration_minutes?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  procedure_date?: string;
  completed_date?: string;
  procedure_notes?: string;
  complications?: string;
}

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

// ==================== Observation API ====================

export const dentalObservationAPI = {
  // Create observation
  create: async (data: CreateObservationData): Promise<DentalObservation> => {
    const response = await axiosInstance.post('/dental/observations', data);
    return response.data;
  },

  // Get observation by ID
  getById: async (id: string): Promise<DentalObservation> => {
    const response = await axiosInstance.get(`/dental/observations/${id}`);
    return response.data;
  },

  // Update observation
  update: async (id: string, data: UpdateObservationData): Promise<DentalObservation> => {
    const response = await axiosInstance.put(`/dental/observations/${id}`, data);
    return response.data;
  },

  // Delete observation
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/dental/observations/${id}`);
  },

  // Get patient observations
  getPatientObservations: async (
    mobileNumber: string,
    firstName: string,
    toothNumber?: string,
    limit?: number
  ): Promise<{ observations: DentalObservation[]; total: number }> => {
    const params = new URLSearchParams();
    if (toothNumber) params.append('tooth_number', toothNumber);
    if (limit) params.append('limit', limit.toString());

    const response = await axiosInstance.get(
      `/dental/observations/patient/${mobileNumber}/${firstName}?${params.toString()}`
    );
    return response.data;
  },

  // Get observations by prescription
  getByPrescription: async (prescriptionId: string): Promise<{ observations: DentalObservation[]; total: number }> => {
    const response = await axiosInstance.get(`/dental/observations/prescription/${prescriptionId}`);
    return response.data;
  },

  // Get observations by appointment
  getByAppointment: async (appointmentId: string, config?: { signal?: AbortSignal }): Promise<{ observations: DentalObservation[]; total: number }> => {
    const response = await axiosInstance.get(`/dental/observations/appointment/${appointmentId}`, config);
    return response.data;
  },

  // Get tooth history
  getToothHistory: async (
    mobileNumber: string,
    firstName: string,
    toothNumber: string
  ): Promise<{ observations: DentalObservation[]; total: number }> => {
    const response = await axiosInstance.get(
      `/dental/observations/tooth/${mobileNumber}/${firstName}/${toothNumber}`
    );
    return response.data;
  },

  // Bulk create observations
  bulkCreate: async (observations: CreateObservationData[]): Promise<DentalObservation[]> => {
    const response = await axiosInstance.post('/dental/observations/bulk', { observations });
    return response.data;
  },
};

// ==================== Procedure API ====================

export const dentalProcedureAPI = {
  // Create procedure
  create: async (data: CreateProcedureData): Promise<DentalProcedure> => {
    const response = await axiosInstance.post('/dental/procedures', data);
    return response.data;
  },

  // Get procedure by ID
  getById: async (id: string): Promise<DentalProcedure> => {
    const response = await axiosInstance.get(`/dental/procedures/${id}`);
    return response.data;
  },

  // Update procedure
  update: async (id: string, data: Partial<CreateProcedureData>): Promise<DentalProcedure> => {
    const response = await axiosInstance.put(`/dental/procedures/${id}`, data);
    return response.data;
  },

  // Delete procedure
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/dental/procedures/${id}`);
  },

  // Update procedure status
  updateStatus: async (id: string, status: string, notes?: string): Promise<DentalProcedure> => {
    const response = await axiosInstance.put(`/dental/procedures/${id}/status`, { status, notes });
    return response.data;
  },

  // Get procedures by observation
  getByObservation: async (observationId: string): Promise<{ procedures: DentalProcedure[]; total: number }> => {
    const response = await axiosInstance.get(`/dental/procedures/observation/${observationId}`);
    return response.data;
  },

  // Get procedures by prescription
  getByPrescription: async (prescriptionId: string): Promise<{ procedures: DentalProcedure[]; total: number }> => {
    const response = await axiosInstance.get(`/dental/procedures/prescription/${prescriptionId}`);
    return response.data;
  },

  // Get procedures by appointment
  getByAppointment: async (appointmentId: string, config?: { signal?: AbortSignal }): Promise<{ procedures: DentalProcedure[]; total: number }> => {
    const response = await axiosInstance.get(`/dental/procedures/appointment/${appointmentId}`, config);
    return response.data;
  },

  // Bulk create procedures
  bulkCreate: async (procedures: CreateProcedureData[]): Promise<DentalProcedure[]> => {
    const response = await axiosInstance.post('/dental/procedures/bulk', { procedures });
    return response.data;
  },

  // Get patient procedures (for case study)
  getPatientProcedures: async (mobile: string, firstName: string): Promise<any> => {
    const response = await axiosInstance.get(`/treatments/patients/${mobile}/${firstName}/procedures`);
    return response.data;
  },
};

// ==================== Chart & Statistics API ====================

export const dentalChartAPI = {
  // Get dental chart
  getChart: async (mobileNumber: string, firstName: string): Promise<DentalChart> => {
    const response = await axiosInstance.get(`/dental/chart/${mobileNumber}/${firstName}`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (mobileNumber?: string, firstName?: string): Promise<DentalStatistics> => {
    const params = new URLSearchParams();
    if (mobileNumber) params.append('mobile_number', mobileNumber);
    if (firstName) params.append('first_name', firstName);

    const response = await axiosInstance.get(`/dental/statistics?${params.toString()}`);
    return response.data;
  },

  // Search observations
  searchObservations: async (searchParams: {
    patient_mobile_number?: string;
    patient_first_name?: string;
    tooth_number?: string;
    condition_type?: string;
    treatment_required?: boolean;
    treatment_done?: boolean;
    from_date?: string;
    to_date?: string;
  }): Promise<{ observations: DentalObservation[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await axiosInstance.get(`/dental/search?${params.toString()}`);
    return response.data;
  },
};

// Dental Attachments API
const dentalAttachmentAPI = {
  /**
   * Get all attachments for an observation
   */
  getObservationAttachments: async (observationId: string) => {
    const response = await axiosInstance.get(`/dental/observations/${observationId}/attachments`);
    return response.data;
  },

  /**
   * Upload attachment for an observation
   */
  uploadObservationAttachment: async (observationId: string, formData: FormData) => {
    const response = await axiosInstance.post(`/dental/observations/${observationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete an attachment
   */
  deleteAttachment: async (attachmentId: string) => {
    const response = await axiosInstance.delete(`/dental/attachments/${attachmentId}`);
    return response.data;
  },

  /**
   * Get all attachments for a patient
   */
  getPatientAttachments: async (mobile: string, firstName: string, fileType?: string) => {
    const params = new URLSearchParams();
    if (fileType) params.append('file_type', fileType);

    const response = await axiosInstance.get(
      `/dental/patients/${mobile}/${firstName}/attachments?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Upload attachment for a procedure
   */
  uploadProcedureAttachment: async (procedureId: string, formData: FormData) => {
    const response = await axiosInstance.post(`/dental/procedures/${procedureId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Export all APIs
export const dentalService = {
  observations: dentalObservationAPI,
  procedures: dentalProcedureAPI,
  chart: dentalChartAPI,
  attachments: dentalAttachmentAPI,
  // Backward compatibility - expose attachment methods directly
  getObservationAttachments: dentalAttachmentAPI.getObservationAttachments,
  uploadObservationAttachment: dentalAttachmentAPI.uploadObservationAttachment,
  deleteAttachment: dentalAttachmentAPI.deleteAttachment,
};

export default dentalService;
