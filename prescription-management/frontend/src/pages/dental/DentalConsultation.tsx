/**
 * Dental Consultation Page
 * Main page for dental consultations integrating all dental components
 * Allows doctors to record observations, procedures, and view patient dental history
 * Updated: 2025-12-05 - Fixed iPad freezing and modal overlay issues
 */

import React, { useState, useEffect, useCallback, useMemo, useTransition, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  History as HistoryIcon,
  CheckCircle,
  PlayArrow,
  Home,
  TableChart as SummaryIcon,
  Save as SaveIcon,
  MedicalServices as MedicalServicesIcon,
  Article as ArticleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarOpen, setAppointmentsSidebarOpen } from '../../store/slices/uiSlice';
import { type RootState } from '../../store';
import {
  ToothHistoryViewer,
  DentalPrescriptionBuilder,
  DentalSummaryTable,
  ObservationRow,
  type ObservationData,
  type ProcedureData,
  NewObservationForm,
  SavedObservationsPanel,
  ObservationEditModal,
  AnatomicalDentalChart,
} from '../../components/dental';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';

// Simple ID generator (replaces uuid)
const generateId = () => `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create a new observation
const createNewObservation = (teeth: string[] = []): ObservationData => ({
  id: generateId(),
  selectedTeeth: teeth,
  toothSurface: '',
  conditionType: '',
  severity: '',
  observationNotes: '',
  treatmentRequired: true,
  hasProcedure: false,
  procedures: [], // Initialize empty procedures array
  // Legacy fields for backward compatibility
  procedureCode: '',
  procedureName: '',
  customProcedureName: '',
  procedureDate: new Date(),
  procedureNotes: '',
  isSaved: false,
  // Template support
  selectedTemplateIds: [],
  customNotes: '',
});

import dentalService, { type DentalChart as DentalChartType } from '../../services/dentalService';
import {
  useGetAppointmentDetailsQuery,
  useGetPatientMedicalHistoryQuery,
  useGetCurrentUserQuery,
  useUpdateAppointmentStatusMutation,
} from '../../store/api';
import { useToast } from '../../components/common/Toast';

const DentalConsultation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch();
  const theme = useTheme();

  // Responsive breakpoint for tablet optimizations
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  // useTransition for non-blocking state updates on tablet (prevents UI freeze)
  const [, startTransition] = useTransition();

  // Auto-close sidebars on mount and when component unmounts to prevent drawer overlay issues
  useEffect(() => {
    // Close sidebars on consultation page for more screen space
    dispatch(setSidebarOpen(false));
    dispatch(setAppointmentsSidebarOpen(false));

    // CRITICAL FIX: Ensure sidebars stay closed on this page to prevent iPad freezing
    // The temporary drawer variant creates a modal overlay that blocks interactions
    return () => {
      // Keep sidebars closed on unmount to prevent modal overlay issues
      dispatch(setAppointmentsSidebarOpen(false));
    };
  }, [dispatch]);

  // Get logged-in user from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Get sidebar state to adjust layout
  const isSidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  // Fetch current user info to get doctor_id
  const { data: currentUserData, isLoading: isLoadingCurrentUser } = useGetCurrentUserQuery();

  // Get doctor_id from API response (preferred) or Redux fallback
  const doctorId = currentUserData?.doctor_id || user?.doctor_id;

  // Status update mutation
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAppointmentStatusMutation();

  // Show warning if doctor_id is not available
  React.useEffect(() => {
    if (!isLoadingCurrentUser && !doctorId) {
      console.warn('Doctor ID not available. Please ensure you are logged in as a doctor.');
    }
  }, [isLoadingCurrentUser, doctorId]);

  // Fetch appointment details
  const {
    data: appointmentDetails,
    isLoading: appointmentLoading,
    error: appointmentError,
    refetch: refetchAppointment,
  } = useGetAppointmentDetailsQuery(appointmentId || '', { skip: !appointmentId });

  // Patient info from appointment
  const [patientData, setPatientData] = useState({
    mobileNumber: '',
    firstName: '',
  });

  // Navigation guard state
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track if we've already auto-started the consultation
  const hasAutoStartedRef = useRef(false);

  // Track if we've already loaded observations for this mount (prevents double-loading)
  const hasLoadedObservationsRef = useRef(false);

  // Track the previous appointmentId to detect when it actually changes
  const previousAppointmentIdRef = useRef<string | null>(null);

  // Handle status update - memoized to prevent infinite loops
  // MUST be declared before the useEffect that uses it
  const handleUpdateStatus = useCallback(async (newStatus: string) => {
    if (!appointmentId) return;

    try {
      await updateStatus({
        appointmentId,
        status: newStatus,
      }).unwrap();

      refetchAppointment();

      if (newStatus === 'completed') {
        toast.success('Consultation completed successfully!');
      } else if (newStatus === 'in_progress') {
        toast.info('Consultation started');
      }
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to update appointment status');
    }
  }, [appointmentId, updateStatus, refetchAppointment]);

  // Update patient data when appointment details are loaded
  useEffect(() => {
    if (appointmentDetails) {
      // Try patient_details first, fallback to appointment fields
      const mobileNumber = appointmentDetails.patient_details?.mobile_number ||
                          appointmentDetails.patient_mobile_number || '';
      const firstName = appointmentDetails.patient_details?.first_name ||
                       appointmentDetails.patient_first_name || '';

      // Only update if values actually changed (prevents unnecessary re-renders)
      setPatientData(prev => {
        if (prev.mobileNumber === mobileNumber && prev.firstName === firstName) {
          return prev;
        }
        return { mobileNumber, firstName };
      });

      // Auto-update status to in_progress if scheduled (only once)
      if (appointmentDetails.status === 'scheduled' && !hasAutoStartedRef.current) {
        hasAutoStartedRef.current = true;
        handleUpdateStatus('in_progress');
      }
    }
  }, [appointmentDetails, handleUpdateStatus]); // Include memoized function

  // Fetch prescriptions for this patient
  const { data: allPrescriptions, refetch: refetchPrescriptions } = useGetPatientMedicalHistoryQuery(
    {
      patientMobile: patientData.mobileNumber,
      patientName: patientData.firstName,
      limit: 10,
    },
    { skip: !patientData.mobileNumber || !patientData.firstName }
  );

  // Filter prescriptions to only show those created by the current doctor
  const patientPrescriptions = React.useMemo(() => {
    if (!allPrescriptions) return [];
    // Use logged-in doctor_id if available, otherwise use appointment's doctor_id as fallback
    const currentDoctorId = doctorId || appointmentDetails?.doctor_id;
    if (!currentDoctorId) return [];
    return allPrescriptions.filter(
      (prescription) => prescription.doctor_id === currentDoctorId
    );
  }, [allPrescriptions, doctorId, appointmentDetails]);

  // State
  const [dentalChart, setDentalChart] = useState<DentalChartType | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [selectedToothData, setSelectedToothData] = useState<any>(null);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string | null>(null);
  const [selectedPrescriptionIndex, setSelectedPrescriptionIndex] = useState(0); // For tabbed prescriptions
  const [showSummaryDialog, setShowSummaryDialog] = useState(false); // For holistic view
  const [loading, setLoading] = useState(false);

  // Observation rows state (fixed panel with multiple observations)
  const [observations, setObservations] = useState<ObservationData[]>([]);
  const [activeObservationId, setActiveObservationId] = useState<string | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [savingObservations, setSavingObservations] = useState(false);

  // NEW REDESIGN STATE
  const [newObservation, setNewObservation] = useState<ObservationData>(() => createNewObservation());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<ObservationData | null>(null);

  // Collapsible sections state
  const [observationFormCollapsed, setObservationFormCollapsed] = useState(false);
  const [chartCollapsed, setChartCollapsed] = useState(false);

  // Edit confirmation dialog state
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);
  const [pendingEditObservation, setPendingEditObservation] = useState<ObservationData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeleteObservationId, setPendingDeleteObservationId] = useState<string | null>(null);

  // Refs for scrolling observations into view
  const observationContainerRef = useRef<HTMLDivElement>(null);
  const observationRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load saved observations and procedures from backend for this appointment

  // Load saved observations when appointment is available
  useEffect(() => {
    if (!appointmentId) return;

    // Check if we already loaded data for this appointment
    if (previousAppointmentIdRef.current === appointmentId && hasLoadedObservationsRef.current) {
      return;
    }

    // Mark as loading for this appointment
    hasLoadedObservationsRef.current = true;
    previousAppointmentIdRef.current = appointmentId;

    const abortController = new AbortController();
    let isMounted = true;

    const loadData = async () => {
      try {
        // Fetch both observations and procedures with cancellation support
        const [obsResponse, procResponse] = await Promise.all([
          dentalService.observations.getByAppointment(appointmentId, { signal: abortController.signal }),
          dentalService.procedures.getByAppointment(appointmentId, { signal: abortController.signal }),
        ]);

        // Check if component is still mounted before updating state
        if (!isMounted) return;

        const fetchedObservations = obsResponse.observations || [];
        const procedures = procResponse.procedures || [];

        // Process data outside of state update for better performance
        const processObservationsData = () => {
          if (fetchedObservations.length > 0 || procedures.length > 0) {
            // Group observations by condition and surface to create observation rows
            const groupedObs: Record<string, ObservationData> = {};

            fetchedObservations.forEach(obs => {
              // Create a key based on condition and surface to group related observations
              const key = `${obs.condition_type}_${obs.tooth_surface || 'none'}_${obs.severity || 'none'}`;

              if (groupedObs[key]) {
                // Add tooth to existing group AND track its backend ID
                if (!groupedObs[key].selectedTeeth.includes(obs.tooth_number)) {
                  groupedObs[key].selectedTeeth.push(obs.tooth_number);
                  // Store backend observation ID for this tooth
                  if (!groupedObs[key].backendObservationIds) {
                    groupedObs[key].backendObservationIds = {};
                  }
                  groupedObs[key].backendObservationIds![obs.tooth_number] = obs.id;
                }
              } else {
                // Create new observation group with backend ID tracking
                groupedObs[key] = {
                  id: `saved_${obs.id}`,
                  selectedTeeth: [obs.tooth_number],
                  toothSurface: obs.tooth_surface || '',
                  conditionType: obs.condition_type,
                  severity: obs.severity || '',
                  observationNotes: obs.observation_notes || '',
                  treatmentRequired: obs.treatment_required,
                  hasProcedure: false,
                  procedureCode: '',
                  procedureName: '',
                  customProcedureName: '',
                  procedureDate: new Date(),
                  procedureNotes: '',
                  isSaved: true,
                  // CRITICAL: Track backend observation IDs for updates
                  backendObservationIds: {
                    [obs.tooth_number]: obs.id
                  },
                  // Template support - load from backend
                  selectedTemplateIds: obs.selected_template_ids ? obs.selected_template_ids.split(',') : [],
                  customNotes: obs.custom_notes || '',
                  procedures: [], // Initialize procedures array
                };
              }
            });

            // Match procedures to observations based on tooth numbers
            procedures.forEach(proc => {
              const procTeeth = proc.tooth_numbers?.split(',') || [];

              // Find matching observation group by teeth
              for (const key of Object.keys(groupedObs)) {
                const obsGroup = groupedObs[key];
                const hasMatchingTeeth = procTeeth.some(t => obsGroup.selectedTeeth.includes(t));

                if (hasMatchingTeeth) {
                  // FIX: Add procedure to procedures array (new format) for edit mode
                  const procedureData: ProcedureData = {
                    id: proc.id, // Use backend ID as the ID
                    selectedTeeth: procTeeth,
                    procedureCode: proc.procedure_code,
                    procedureName: proc.procedure_name,
                    customProcedureName: proc.procedure_code === 'CUSTOM' ? proc.procedure_name : undefined,
                    procedureDate: proc.procedure_date ? new Date(proc.procedure_date) : new Date(),
                    procedureTime: proc.procedure_date ? new Date(proc.procedure_date) : new Date(),
                    procedureNotes: proc.procedure_notes || '',
                    procedureStatus: (proc.status || 'planned') as 'planned' | 'cancelled' | 'completed',
                    backendProcedureId: proc.id, // CRITICAL: Track backend procedure ID
                  };

                  obsGroup.procedures = obsGroup.procedures || [];
                  obsGroup.procedures.push(procedureData);

                  // Also set legacy fields for backward compatibility (for display in SavedObservationsPanel)
                  if (!obsGroup.hasProcedure) {
                    obsGroup.hasProcedure = true;
                    obsGroup.procedureCode = proc.procedure_code;
                    obsGroup.procedureName = proc.procedure_name;
                    obsGroup.procedureDate = proc.procedure_date ? new Date(proc.procedure_date) : new Date();
                    obsGroup.procedureNotes = proc.procedure_notes || '';
                    obsGroup.procedureStatus = proc.status || 'planned';
                    obsGroup.backendProcedureId = proc.id;
                    if (proc.procedure_code === 'CUSTOM') {
                      obsGroup.customProcedureName = proc.procedure_name;
                    }
                  }
                  break;
                }
              }
            });

            // Handle procedures without matching observations (standalone procedures)
            procedures.forEach((proc, index) => {
              const procTeeth = proc.tooth_numbers?.split(',') || [];
              const hasMatchingObs = Object.values(groupedObs).some(obs =>
                obs.procedures?.some(p => p.backendProcedureId === proc.id)
              );

              if (!hasMatchingObs) {
                // Create a standalone observation row for this procedure
                const key = `proc_${proc.id}`;

                // FIX: Create procedure data for procedures array
                const procedureData: ProcedureData = {
                  id: proc.id,
                  selectedTeeth: procTeeth,
                  procedureCode: proc.procedure_code,
                  procedureName: proc.procedure_name,
                  customProcedureName: proc.procedure_code === 'CUSTOM' ? proc.procedure_name : undefined,
                  procedureDate: proc.procedure_date ? new Date(proc.procedure_date) : new Date(),
                  procedureTime: proc.procedure_date ? new Date(proc.procedure_date) : new Date(),
                  procedureNotes: proc.procedure_notes || '',
                  procedureStatus: (proc.status || 'planned') as 'planned' | 'cancelled' | 'completed',
                  backendProcedureId: proc.id,
                };

                groupedObs[key] = {
                  id: `saved_proc_${proc.id}`,
                  selectedTeeth: procTeeth,
                  toothSurface: '',
                  conditionType: '',
                  severity: '',
                  observationNotes: '',
                  treatmentRequired: true,
                  hasProcedure: true,
                  procedureCode: proc.procedure_code,
                  procedureName: proc.procedure_name,
                  customProcedureName: proc.procedure_code === 'CUSTOM' ? proc.procedure_name : '',
                  procedureDate: proc.procedure_date ? new Date(proc.procedure_date) : new Date(),
                  procedureNotes: proc.procedure_notes || '',
                  procedureStatus: proc.status || 'planned',
                  isSaved: true,
                  backendProcedureId: proc.id,
                  // FIX: Add procedures array
                  procedures: [procedureData],
                };
              }
            });

            const savedObservations = Object.values(groupedObs);
            const newObs = createNewObservation();
            return { observations: [...savedObservations, newObs], activeId: newObs.id };
          } else {
            const newObs = createNewObservation();
            return { observations: [newObs], activeId: newObs.id };
          }
        };

        const result = processObservationsData();

        // Update state
        setObservations(result.observations);
        setActiveObservationId(result.activeId);
      } catch (error: any) {
        // Ignore cancelled requests
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }

        // Only update state if still mounted
        if (isMounted) {
          const newObs = createNewObservation();
          setObservations([newObs]);
          setActiveObservationId(newObs.id);
        }
      }
    };

    loadData();

    return () => {
      // Cleanup: Cancel pending requests but DON'T reset refs
      isMounted = false;
      abortController.abort();
      // NOTE: We intentionally DON'T reset hasLoadedObservationsRef here
      // to prevent duplicate loads if component remounts with same appointmentId
    };
  }, [appointmentId]); // Only depend on appointmentId

  // Load dental chart data - memoized to prevent infinite loops
  const loadDentalChart = useCallback(async () => {
    if (!patientData.mobileNumber || !patientData.firstName) return;

    try {
      setLoading(true);
      const chart = await dentalService.chart.getChart(
        patientData.mobileNumber,
        patientData.firstName
      );
      setDentalChart(chart);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load dental chart');
    } finally {
      setLoading(false);
    }
  }, [patientData.mobileNumber, patientData.firstName]);

  // Trigger dental chart load when patient data changes
  useEffect(() => {
    if (patientData.mobileNumber && patientData.firstName) {
      loadDentalChart();
    }
  }, [patientData.mobileNumber, patientData.firstName, loadDentalChart]); // Include memoized function

  // Handle complete consultation
  const handleCompleteConsultation = async () => {
    await handleUpdateStatus('completed');
    navigate('/doctor/dashboard');
  };

  // Handle navigation with status check
  const handleNavigateAway = useCallback((destination: string) => {
    if (appointmentDetails?.status === 'in_progress') {
      setPendingNavigation(() => () => navigate(destination));
      setShowExitDialog(true);
    } else {
      navigate(destination);
    }
  }, [appointmentDetails?.status, navigate]);

  // Handle exit dialog response
  const handleExitDialogResponse = async (completed: boolean) => {
    setShowExitDialog(false);

    if (completed) {
      await handleUpdateStatus('completed');
      toast.success('Consultation marked as completed');
    }
    // Keep status as in_progress if not completed

    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  // Update selectedToothData when dentalChart changes (for real-time updates)
  useEffect(() => {
    if (selectedTeeth.length === 1 && dentalChart?.teeth) {
      const toothData = dentalChart.teeth.find(t => t.tooth_number === selectedTeeth[0]);
      setSelectedToothData(toothData || null);
    } else {
      setSelectedToothData(null);
    }
  }, [dentalChart, selectedTeeth]);

  // Handle tooth click - add to active observation (only if not saved)
  const handleToothClick = (toothNumber: string) => {
    // Check if active observation is saved (read-only)
    const activeObs = observations.find(o => o.id === activeObservationId);

    if (!activeObservationId || activeObs?.isSaved) {
      // Create new observation if none active OR active is saved (read-only)
      const newObs = createNewObservation([toothNumber]);
      setObservations([...observations, newObs]);
      setActiveObservationId(newObs.id);
    } else {
      // Add/remove tooth from active observation (only if not saved)
      setObservations(prev => prev.map(obs => {
        if (obs.id === activeObservationId && !obs.isSaved) {
          const hasToothAlready = obs.selectedTeeth.includes(toothNumber);
          return {
            ...obs,
            selectedTeeth: hasToothAlready
              ? obs.selectedTeeth.filter(t => t !== toothNumber)
              : [...obs.selectedTeeth, toothNumber],
          };
        }
        return obs;
      }));
    }
    setHasUnsavedChanges(true);
  };

  // Handle multi-tooth selection (from DentalChart) - only if not saved
  const handleTeethSelect = (toothNumbers: string[]) => {
    if (activeObservationId) {
      const activeObs = observations.find(o => o.id === activeObservationId);

      // Don't modify saved observations
      if (activeObs?.isSaved) {
        toast.info('This observation is saved. Create a new observation to add more teeth.');
        return;
      }

      setObservations(prev => prev.map(obs => {
        if (obs.id === activeObservationId && !obs.isSaved) {
          return { ...obs, selectedTeeth: toothNumbers };
        }
        return obs;
      }));
    }
    setHasUnsavedChanges(true);
  };

  // Get selected teeth from active observation
  const activeObservation = observations.find(o => o.id === activeObservationId);
  const selectedTeethForChart = activeObservation?.selectedTeeth || [];

  // Scroll observation into view - disable smooth scroll on tablet to prevent jank
  const scrollToObservation = useCallback((id: string) => {
    // Longer delay on tablet to ensure render is complete before scrolling
    const delay = isTablet ? 200 : 100;
    setTimeout(() => {
      const element = observationRefs.current[id];
      if (element) {
        // Use instant scroll on tablet to prevent animation-related freezes
        element.scrollIntoView({ behavior: isTablet ? 'auto' : 'smooth', block: 'center' });
      }
    }, delay);
  }, [isTablet]);

  // Add new observation row
  const handleAddObservationRow = () => {
    const newObs = createNewObservation();
    setObservations([...observations, newObs]);
    setActiveObservationId(newObs.id);
    setHasUnsavedChanges(true);
    // Scroll to the new observation
    scrollToObservation(newObs.id);
  };

  // Update observation - DISABLED startTransition, just update directly
  const handleUpdateObservation = useCallback((id: string, data: Partial<ObservationData>) => {
    setObservations(prev => prev.map(obs =>
      obs.id === id ? { ...obs, ...data } : obs
    ));
    setHasUnsavedChanges(true);
  }, []);

  // Delete observation
  const handleDeleteObservation = (id: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== id));
    if (activeObservationId === id) {
      setActiveObservationId(observations.length > 1 ? observations[0]?.id : null);
    }
    setHasUnsavedChanges(true);
  };

  // Set active observation and scroll into view
  const handleSetActiveObservation = (id: string) => {
    setActiveObservationId(id);
    scrollToObservation(id);
  };

  // Enable edit mode for a saved observation
  const handleEditObservation = (id: string) => {
    setObservations(prev => prev.map(obs => {
      if (obs.id === id) {
        return { ...obs, isSaved: false };  // Remove saved flag to enable editing
      }
      return obs;
    }));
    setActiveObservationId(id);
    toast.info('Edit mode enabled. Make changes and click Save All when done.');
  };

  // Handle view tooth history - only for single tooth
  const handleViewHistory = () => {
    const teeth = activeObservation?.selectedTeeth || [];
    if (teeth.length !== 1) {
      toast.warning('Please select exactly one tooth to view history');
      return;
    }
    setShowHistoryDialog(true);
  };

  // Save all observations and their procedures
  const handleSaveAllObservations = async () => {
    try {
      setSavingObservations(true);

      // Filter observations that have teeth selected, condition filled, AND are NOT already saved
      const validObservations = observations.filter(
        obs => obs.selectedTeeth.length > 0 && obs.conditionType && !obs.isSaved
      );

      if (validObservations.length === 0) {
        toast.warning('No new observations to save. Add new observations first.');
        return;
      }

      let savedObservations = 0;
      let savedProcedures = 0;

      // Track newly created IDs to store in state
      const newBackendIds: Record<string, Record<string, string>> = {};
      const newProcedureIds: Record<string, string> = {};

      for (const obs of validObservations) {
        // Initialize ID storage for this observation
        if (!newBackendIds[obs.id]) {
          newBackendIds[obs.id] = {};
        }

        // Save or update observations for each tooth
        for (const toothNumber of obs.selectedTeeth) {
          const backendObsId = obs.backendObservationIds?.[toothNumber];

          if (backendObsId) {
            // UPDATE existing observation (prevents duplicates)
            console.log(`UPDATE observation ${backendObsId} for tooth ${toothNumber}`);
            await dentalService.observations.update(backendObsId, {
              tooth_surface: obs.toothSurface || undefined,
              condition_type: obs.conditionType,
              severity: obs.severity || undefined,
              observation_notes: obs.observationNotes || undefined,
              treatment_required: obs.treatmentRequired,
              treatment_done: false,
            });
            // Keep the existing backend ID
            newBackendIds[obs.id][toothNumber] = backendObsId;
          } else {
            // CREATE new observation
            console.log(`CREATE new observation for tooth ${toothNumber}`);
            const created = await dentalService.observations.create({
              appointment_id: appointmentId,
              patient_mobile_number: patientData.mobileNumber,
              patient_first_name: patientData.firstName,
              tooth_number: toothNumber,
              tooth_surface: obs.toothSurface || undefined,
              condition_type: obs.conditionType,
              severity: obs.severity || undefined,
              observation_notes: obs.observationNotes || undefined,
              treatment_required: obs.treatmentRequired,
              treatment_done: false,
            });
            // Store the new backend ID for future updates
            newBackendIds[obs.id][toothNumber] = created.id;
          }
          savedObservations++;
        }

        // Save or update procedure if added
        if (obs.hasProcedure && obs.procedureCode) {
          const procedureName = obs.procedureCode === 'CUSTOM'
            ? obs.customProcedureName
            : obs.procedureName;

          if (obs.backendProcedureId) {
            // UPDATE existing procedure (prevents duplicates)
            console.log(`UPDATE procedure ${obs.backendProcedureId}`);
            await dentalService.procedures.update(obs.backendProcedureId, {
              procedure_code: obs.procedureCode === 'CUSTOM' ? 'CUSTOM' : obs.procedureCode,
              procedure_name: procedureName,
              tooth_numbers: obs.selectedTeeth.join(','),
              procedure_date: obs.procedureDate?.toISOString().split('T')[0],
              procedure_notes: obs.procedureNotes || undefined,
              status: (obs.procedureStatus || 'Planned').toLowerCase(),
            });
            // Keep existing procedure ID
            newProcedureIds[obs.id] = obs.backendProcedureId;
          } else {
            // CREATE new procedure
            console.log(`CREATE new procedure`);
            const createdProc = await dentalService.procedures.create({
              appointment_id: appointmentId,
              procedure_code: obs.procedureCode === 'CUSTOM' ? 'CUSTOM' : obs.procedureCode,
              procedure_name: procedureName,
              tooth_numbers: obs.selectedTeeth.join(','),
              procedure_date: obs.procedureDate?.toISOString().split('T')[0],
              procedure_notes: obs.procedureNotes || undefined,
              status: (obs.procedureStatus || 'Planned').toLowerCase(),
            });
            // Store new procedure ID for future updates
            newProcedureIds[obs.id] = createdProc.id;
          }
          savedProcedures++;
        }
      }

      toast.success(`Saved ${savedObservations} observations${savedProcedures > 0 ? ` and ${savedProcedures} procedures` : ''}`);

      // Mark saved observations as saved AND update their backend IDs
      const updatedObservations = observations.map(obs => {
        if (validObservations.find(vo => vo.id === obs.id)) {
          return {
            ...obs,
            isSaved: true,
            // CRITICAL: Update backend IDs so future edits use UPDATE not CREATE
            backendObservationIds: {
              ...obs.backendObservationIds,
              ...newBackendIds[obs.id],
            },
            backendProcedureId: newProcedureIds[obs.id] || obs.backendProcedureId,
          };
        }
        return obs;
      });

      // Keep observations visible, don't auto-add new one - let doctor click "Add Observation"
      setObservations(updatedObservations);
      setActiveObservationId(null);
      setHasUnsavedChanges(false);
      loadDentalChart();

    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save observations');
    } finally {
      setSavingObservations(false);
    }
  };

  // Handle procedure form submit
  const handleProcedureSubmit = async (data: any) => {
    try {
      setLoading(true);

      await dentalService.procedures.create({
        appointment_id: appointmentId,
        procedure_code: data.procedureCode,
        procedure_name: data.procedureName,
        tooth_numbers: data.toothNumbers,
        description: data.description,
        estimated_cost: data.estimatedCost,
        actual_cost: data.actualCost,
        duration_minutes: data.durationMinutes,
        status: data.status || 'completed', // Default to completed for simplified form
        procedure_date: data.procedureDate?.toISOString().split('T')[0],
        completed_date: data.completedDate?.toISOString().split('T')[0],
        procedure_notes: data.procedureNotes,
        complications: data.complications,
      });

      toast.success('Procedure added successfully');
      loadDentalChart(); // Reload chart
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add procedure');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NEW HANDLERS FOR REDESIGNED UI
  // ============================================================

  // Handle tooth click for new observation (single select toggle)
  const handleToothClickForNewObservation = useCallback((toothNumber: string) => {
    setNewObservation(prev => ({
      ...prev,
      selectedTeeth: prev.selectedTeeth.includes(toothNumber)
        ? prev.selectedTeeth.filter(t => t !== toothNumber)
        : [...prev.selectedTeeth, toothNumber],
    }));
  }, []);

  // Handle multi-select for new observation
  const handleNewObservationTeethSelect = useCallback((toothNumbers: string[]) => {
    setNewObservation(prev => ({
      ...prev,
      selectedTeeth: toothNumbers,
    }));
  }, []);

  // Save new observation (or update if in edit mode)
  const handleSaveNewObservation = useCallback(async () => {
    if (!newObservation.selectedTeeth.length || !newObservation.conditionType) {
      toast.warning('Please select teeth and condition');
      return;
    }

    try {
      setSavingObservations(true);

      // Check if we're in edit mode (updating existing observation)
      if (isEditMode && editingObservationId && newObservation.backendObservationIds) {
        // UPDATE MODE: Update existing observations
        console.log('UPDATE MODE: Updating observation', editingObservationId);

        // Update each tooth's observation in backend
        for (const toothNumber of newObservation.selectedTeeth) {
          const backendId = newObservation.backendObservationIds[toothNumber];
          if (backendId) {
            await dentalService.observations.update(backendId, {
              condition_type: newObservation.conditionType,
              severity: newObservation.severity,
              tooth_surface: newObservation.toothSurface,
              observation_notes: newObservation.observationNotes,
              treatment_required: newObservation.treatmentRequired,
              selected_template_ids: newObservation.selectedTemplateIds || [],
              custom_notes: newObservation.customNotes,
            });
          }
        }

        // Update procedures if they exist
        if (newObservation.procedures && newObservation.procedures.length > 0) {
          for (const procedure of newObservation.procedures) {
            if (procedure.backendProcedureId) {
              // Update existing procedure
              const procedureName = procedure.procedureCode === 'CUSTOM'
                ? procedure.customProcedureName
                : procedure.procedureName;

              await dentalService.procedures.update(procedure.backendProcedureId, {
                procedure_code: procedure.procedureCode,
                procedure_name: procedureName,
                tooth_numbers: procedure.selectedTeeth.join(','),
                procedure_date: procedure.procedureDate?.toISOString().split('T')[0],
                procedure_notes: procedure.procedureNotes,
                status: procedure.procedureStatus || 'planned',
              });
            }
          }
        }
        // Handle legacy single procedure
        else if (newObservation.backendProcedureId && newObservation.hasProcedure) {
          const procedureName = newObservation.procedureCode === 'CUSTOM'
            ? newObservation.customProcedureName
            : newObservation.procedureName;

          await dentalService.procedures.update(newObservation.backendProcedureId, {
            procedure_code: newObservation.procedureCode,
            procedure_name: procedureName,
            tooth_numbers: newObservation.selectedTeeth.join(','),
            procedure_date: newObservation.procedureDate?.toISOString().split('T')[0],
            procedure_notes: newObservation.procedureNotes,
            status: newObservation.procedureStatus || 'planned',
          });
        }

        // Update local state - replace the old observation with updated one
        const updatedObs: ObservationData = {
          ...newObservation,
          isSaved: true,
        };

        setObservations(prev => prev.map(obs =>
          obs.id === editingObservationId ? updatedObs : obs
        ));

        // Reset form and edit mode
        setNewObservation(createNewObservation());
        setIsEditMode(false);
        setEditingObservationId(null);
        toast.success('Observation updated successfully');
        await loadDentalChart(); // Refresh chart

      } else {
        // CREATE MODE: Create new observations
        console.log('CREATE MODE: Creating new observation');

        // Create observations for each tooth
        const createdIds: Record<string, string> = {};
        for (const toothNumber of newObservation.selectedTeeth) {
          const created = await dentalService.observations.create({
            appointment_id: appointmentId,
            patient_mobile_number: patientData.mobileNumber,
            patient_first_name: patientData.firstName,
            tooth_number: toothNumber,
            condition_type: newObservation.conditionType,
            severity: newObservation.severity,
            tooth_surface: newObservation.toothSurface,
            observation_notes: newObservation.observationNotes,
            treatment_required: newObservation.treatmentRequired,
            // Template fields
            selected_template_ids: newObservation.selectedTemplateIds,
            custom_notes: newObservation.customNotes,
          });
          createdIds[toothNumber] = created.id;
        }

        // Create procedures from procedures array (NEW format)
        let proceduresArray: ProcedureData[] = [];

        // Check if observation has procedures array (new format)
        if (newObservation.procedures && newObservation.procedures.length > 0) {
          console.log('Saving procedures:', newObservation.procedures);

          for (const procedure of newObservation.procedures) {
            const procedureName = procedure.procedureCode === 'CUSTOM'
              ? procedure.customProcedureName
              : procedure.procedureName;

            const createdProc = await dentalService.procedures.create({
              appointment_id: appointmentId,
              procedure_code: procedure.procedureCode,
              procedure_name: procedureName,
              tooth_numbers: procedure.selectedTeeth.join(','),
              procedure_date: procedure.procedureDate?.toISOString().split('T')[0],
              procedure_notes: procedure.procedureNotes,
              status: procedure.procedureStatus || 'planned',
            });

            console.log('Created procedure with ID:', createdProc.id);

            // Add to procedures array with backend ID
            proceduresArray.push({
              ...procedure,
              id: createdProc.id,
              backendProcedureId: createdProc.id,
            });
          }
        }
        // Backward compatibility: Check for legacy single procedure fields
        else if (newObservation.hasProcedure && newObservation.procedureCode) {
          const procedureName = newObservation.procedureCode === 'CUSTOM'
            ? newObservation.customProcedureName
            : newObservation.procedureName;

          const createdProc = await dentalService.procedures.create({
            appointment_id: appointmentId,
            procedure_code: newObservation.procedureCode,
            procedure_name: procedureName,
            tooth_numbers: newObservation.selectedTeeth.join(','),
            procedure_date: newObservation.procedureDate?.toISOString().split('T')[0],
            procedure_notes: newObservation.procedureNotes,
            status: newObservation.procedureStatus || 'planned',
          });

          console.log('Created legacy procedure with ID:', createdProc.id);

          // Convert legacy to procedures array format
          proceduresArray = [{
            id: createdProc.id,
            selectedTeeth: newObservation.selectedTeeth,
            procedureCode: newObservation.procedureCode,
            procedureName: procedureName || '',
            customProcedureName: newObservation.customProcedureName,
            procedureDate: newObservation.procedureDate,
            procedureTime: newObservation.procedureDate,
            procedureNotes: newObservation.procedureNotes || '',
            procedureStatus: (newObservation.procedureStatus || 'planned') as 'planned' | 'cancelled' | 'completed',
            backendProcedureId: createdProc.id,
          }];
        }

        // Add to observations array with isSaved flag AND procedures array
        const savedObs: ObservationData = {
          ...newObservation,
          isSaved: true,
          backendObservationIds: createdIds,
          created_at: new Date().toISOString(),
          // IMPORTANT: Add procedures array in new format
          procedures: proceduresArray,
          // For backward compatibility, keep first procedure ID as backendProcedureId
          backendProcedureId: proceduresArray.length > 0 ? proceduresArray[0].backendProcedureId : undefined,
        };

        console.log('Saved observation:', savedObs);
        setObservations(prev => [savedObs, ...prev]);

        // Reset form
        setNewObservation(createNewObservation());
        toast.success('Observation saved successfully');
        await loadDentalChart(); // Refresh chart
      }

    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save observation');
    } finally {
      setSavingObservations(false);
    }
  }, [newObservation, appointmentId, patientData, loadDentalChart, isEditMode, editingObservationId]);

  // Clear new observation form
  const handleClearNewObservation = useCallback(() => {
    setNewObservation(createNewObservation());
    setIsEditMode(false);
    setEditingObservationId(null);
  }, []);

  // Check if newObservation has unsaved data
  const hasUnsavedNewObservation = useCallback(() => {
    return newObservation.selectedTeeth.length > 0 ||
           newObservation.conditionType !== '' ||
           newObservation.observationNotes !== '';
  }, [newObservation]);

  // Handle edit in panel - load observation into left panel form
  const handleEditInPanel = useCallback((observation: ObservationData) => {
    if (hasUnsavedNewObservation()) {
      // Show confirmation dialog
      setPendingEditObservation(observation);
      setShowEditConfirmDialog(true);
    } else {
      // Directly load observation for editing
      loadObservationForEdit(observation);
    }
  }, [hasUnsavedNewObservation]);

  // Load observation data into the form for editing
  const loadObservationForEdit = useCallback((observation: ObservationData) => {
    // Expand the form if collapsed
    setObservationFormCollapsed(false);

    // Minimize the tooth chart to save space
    setChartCollapsed(true);

    // Load observation data into newObservation state
    setNewObservation({
      ...observation,
      isSaved: false, // Allow editing
    });

    // Track that we're in edit mode
    setIsEditMode(true);
    setEditingObservationId(observation.id);

    // Close dialog if open
    setShowEditConfirmDialog(false);
    setPendingEditObservation(null);

    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.info('Observation loaded for editing. Make changes and click Update.');
  }, []);

  // Handle confirmation dialog - Continue (discard and edit)
  const handleConfirmEdit = useCallback(() => {
    if (pendingEditObservation) {
      loadObservationForEdit(pendingEditObservation);
    }
  }, [pendingEditObservation, loadObservationForEdit]);

  // Handle confirmation dialog - Cancel (keep current work)
  const handleCancelEdit = useCallback(() => {
    setShowEditConfirmDialog(false);
    setPendingEditObservation(null);
  }, []);

  // Open edit modal
  const handleOpenEditModal = useCallback((observation: ObservationData) => {
    setEditingObservation(observation);
    setEditModalOpen(true);
  }, []);

  // Update observation from modal
  const handleUpdateObservationFromModal = useCallback(async (updated: Partial<ObservationData>) => {
    if (!editingObservation) return;

    try {
      // Update each tooth's observation in backend
      for (const toothNumber of editingObservation.selectedTeeth) {
        const backendId = editingObservation.backendObservationIds?.[toothNumber];
        if (backendId) {
          await dentalService.observations.update(backendId, {
            condition_type: updated.conditionType ?? editingObservation.conditionType,
            severity: updated.severity ?? editingObservation.severity,
            tooth_surface: updated.toothSurface ?? editingObservation.toothSurface,
            observation_notes: updated.observationNotes ?? editingObservation.observationNotes,
          });
        }
      }

      // Update local state
      setObservations(prev => prev.map(obs =>
        obs.id === editingObservation.id
          ? { ...obs, ...updated }
          : obs
      ));

      toast.success('Observation updated');
      await loadDentalChart(); // Refresh chart

    } catch (error: any) {
      toast.error('Failed to update observation');
      throw error;
    }
  }, [editingObservation, loadDentalChart]);

  // Delete observation from modal
  const handleDeleteObservationFromModal = useCallback(async (id: string) => {
    const observation = observations.find(obs => obs.id === id);
    if (!observation) return;

    try {
      // Delete each tooth's observation from backend
      for (const toothNumber of observation.selectedTeeth) {
        const backendId = observation.backendObservationIds?.[toothNumber];
        if (backendId) {
          await dentalService.observations.delete(backendId);
        }
      }

      // Delete procedure if exists
      if (observation.backendProcedureId) {
        await dentalService.procedures.delete(observation.backendProcedureId);
      }

      // Update local state
      setObservations(prev => prev.filter(obs => obs.id !== id));

      toast.success('Observation deleted');
      await loadDentalChart(); // Refresh chart

    } catch (error: any) {
      toast.error('Failed to delete observation');
      throw error;
    }
  }, [observations, loadDentalChart]);

  // Update procedure (from SavedObservationsPanel)
  const handleUpdateProcedure = useCallback(async (obsId: string, procedureData: Partial<ObservationData>) => {
    const observation = observations.find(obs => obs.id === obsId);
    if (!observation) return;

    try {
      // Handle new procedures array format
      if (procedureData.procedures) {
        // Update each procedure in the backend
        for (const procedure of procedureData.procedures) {
          if (procedure.backendProcedureId) {
            await dentalService.procedures.update(procedure.backendProcedureId, {
              procedure_date: procedure.procedureDate?.toISOString().split('T')[0],
              status: procedure.procedureStatus?.toLowerCase(),
            });
          }
        }

        // Update local state with new procedures array
        setObservations(prev => prev.map(obs =>
          obs.id === obsId
            ? { ...obs, procedures: procedureData.procedures }
            : obs
        ));
      }
      // Handle legacy single procedure format
      else if (observation.backendProcedureId) {
        await dentalService.procedures.update(observation.backendProcedureId, {
          procedure_date: procedureData.procedureDate?.toISOString().split('T')[0],
          status: procedureData.procedureStatus?.toLowerCase(),
        });

        // Update local state
        setObservations(prev => prev.map(obs =>
          obs.id === obsId
            ? { ...obs, ...procedureData }
            : obs
        ));
      }

      toast.success('Procedure updated');
      await loadDentalChart(); // Refresh chart

    } catch (error: any) {
      toast.error('Failed to update procedure');
      throw error;
    }
  }, [observations, loadDentalChart]);

  // Show delete confirmation dialog (called from SavedObservationsPanel)
  const handleRequestDeleteObservation = useCallback((obsId: string) => {
    setPendingDeleteObservationId(obsId);
    setShowDeleteConfirmDialog(true);
  }, []);

  // Confirm and execute delete
  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteObservationId) return;

    const observation = observations.find(obs => obs.id === pendingDeleteObservationId);
    if (!observation) return;

    try {
      // Delete each tooth's observation from backend
      for (const toothNumber of observation.selectedTeeth) {
        const backendId = observation.backendObservationIds?.[toothNumber];
        if (backendId) {
          await dentalService.observations.delete(backendId);
        }
      }

      // Delete all procedures from procedures array
      if (observation.procedures && observation.procedures.length > 0) {
        for (const procedure of observation.procedures) {
          if (procedure.backendProcedureId) {
            await dentalService.procedures.delete(procedure.backendProcedureId);
          }
        }
      }
      // Legacy: Delete single procedure if exists
      else if (observation.backendProcedureId) {
        await dentalService.procedures.delete(observation.backendProcedureId);
      }

      // If this observation is currently being edited, clear the edit form
      if (editingObservationId === pendingDeleteObservationId) {
        setNewObservation(createNewObservation());
        setIsEditMode(false);
        setEditingObservationId(null);
        toast.info('Edit mode cleared');
      }

      // Update local state
      setObservations(prev => prev.filter(obs => obs.id !== pendingDeleteObservationId));

      // Close dialog
      setShowDeleteConfirmDialog(false);
      setPendingDeleteObservationId(null);

      toast.success('Observation and all procedures deleted');
      await loadDentalChart(); // Refresh chart to remove markings

    } catch (error: any) {
      toast.error('Failed to delete observation');
      throw error;
    }
  }, [pendingDeleteObservationId, observations, editingObservationId, loadDentalChart]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirmDialog(false);
    setPendingDeleteObservationId(null);
  }, []);

  // ============================================================
  // END NEW HANDLERS
  // ============================================================

  // Convert dental chart data to tooth data for chart component - MEMOIZED for iPad performance
  const toothData = useMemo(() => {
    if (!dentalChart?.teeth) return [];

    return dentalChart.teeth.map(tooth => {
      // Optimize: Single pass through procedures instead of 3 separate filters
      let completedCount = 0;
      let inProgressCount = 0;
      let plannedCount = 0;

      for (const proc of tooth.procedures) {
        if (proc.status === 'completed') completedCount++;
        else if (proc.status === 'in_progress') inProgressCount++;
        else if (proc.status === 'planned') plannedCount++;
      }

      // Determine overall procedure status for the tooth
      let procedureStatus: 'planned' | 'in_progress' | 'completed' | undefined;
      if (completedCount > 0 && completedCount === tooth.procedures.length) {
        procedureStatus = 'completed'; // All procedures completed
      } else if (completedCount > 0) {
        procedureStatus = 'in_progress'; // Some completed, some pending
      } else if (inProgressCount > 0) {
        procedureStatus = 'in_progress';
      } else if (plannedCount > 0) {
        procedureStatus = 'planned';
      }

      return {
        toothNumber: tooth.tooth_number,
        hasObservation: tooth.observations.length > 0,
        hasProcedure: tooth.procedures.length > 0,
        hasActiveIssue: tooth.has_active_issues,
        conditionType: tooth.observations.length > 1
          ? `${tooth.observations.length} observations`
          : tooth.observations[0]?.condition_type,
        severity: tooth.observations[0]?.severity,
        lastTreatmentDate: tooth.last_treatment_date,
        observationCount: tooth.observations.length,
        procedureCount: tooth.procedures.length,
        // New fields for better status tracking
        procedureStatus,
        completedProcedureCount: completedCount,
        hasPendingProcedure: plannedCount > 0 || inProgressCount > 0,
        hasCompletedProcedure: completedCount > 0,
      };
    });
  }, [dentalChart]);

  // Convert toothData array to Record<string, ToothData> for AnatomicalDentalChart
  const teethDataRecord = useMemo(() => {
    const record: Record<string, any> = {};
    for (const tooth of toothData) {
      record[tooth.toothNumber] = tooth;
    }
    return record;
  }, [toothData]);

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', color: 'primary' as const };
      case 'in_progress':
        return { label: 'In Progress', color: 'warning' as const };
      case 'completed':
        return { label: 'Completed', color: 'success' as const };
      case 'cancelled':
        return { label: 'Cancelled', color: 'error' as const };
      default:
        return { label: status, color: 'default' as const };
    }
  };

  // Show loading state while fetching appointment
  if (appointmentLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading appointment details...
          </Typography>
        </Box>
      </Container>
    );
  }

  // REMOVED: Tablet loading screen was causing UI to become unresponsive
  // The data loads quickly enough without blocking the UI
  // Keeping the useTransition hooks in loadSavedObservations prevents freezing

  // Show error if appointment not found
  if (appointmentError || !appointmentDetails) {
    const errorMessage = appointmentError
      ? `Error: ${JSON.stringify(appointmentError)}`
      : 'Appointment not found';

    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Failed to load appointment details</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {errorMessage}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Appointment ID: {appointmentId || 'Not provided'}
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/doctor/dashboard')}>
            Back to Dashboard
          </Button>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  const statusInfo = getStatusInfo(appointmentDetails.status);

  return (
    <Container maxWidth="xl" sx={{ py: 1.5 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => handleNavigateAway('/doctor/dashboard')}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Home fontSize="small" />
          Dashboard
        </Link>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => handleNavigateAway('/doctor/appointments')}
        >
          Appointments
        </Link>
        <Typography color="text.primary">Dental Consultation</Typography>
      </Breadcrumbs>

      {/* Compact Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Patient Name - Main Heading */}
            <Typography variant="h5" fontWeight="bold">
              {patientData.firstName}
            </Typography>
            <Chip
              label={statusInfo.label}
              color={statusInfo.color}
              size="small"
              icon={statusInfo.color === 'warning' ? <PlayArrow /> : statusInfo.color === 'success' ? <CheckCircle /> : undefined}
            />
            <Typography variant="body2" color="text.secondary">
              {patientData.mobileNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(appointmentDetails.appointment_date).toLocaleDateString()} • {appointmentDetails.appointment_time}
            </Typography>
            {dentalChart && (
              <Typography variant="caption" color="text.secondary">
                {dentalChart.dentition_type.toUpperCase()} | Obs: {dentalChart.total_observations} | Proc: {dentalChart.total_procedures}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Summary Button */}
            <Button
              variant="outlined"
              startIcon={<SummaryIcon />}
              onClick={() => setShowSummaryDialog(true)}
            >
              Summary
            </Button>

            {/* Prescription Button */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<ArticleIcon />}
              onClick={() => {
                setCreatedPrescriptionId(null);
                setShowPrescriptionDialog(true);
              }}
            >
              Prescription
            </Button>

            {/* Complete Visit Button */}
            {appointmentDetails.status !== 'completed' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={handleCompleteConsultation}
                disabled={isUpdatingStatus}
              >
                Complete Visit
              </Button>
            )}
          </Box>
        </Box>

      </Paper>

      {/* Main Content - FIXED layout (no resize on collapse) */}
      <Box
        sx={{
          display: 'grid',
          // Fixed columns - never change
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 500px',
          },
          gap: 2,
          bgcolor: alpha('#0050e0', 0.03),
          p: 2,
          borderRadius: 2,
          height: 'calc(100vh - 280px)',
        }}
      >
        {/* LEFT PANEL - Flexible width */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'auto',
            maxHeight: '100%',
          }}
        >
          {/* Anatomical Dental Chart - Realistic Curved View with Collapse */}
          <Box sx={{ flexShrink: 0 }}>
            <AnatomicalDentalChart
              dentitionType={dentalChart?.dentition_type || 'permanent'}
              teethData={teethDataRecord}
              selectedTeeth={newObservation.selectedTeeth}
              onToothClick={handleToothClickForNewObservation}
              multiSelect={true}
              allowCollapse={true}
              isCollapsed={chartCollapsed}
              onCollapseChange={setChartCollapsed}
            />
          </Box>

          {/* New Observation - Collapsible */}
          <Paper elevation={2} sx={{ flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                bgcolor: 'grey.50',
                borderBottom: observationFormCollapsed ? 'none' : '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
              onClick={() => setObservationFormCollapsed(!observationFormCollapsed)}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                + New Observation
              </Typography>
              <IconButton size="small">
                {observationFormCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </Box>
            <Collapse in={!observationFormCollapsed} timeout="auto">
              <NewObservationForm
                observation={newObservation}
                onUpdate={setNewObservation}
                onSave={handleSaveNewObservation}
                onClear={handleClearNewObservation}
                saving={savingObservations}
                isEditMode={isEditMode}
              />
            </Collapse>
          </Paper>
        </Box>

        {/* RIGHT PANEL - Fixed 500px width */}
        <Box
          sx={{
            overflow: 'auto',
            maxHeight: '100%',
          }}
        >
          <SavedObservationsPanel
            observations={observations.filter(o => o.isSaved)}
            onEditClick={handleOpenEditModal}
            onEditInPanel={handleEditInPanel}
            onRefresh={loadDentalChart}
            onUpdateProcedure={handleUpdateProcedure}
            onDeleteObservation={handleRequestDeleteObservation}
            editingObservationId={editingObservationId}
          />
        </Box>
      </Box>

      {/* Tooth History Dialog */}
      <Dialog
        open={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Tooth #{activeObservation?.selectedTeeth[0]} History
            </Typography>
            <IconButton onClick={() => setShowHistoryDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {activeObservation?.selectedTeeth[0] && (
            <ToothHistoryViewer
              patientMobileNumber={patientData.mobileNumber}
              patientFirstName={patientData.firstName}
              toothNumber={activeObservation.selectedTeeth[0]}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog
        open={showPrescriptionDialog}
        onClose={() => {
          setShowPrescriptionDialog(false);
          setCreatedPrescriptionId(null);
          setSelectedPrescriptionIndex(0);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle className="prescription-no-print">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {createdPrescriptionId ? 'View Prescription' : 'Create Prescription'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Patient: {patientData.firstName} ({patientData.mobileNumber})
              </Typography>
            </Box>
            <IconButton onClick={() => {
              setShowPrescriptionDialog(false);
              setCreatedPrescriptionId(null);
              setSelectedPrescriptionIndex(0);
            }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {createdPrescriptionId ? (
              <>
                {/* Tabs for multiple prescriptions */}
                {patientPrescriptions && patientPrescriptions.length > 1 && (
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }} className="prescription-no-print">
                    <Tabs
                      value={selectedPrescriptionIndex}
                      onChange={(_, newValue) => {
                        setSelectedPrescriptionIndex(newValue);
                        setCreatedPrescriptionId(patientPrescriptions[newValue]?.id || null);
                      }}
                      variant="scrollable"
                      scrollButtons="auto"
                    >
                      {patientPrescriptions.map((prescription, index) => (
                        <Tab
                          key={prescription.id}
                          label={
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="body2">
                                {prescription.prescription_number}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(prescription.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                          id={`prescription-tab-${index}`}
                          aria-controls={`prescription-tabpanel-${index}`}
                        />
                      ))}
                    </Tabs>
                  </Box>
                )}
                <PrescriptionViewer
                  prescriptionId={createdPrescriptionId}
                  onAddMore={() => setCreatedPrescriptionId(null)}
                  onEdit={() => {
                    toast.info('Edit functionality coming soon');
                  }}
                  refetch={refetchPrescriptions}
                />
              </>
            ) : (
              <>
                {isLoadingCurrentUser ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading doctor information...</Typography>
                  </Box>
                ) : !doctorId ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    Unable to load doctor information. Please log out and log back in.
                  </Alert>
                ) : (
                  appointmentDetails && (
                    <DentalPrescriptionBuilder
                      patientMobileNumber={patientData.mobileNumber}
                      patientFirstName={patientData.firstName}
                      patientUuid={appointmentDetails.patient_uuid}
                      appointmentId={appointmentId || ''}
                      doctorId={doctorId}
                      dentalNotes={dentalChart ? `Dental Consultation Summary:\n- Total Observations: ${dentalChart.total_observations}\n- Total Procedures: ${dentalChart.total_procedures}\n- Active Treatments: ${dentalChart.active_treatments}` : ''}
                      onSuccess={(prescriptionId) => {
                        setCreatedPrescriptionId(prescriptionId);
                        toast.success('Prescription created successfully!');
                        loadDentalChart(); // Reload chart
                        refetchPrescriptions(); // Reload prescriptions list
                      }}
                      onCancel={() => setShowPrescriptionDialog(false)}
                    />
                  )
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="prescription-no-print">
          <Button
            onClick={() => {
              setShowPrescriptionDialog(false);
              setCreatedPrescriptionId(null);
              setSelectedPrescriptionIndex(0);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Treatment Summary Dialog */}
      <Dialog
        open={showSummaryDialog}
        onClose={() => setShowSummaryDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Treatment Summary</Typography>
              <Typography variant="caption" color="text.secondary">
                Patient: {patientData.firstName} ({patientData.mobileNumber})
              </Typography>
            </Box>
            <IconButton onClick={() => setShowSummaryDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DentalSummaryTable
              patientMobileNumber={patientData.mobileNumber}
              patientFirstName={patientData.firstName}
              onRefresh={loadDentalChart}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummaryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Consultation Status</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Is this consultation completed?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If yes, the appointment will be marked as completed.
            If no, it will remain in progress for you to continue later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => handleExitDialogResponse(false)}
          >
            No, Still In Progress
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => handleExitDialogResponse(true)}
          >
            Yes, Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Confirmation Dialog */}
      <Dialog
        open={showEditConfirmDialog}
        onClose={handleCancelEdit}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Unsaved Changes</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You have an observation in progress that hasn't been saved.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you continue, the current observation data will be discarded and replaced with the selected observation for editing.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCancelEdit}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmEdit}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="error.main">Delete Observation?</Typography>
        </DialogTitle>
        <DialogContent>
          {editingObservationId === pendingDeleteObservationId ? (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This observation is currently being edited!
              </Alert>
              <Typography variant="body1" sx={{ mb: 1 }}>
                This observation is currently being edited. Are you sure you want to delete it?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The observation, all its procedures, and your current edits will be permanently deleted.
                The left panel will be cleared.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Are you sure you want to delete this observation?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The observation and all its procedures will be permanently deleted.
                This action cannot be undone.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCancelDelete}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Observation Modal - NEW */}
      <ObservationEditModal
        open={editModalOpen}
        observation={editingObservation}
        onClose={() => {
          setEditModalOpen(false);
          setEditingObservation(null);
        }}
        onSave={handleUpdateObservationFromModal}
        onDelete={handleDeleteObservationFromModal}
      />
    </Container>
  );
};

export default DentalConsultation;
