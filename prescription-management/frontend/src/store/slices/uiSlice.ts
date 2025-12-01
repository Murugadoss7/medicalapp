import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

type SidebarMode = 'appointments' | 'procedures';

interface UIState {
  breadcrumbs: BreadcrumbItem[];
  notifications: Notification[];
  modals: Record<string, boolean>;
  loading: Record<string, boolean>;
  sidebarOpen: boolean;
  appointmentsSidebarOpen: boolean;
  selectedOfficeId: string | null; // For filtering appointments by office
  sidebarMode: SidebarMode; // Toggle between appointments and procedures view
}

const initialState: UIState = {
  breadcrumbs: [],
  notifications: [],
  modals: {},
  loading: {},
  sidebarOpen: true,
  appointmentsSidebarOpen: false,
  selectedOfficeId: null,
  sidebarMode: 'appointments',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => {
      state.breadcrumbs = action.payload;
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.notifications.push(notification);
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setModal: (state, action: PayloadAction<{ modal: string; open: boolean }>) => {
      state.modals[action.payload.modal] = action.payload.open;
    },
    
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    toggleAppointmentsSidebar: (state) => {
      state.appointmentsSidebarOpen = !state.appointmentsSidebarOpen;
    },

    setAppointmentsSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.appointmentsSidebarOpen = action.payload;
    },

    setSelectedOfficeId: (state, action: PayloadAction<string | null>) => {
      state.selectedOfficeId = action.payload;
    },

    setSidebarMode: (state, action: PayloadAction<SidebarMode>) => {
      state.sidebarMode = action.payload;
    },
  },
});

export const {
  setBreadcrumbs,
  addNotification,
  removeNotification,
  clearNotifications,
  setModal,
  setLoading,
  toggleSidebar,
  setSidebarOpen,
  toggleAppointmentsSidebar,
  setAppointmentsSidebarOpen,
  setSelectedOfficeId,
  setSidebarMode,
} = uiSlice.actions;

export default uiSlice.reducer;