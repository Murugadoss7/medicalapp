import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

// Types
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  user: User;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'doctor' | 'admin' | 'patient' | 'nurse' | 'receptionist';
  phone: string;
  is_active: boolean;
  profile_picture_url?: string;
  specialization?: string;
  doctor_id?: string; // Doctor ID from doctors table (for doctor role only)
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'doctor' | 'admin' | 'patient' | 'nurse' | 'receptionist';
  license_number?: string; // Required for doctor role
  specialization?: string; // Optional for doctor role
}

// Doctor Dashboard Types
export interface DoctorStatistics {
  total_patients: number;
  total_appointments: number;
  total_prescriptions: number;
  appointments_today: number;
  prescriptions_today: number;
  upcoming_appointments: number;
  completed_appointments_today: number;
  pending_appointments_today: number;
}

export interface Appointment {
  id: string;
  appointment_number: string;
  doctor_id: string;
  patient_mobile_number: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_full_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_datetime: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reason_for_visit: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionItem {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  medicine_generic_name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  unit_price: number;
  sequence_order: number;
  created_at?: string;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  doctor_id: string;
  patient_mobile_number: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_full_name: string;
  appointment_id?: string;
  chief_complaint: string;
  symptoms?: string;
  clinical_notes: string;
  diagnosis: string;
  doctor_instructions?: string;
  total_amount: number;
  status: 'draft' | 'finalized' | 'dispensed' | 'completed';
  items?: PrescriptionItem[];
  created_at: string;
  updated_at: string;
}

export interface DoctorDashboardData {
  statistics: DoctorStatistics;
  today_appointments: Appointment[];
  recent_prescriptions: Prescription[];
  upcoming_appointments: Appointment[];
}

export interface AppointmentDetails extends Appointment {
  patient_details: {
    mobile_number: string;
    first_name: string;
    age?: number;
    gender?: string;
    address?: string;
  };
  doctor_details: {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
  };
  notes?: string;
  prescription_id?: string;
}

export interface AppointmentFilters {
  date?: string;
  status?: string;
  patient_name?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
}

export interface AppointmentAvailability {
  date: string;
  available_slots: TimeSlot[];
  booked_slots: string[];
  break_slots: string[];
}

// Consultation and Prescription interfaces
export interface PatientDetails {
  mobile_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalHistory {
  id: string;
  prescription_id: string;
  prescription_number: string;
  visit_date: string;
  doctor_name: string;
  chief_complaint: string;
  diagnosis: string;
  symptoms?: string;
  clinical_notes?: string;
  doctor_instructions?: string;
  status: 'draft' | 'finalized' | 'dispensed' | 'completed';
  total_amount: number;
  created_at: string;
}

export interface PrescriptionForm {
  patient_mobile_number: string;
  patient_first_name: string;
  patient_uuid?: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  symptoms?: string;
  clinical_notes?: string;
  doctor_instructions?: string;
  items: PrescriptionItemForm[];
}

export interface PrescriptionItemForm {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  unit_price: number;
  sequence_order: number;
  medicine_name?: string; // Store name for display
  medicine_generic_name?: string; // Store generic name for display
}

export interface ConsultationForm {
  appointment_id: string;
  chief_complaint: string;
  symptoms?: string;
  diagnosis: string;
  clinical_notes?: string;
  doctor_instructions?: string;
  prescription_data?: PrescriptionForm;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  composition?: string;
  manufacturer?: string;
  drug_category?: string;
  dosage_forms?: string[];
  strength?: string;
  price?: number;
  requires_prescription: boolean;
  atc_code?: string;
  storage_conditions?: string;
  contraindications?: string;
  side_effects?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  display_name?: string;
  full_description?: string;
  is_over_the_counter?: boolean;
  price_formatted?: string;
}

export interface ShortKeyMedicine {
  id: string;
  medicine_id: string;
  default_dosage: string;
  default_frequency: string;
  default_duration: string;
  default_instructions?: string;
  sequence_order: number;
  medicine?: Medicine;
}

export interface ShortKey {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_by: string;
  is_global: boolean;
  usage_count: number;
  is_active: boolean;
  medicines: ShortKeyMedicine[];
  medicine_count: number;
}

export interface Doctor {
  id: string;
  user_id: string;
  license_number: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  clinic_address?: string;
  phone?: string;
  consultation_fee?: string;
  consultation_duration?: number;
  availability_schedule?: Record<string, Array<{ start_time: string; end_time: string }>>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // User information
  user_email?: string;
  first_name?: string;
  last_name?: string;
  user_role?: string;
  // Computed fields
  full_name?: string;
  specializations_list?: string[];
  experience_range?: string;
}

export interface DoctorCreate {
  user_id: string;
  license_number: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  clinic_address?: string;
  phone?: string;
  consultation_fee?: string;
  consultation_duration?: number;
  availability_schedule?: Record<string, Array<{ start_time: string; end_time: string }>>;
}

export interface DoctorUpdate {
  license_number?: string;
  specialization?: string;
  qualification?: string;
  experience_years?: number;
  clinic_address?: string;
  phone?: string;
  consultation_fee?: string;
  consultation_duration?: number;
  availability_schedule?: Record<string, Array<{ start_time: string; end_time: string }>>;
  is_active?: boolean;
}

export interface DoctorListResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DoctorSearchParams {
  query?: string;           // Search by name or license
  specialization?: string;  // Filter by specialization
  min_experience?: number; // Minimum experience years
  is_active?: boolean;     // Filter by active status  
  page?: number;           // Page number
  per_page?: number;       // Items per page
}

export interface DoctorScheduleUpdate {
  availability_schedule: Record<string, Array<{ start_time: string; end_time: string }>>;
}

export interface DoctorScheduleResponse {
  doctor_id: string;
  full_name: string;
  availability_schedule: Record<string, Array<{ start_time: string; end_time: string }>>;
  consultation_duration: number;
}

export interface DoctorStats {
  total_doctors: number;
  active_doctors: number;
  specialization_counts: Record<string, number>;
  experience_distribution: Record<string, number>;
}

export interface PatientCreate {
  mobile_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  address?: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  primary_member: boolean;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface Patient {
  id: string;
  mobile_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email?: string;
  address?: string;
  relationship_to_primary: string;
  primary_contact_mobile?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed fields from backend
  is_family_member?: boolean;
}

export interface FamilyMember {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  notes?: string;
}


export interface FamilyExistsResponse {
  exists: boolean;
  mobile_number: string;
  primary_member?: Patient;
  total_members: number;
  family_members: Patient[];
}

export interface FamilyResponse {
  family_mobile: string;
  primary_member: Patient;
  family_members: Patient[];
  total_members: number;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PatientSearchParams {
  mobile_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
  relationship?: string;
  is_active?: boolean;
  age_min?: number;
  age_max?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface AppointmentCreateRequest {
  patient_mobile_number: string;
  patient_first_name: string;
  patient_uuid: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  reason_for_visit: string;
  contact_number?: string;
  notes?: string;
}

export interface AppointmentConflictRequest {
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  exclude_appointment_id?: string;
}

export interface AppointmentConflictResponse {
  has_conflict: boolean;
  available: boolean;
  conflicting_appointments?: Array<{
    appointment_number: string;
    time: string;
    patient_name: string;
  }>;
  suggested_times?: string[];
}

// API slice
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      // Try to get token from Redux state first
      let token = (getState() as RootState).auth.tokens?.access_token;

      // If not in Redux, try localStorage as fallback
      if (!token) {
        token = localStorage.getItem('access_token');
      }

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['User', 'Doctor', 'Patient', 'Medicine', 'ShortKey', 'Appointment', 'Prescription'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    register: builder.mutation<User, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      // Don't invalidate User tag - we're creating a NEW user, not updating current user
      // invalidatesTags: ['User'],
    }),
    
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    
    refreshToken: builder.mutation<{ access_token: string; token_type: string }, { refresh_token: string }>({
      query: (tokenData) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: tokenData,
      }),
    }),

    // Doctor Dashboard endpoints
    getDoctorStatistics: builder.query<DoctorStatistics, void>({
      query: () => '/doctors/statistics/overview',
      providesTags: ['Doctor'],
    }),

    getDoctorProfile: builder.query<Doctor, string>({
      query: (userId) => `/doctors/profile/user/${userId}`,
      providesTags: ['Doctor'],
    }),

    getDoctorTodayAppointments: builder.query<Appointment[], string>({
      query: (doctorId) => ({
        url: `/appointments/doctor/${doctorId}`,
        params: {
          appointment_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
          status: 'scheduled',
        },
      }),
      providesTags: ['Appointment'],
    }),

    getDoctorDailySchedule: builder.query<Appointment[], { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => `/appointments/schedule/${doctorId}/${date}`,
      providesTags: ['Appointment'],
    }),

    getDoctorRecentPrescriptions: builder.query<Prescription[], { doctorId: string; limit?: number }>({
      query: ({ doctorId, limit = 5 }) => ({
        url: `/prescriptions/doctor/${doctorId}`,
        params: { limit },
      }),
      providesTags: ['Prescription'],
    }),

    getDoctorUpcomingAppointments: builder.query<Appointment[], { doctorId: string; limit?: number }>({
      query: ({ doctorId, limit = 10 }) => ({
        url: `/appointments/doctor/${doctorId}`,
        params: {
          status: 'scheduled',
          upcoming: true,
          limit,
        },
      }),
      providesTags: ['Appointment'],
    }),

    // Appointment Management endpoints
    getDoctorAppointments: builder.query<{ appointments: Appointment[]; total: number }, { doctorId: string } & AppointmentFilters>({
      query: ({ doctorId, ...filters }) => ({
        url: `/appointments/doctor/${doctorId}`,
        params: filters,
      }),
      providesTags: ['Appointment'],
    }),

    getAppointmentsByDate: builder.query<Appointment[], { doctorId: string; startDate: string; endDate: string }>({
      query: ({ doctorId, startDate, endDate }) => ({
        url: `/appointments/doctor/${doctorId}`,
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      }),
      providesTags: ['Appointment'],
    }),

    getAppointmentDetails: builder.query<AppointmentDetails, string>({
      query: (appointmentId) => `/appointments/${appointmentId}`,
      providesTags: ['Appointment'],
    }),

    getAppointmentAvailability: builder.query<AppointmentAvailability, { doctorId: string; date: string }>({
      query: ({ doctorId, date }) => `/appointments/availability/${doctorId}/${date}`,
      providesTags: ['Appointment'],
    }),

    updateAppointmentStatus: builder.mutation<Appointment, { appointmentId: string; status: string; notes?: string }>({
      query: ({ appointmentId, ...updates }) => ({
        url: `/appointments/${appointmentId}/status`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Appointment'],
    }),

    rescheduleAppointment: builder.mutation<Appointment, { appointmentId: string; appointment_date: string; appointment_time: string }>({
      query: ({ appointmentId, ...scheduleData }) => ({
        url: `/appointments/${appointmentId}/reschedule`,
        method: 'POST',
        body: scheduleData,
      }),
      invalidatesTags: ['Appointment'],
    }),

    cancelAppointment: builder.mutation<{ message: string }, { appointmentId: string; reason?: string }>({
      query: ({ appointmentId, reason }) => ({
        url: `/appointments/${appointmentId}`,
        method: 'DELETE',
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: ['Appointment'],
    }),

    createAppointment: builder.mutation<Appointment, AppointmentCreateRequest>({
      query: (appointmentData) => ({
        url: '/appointments/',
        method: 'POST',
        body: appointmentData,
      }),
      invalidatesTags: ['Appointment'],
    }),

    checkAppointmentConflict: builder.mutation<AppointmentConflictResponse, AppointmentConflictRequest>({
      query: (conflictData) => ({
        url: '/appointments/conflicts/check',
        method: 'POST',
        body: conflictData,
      }),
    }),

    // Consultation and Prescription endpoints
    getPatientByAppointment: builder.query<PatientDetails, string>({
      query: (appointmentId) => `/appointments/${appointmentId}/patient`,
      providesTags: ['Patient'],
    }),

    getPatientMedicalHistory: builder.query<MedicalHistory[], { patientMobile: string; patientName: string; limit?: number }>({
      query: ({ patientMobile, patientName, limit = 10 }) => ({
        url: `/prescriptions/patient/${patientMobile}/${patientName}`,
        params: { limit },
      }),
      providesTags: ['Prescription'],
    }),

    createPrescription: builder.mutation<Prescription, PrescriptionForm>({
      query: (prescriptionData) => ({
        url: '/prescriptions/',
        method: 'POST',
        body: prescriptionData,
      }),
      invalidatesTags: ['Prescription', 'Appointment'],
    }),

    getPrescription: builder.query<Prescription, string>({
      query: (prescriptionId) => `/prescriptions/${prescriptionId}`,
      providesTags: (result, error, prescriptionId) => [
        { type: 'Prescription', id: prescriptionId },
        'Prescription',
      ],
    }),

    // Get prescriptions for an appointment
    getAppointmentPrescriptions: builder.query<Prescription[], string>({
      query: (appointmentId) => ({
        url: '/prescriptions/',
        params: {
          appointment_id: appointmentId,
          page: 1,
          page_size: 100,  // Increased to get all prescriptions
          sort_by: 'created_at',
          sort_order: 'desc'  // Latest first for tabs display
        },
      }),
      transformResponse: (response: { prescriptions: Prescription[] }) => response.prescriptions,
      providesTags: ['Prescription'],
    }),

    updatePrescription: builder.mutation<Prescription, { id: string; diagnosis?: string; clinical_notes?: string; doctor_instructions?: string }>({
      query: ({ id, ...updates }) => ({
        url: `/prescriptions/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Prescription'],
    }),

    addPrescriptionItem: builder.mutation<any, { prescriptionId: string } & PrescriptionItemForm>({
      query: ({ prescriptionId, ...itemData }) => ({
        url: `/prescriptions/${prescriptionId}/items`,
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['Prescription'],
    }),

    deletePrescriptionItem: builder.mutation<void, { itemId: string; prescriptionId: string }>({
      query: ({ itemId }) => ({
        url: `/prescriptions/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { prescriptionId }) => [
        { type: 'Prescription', id: prescriptionId },
        'Prescription',
      ],
    }),

    updatePrescriptionItem: builder.mutation<any, { itemId: string; prescriptionId: string } & Partial<PrescriptionItemForm>>({
      query: ({ itemId, prescriptionId, ...itemData }) => ({
        url: `/prescriptions/items/${itemId}`,
        method: 'PUT',
        body: itemData,
      }),
      invalidatesTags: (result, error, { prescriptionId }) => [
        { type: 'Prescription', id: prescriptionId },
        'Prescription',
      ],
    }),

    updateConsultationNotes: builder.mutation<Appointment, { appointmentId: string; notes: string; status?: string }>({
      query: ({ appointmentId, ...updates }) => ({
        url: `/appointments/${appointmentId}/consultation`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Appointment'],
    }),

    completeConsultation: builder.mutation<{ appointment: Appointment; prescription?: Prescription }, ConsultationForm>({
      query: (consultationData) => ({
        url: '/appointments/complete-consultation',
        method: 'POST',
        body: consultationData,
      }),
      invalidatesTags: ['Appointment', 'Prescription'],
    }),

    // Medicine search for prescription builder
    searchMedicines: builder.query<Medicine[], { search?: string; category?: string; limit?: number }>({
      query: ({ search, category, limit = 20 }) => ({
        url: '/medicines/search/simple',
        params: { query: search, category, limit },  // Backend expects 'query' not 'search'
      }),
      providesTags: ['Medicine'],
    }),

    // Medicine Management endpoints
    listMedicines: builder.query<{
      medicines: Medicine[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    }, {
      query?: string;
      category?: string;
      page?: number;
      page_size?: number;
    }>({
      query: ({ query, category, page = 1, page_size = 20 }) => ({
        url: '/medicines/',
        params: { query, category, page, page_size },
      }),
      providesTags: ['Medicine'],
    }),

    createMedicine: builder.mutation<Medicine, {
      name: string;
      composition: string;
      generic_name?: string;
      manufacturer?: string;
      dosage_forms?: string[];
      strength?: string;
      drug_category?: string;
      price?: number;
      requires_prescription?: boolean;
      atc_code?: string;
      storage_conditions?: string;
      contraindications?: string;
      side_effects?: string;
    }>({
      query: (medicineData) => ({
        url: '/medicines/',
        method: 'POST',
        body: medicineData,
      }),
      invalidatesTags: ['Medicine'],
    }),

    updateMedicine: builder.mutation<Medicine, { id: string } & Partial<{
      name: string;
      generic_name: string;
      composition: string;
      manufacturer: string;
      dosage_forms: string[];
      strength: string;
      drug_category: string;
      price: number;
      requires_prescription: boolean;
      atc_code: string;
      storage_conditions: string;
      contraindications: string;
      side_effects: string;
      is_active: boolean;
    }>>({
      query: ({ id, ...updates }) => ({
        url: `/medicines/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['Medicine'],
    }),

    deleteMedicine: builder.mutation<void, string>({
      query: (id) => ({
        url: `/medicines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Medicine'],
    }),

    // Short Key endpoints
    getShortKeyByCode: builder.query<ShortKey, string>({
      query: (code) => `/short-keys/code/${code}`,
      providesTags: ['ShortKey'],
    }),

    getPopularShortKeys: builder.query<ShortKey[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: '/short-keys/popular',
        params: { limit },
      }),
      providesTags: ['ShortKey'],
    }),

    listShortKeys: builder.query<any, {
      query?: string;
      is_global?: boolean;
      page?: number;
      page_size?: number;
    }>({
      query: (params) => ({
        url: '/short-keys',
        params,
      }),
      providesTags: ['ShortKey'],
    }),

    createShortKey: builder.mutation<ShortKey, {
      code: string;
      name: string;
      description?: string;
      is_global?: boolean;
    }>({
      query: (data) => ({
        url: '/short-keys',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ShortKey'],
    }),

    updateShortKey: builder.mutation<ShortKey, {
      id: string;
      code?: string;
      name?: string;
      description?: string;
      is_global?: boolean;
    }>({
      query: ({ id, ...data }) => ({
        url: `/short-keys/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ShortKey'],
    }),

    deleteShortKey: builder.mutation<void, string>({
      query: (id) => ({
        url: `/short-keys/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShortKey'],
    }),

    addMedicineToShortKey: builder.mutation<any, {
      shortKeyId: string;
      medicine_id: string;
      default_dosage: string;
      default_frequency: string;
      default_duration: string;
      default_instructions?: string;
      sequence_order?: number;
    }>({
      query: ({ shortKeyId, ...data }) => ({
        url: `/short-keys/${shortKeyId}/medicines`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ShortKey'],
    }),

    removeMedicineFromShortKey: builder.mutation<void, {
      shortKeyId: string;
      medicineId: string;
    }>({
      query: ({ shortKeyId, medicineId }) => ({
        url: `/short-keys/${shortKeyId}/medicines/${medicineId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ShortKey'],
    }),

    // Patient Management endpoints
    createPatient: builder.mutation<Patient, PatientCreate>({
      query: (patientData) => ({
        url: '/patients/',
        method: 'POST',
        body: patientData,
      }),
      invalidatesTags: ['Patient'],
    }),

    listPatients: builder.query<PatientListResponse, PatientSearchParams>({
      query: (params) => ({
        url: '/patients/',
        params: {
          mobile_number: params.mobile_number,
          first_name: params.first_name,
          last_name: params.last_name,
          page: params.page || 1,
          page_size: params.page_size || 20,
          sort_by: params.sort_by || 'first_name',
          sort_order: params.sort_order || 'asc',
        },
      }),
      providesTags: ['Patient'],
    }),

    // Family Management endpoints (FIXED: Backend routing conflict resolved)
    checkFamilyExists: builder.query<FamilyExistsResponse, string>({
      query: (mobile_number) => `/patients/families/${mobile_number}`,
      providesTags: ['Patient'],
      transformErrorResponse: (response: any) => {
        // Transform 404 to indicate family doesn't exist
        if (response.status === 404) {
          return {
            exists: false,
            mobile_number: '',
            total_members: 0,
            family_members: []
          };
        }
        return response;
      },
    }),

    getFamilyMembers: builder.query<FamilyResponse, string>({
      query: (mobile_number) => `/patients/families/${mobile_number}`,
      providesTags: ['Patient'],
    }),

    createFamilyMember: builder.mutation<Patient, { mobile_number: string } & FamilyMember>({
      query: ({ mobile_number, ...memberData }) => ({
        url: `/patients/families/${mobile_number}`,
        method: 'POST',
        body: {
          ...memberData,
          // Map frontend 'relationship' to backend 'relationship_to_primary'
          relationship_to_primary: memberData.relationship,
          // Add required primary_contact_mobile for family members
          primary_contact_mobile: mobile_number,
          // Remove the frontend 'relationship' field to avoid confusion
          relationship: undefined,
        },
      }),
      invalidatesTags: ['Patient'],
    }),

    updatePatient: builder.mutation<Patient, { mobile_number: string; first_name: string; patientData: Partial<PatientCreate> }>({
      query: ({ mobile_number, first_name, patientData }) => ({
        url: `/patients/${mobile_number}/${first_name}`,
        method: 'PUT',
        body: patientData,
      }),
      invalidatesTags: ['Patient'],
    }),

    // Doctor Management endpoints
    createDoctor: builder.mutation<Doctor, DoctorCreate>({
      query: (doctorData) => ({
        url: '/doctors/',
        method: 'POST',
        body: doctorData,
      }),
      invalidatesTags: ['Doctor'],
    }),

    listDoctors: builder.query<DoctorListResponse, DoctorSearchParams>({
      query: (params) => ({
        url: '/doctors/',
        params,
      }),
      providesTags: ['Doctor'],
    }),

    getDoctorById: builder.query<Doctor, string>({
      query: (doctorId) => `/doctors/${doctorId}`,
      providesTags: ['Doctor'],
    }),

    updateDoctor: builder.mutation<Doctor, { doctorId: string; doctorData: DoctorUpdate }>({
      query: ({ doctorId, doctorData }) => ({
        url: `/doctors/${doctorId}`,
        method: 'PUT',
        body: doctorData,
      }),
      invalidatesTags: ['Doctor'],
    }),

    deleteDoctor: builder.mutation<void, string>({
      query: (doctorId) => ({
        url: `/doctors/${doctorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Doctor'],
    }),

    reactivateDoctor: builder.mutation<Doctor, string>({
      query: (doctorId) => ({
        url: `/doctors/${doctorId}/reactivate`,
        method: 'PUT',
      }),
      invalidatesTags: ['Doctor'],
    }),

    getDoctorSchedule: builder.query<DoctorScheduleResponse, string>({
      query: (doctorId) => `/doctors/${doctorId}/schedule`,
      providesTags: ['Doctor'],
    }),

    updateDoctorSchedule: builder.mutation<DoctorScheduleResponse, { doctorId: string; scheduleData: DoctorScheduleUpdate }>({
      query: ({ doctorId, scheduleData }) => ({
        url: `/doctors/${doctorId}/schedule`,
        method: 'PUT',
        body: scheduleData,
      }),
      invalidatesTags: ['Doctor'],
    }),

    getDoctorsBySpecialization: builder.query<Doctor[], string>({
      query: (specialization) => `/doctors/specializations/${specialization}`,
      providesTags: ['Doctor'],
    }),

    getAvailableDoctorsForDay: builder.query<Doctor[], string>({
      query: (day) => `/doctors/availability/${day}`,
      providesTags: ['Doctor'],
    }),


    getDoctorByLicense: builder.query<Doctor, string>({
      query: (licenseNumber) => `/doctors/license/${licenseNumber}`,
      providesTags: ['Doctor'],
    }),

    getDoctorByUserId: builder.query<Doctor, string>({
      query: (userId) => `/doctors/user/${userId}`,
      providesTags: ['Doctor'],
    }),

  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useGetDoctorStatisticsQuery,
  useGetDoctorProfileQuery,
  useGetDoctorTodayAppointmentsQuery,
  useGetDoctorDailyScheduleQuery,
  useGetDoctorRecentPrescriptionsQuery,
  useGetDoctorUpcomingAppointmentsQuery,
  // Appointment Management hooks
  useGetDoctorAppointmentsQuery,
  useGetAppointmentsByDateQuery,
  useGetAppointmentDetailsQuery,
  useGetAppointmentAvailabilityQuery,
  useUpdateAppointmentStatusMutation,
  useRescheduleAppointmentMutation,
  useCancelAppointmentMutation,
  // Consultation and Prescription hooks
  useGetPatientByAppointmentQuery,
  useGetPatientMedicalHistoryQuery,
  useCreatePrescriptionMutation,
  useGetPrescriptionQuery,
  useGetAppointmentPrescriptionsQuery,
  useUpdatePrescriptionMutation,
  useAddPrescriptionItemMutation,
  useDeletePrescriptionItemMutation,
  useUpdatePrescriptionItemMutation,
  useUpdateConsultationNotesMutation,
  useCompleteConsultationMutation,
  useSearchMedicinesQuery,
  // Medicine Management hooks
  useListMedicinesQuery,
  useCreateMedicineMutation,
  useUpdateMedicineMutation,
  useDeleteMedicineMutation,
  // Short Key hooks
  useGetShortKeyByCodeQuery,
  useGetPopularShortKeysQuery,
  useListShortKeysQuery,
  useCreateShortKeyMutation,
  useUpdateShortKeyMutation,
  useDeleteShortKeyMutation,
  useAddMedicineToShortKeyMutation,
  useRemoveMedicineFromShortKeyMutation,
  // Patient Management hooks
  useCreatePatientMutation,
  useListPatientsQuery,
  useUpdatePatientMutation,
  // Family Management hooks
  useCheckFamilyExistsQuery,
  useGetFamilyMembersQuery,
  useCreateFamilyMemberMutation,
  // Doctor Management hooks
  useCreateDoctorMutation,
  useListDoctorsQuery,
  useGetDoctorByIdQuery,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useReactivateDoctorMutation,
  useGetDoctorScheduleQuery,
  useUpdateDoctorScheduleMutation,
  useGetDoctorsBySpecializationQuery,
  useGetAvailableDoctorsForDayQuery,
  useGetDoctorByLicenseQuery,
  useGetDoctorByUserIdQuery,
  // Appointment Creation hooks
  useCreateAppointmentMutation,
  useCheckAppointmentConflictMutation,
} = api;