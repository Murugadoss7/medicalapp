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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarOpen, setAppointmentsSidebarOpen } from '../../store/slices/uiSlice';
import { type RootState } from '../../store';
import {
  DentalChart,
  ToothHistoryViewer,
  DentalPrescriptionBuilder,
  DentalSummaryTable,
  ObservationRow,
  type ObservationData,
} from '../../components/dental';
import PrescriptionViewer from '../../components/dental/PrescriptionViewer';

// Simple ID generator (replaces uuid)
const generateId = () => `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  // Refs for scrolling observations into view
  const observationContainerRef = useRef<HTMLDivElement>(null);
  const observationRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    procedureCode: '',
    procedureName: '',
    customProcedureName: '',
    procedureDate: new Date(),
    procedureNotes: '',
    procedureStatus: 'planned',
  });

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
                  procedureStatus: 'planned',
                  isSaved: true,
                  // CRITICAL: Track backend observation IDs for updates
                  backendObservationIds: {
                    [obs.tooth_number]: obs.id
                  },
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

                if (hasMatchingTeeth && !obsGroup.hasProcedure) {
                  obsGroup.hasProcedure = true;
                  obsGroup.procedureCode = proc.procedure_code;
                  obsGroup.procedureName = proc.procedure_name;
                  obsGroup.procedureDate = proc.procedure_date ? new Date(proc.procedure_date) : new Date();
                  obsGroup.procedureNotes = proc.procedure_notes || '';
                  obsGroup.procedureStatus = proc.status || 'planned';  // Load status from backend
                  obsGroup.backendProcedureId = proc.id; // CRITICAL: Track backend procedure ID
                  if (proc.procedure_code === 'CUSTOM') {
                    obsGroup.customProcedureName = proc.procedure_name;
                  }
                  break;
                }
              }
            });

            // Handle procedures without matching observations (standalone procedures)
            procedures.forEach((proc, index) => {
              const procTeeth = proc.tooth_numbers?.split(',') || [];
              const hasMatchingObs = Object.values(groupedObs).some(obs =>
                obs.hasProcedure && obs.procedureCode === proc.procedure_code
              );

              if (!hasMatchingObs) {
                // Create a standalone observation row for this procedure
                const key = `proc_${proc.id}`;
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
                  procedureStatus: proc.status || 'planned',  // Load status from backend
                  isSaved: true,
                  backendProcedureId: proc.id, // CRITICAL: Track backend procedure ID
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
              status: obs.procedureStatus || 'planned',  // Save user-selected status
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
              status: obs.procedureStatus || 'planned',  // Save user-selected status
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
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
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
            {/* Complete Consultation Button */}
            {appointmentDetails.status !== 'completed' && (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircle />}
                onClick={handleCompleteConsultation}
                disabled={isUpdatingStatus}
                sx={{ minWidth: 200 }}
              >
                {isUpdatingStatus ? 'Updating...' : 'Complete Consultation'}
              </Button>
            )}

            {/* Prescription buttons */}
            {patientPrescriptions && patientPrescriptions.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Show the most recent prescription in dialog with tabs
                  const latestPrescription = patientPrescriptions[0];
                  if (latestPrescription?.id) {
                    setSelectedPrescriptionIndex(0); // Start with first (latest) prescription
                    setCreatedPrescriptionId(latestPrescription.id);
                    setShowPrescriptionDialog(true);
                  }
                }}
              >
                View Prescription{patientPrescriptions.length > 1 ? `s (${patientPrescriptions.length})` : ''}
              </Button>
            )}
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setCreatedPrescriptionId(null);
                setShowPrescriptionDialog(true);
              }}
            >
              {patientPrescriptions && patientPrescriptions.length > 0 ? 'Create New' : 'Create Prescription'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<SummaryIcon />}
              onClick={() => setShowSummaryDialog(true)}
            >
              Treatment Summary
            </Button>
          </Box>
        </Box>

      </Paper>

      {/* Main Content - Side-by-side layout optimized for iPad */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1, sm: 1 },
          // Row layout on tablet and above, column only on mobile
          flexDirection: { xs: 'column', sm: 'row' },
          minHeight: { xs: 'auto', sm: 'calc(100vh - 240px)' },
          overflow: 'visible',
        }}
      >
        {/* Left Side: Dental Chart - 55% on tablet, 60-65% on desktop */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', sm: '0 0 55%', lg: isSidebarOpen ? '0 0 60%' : '0 0 65%' },
            minWidth: 0,
            overflow: 'visible',
            transition: 'flex 0.3s ease',
          }}
        >
          <DentalChart
            dentitionType={dentalChart?.dentition_type || 'permanent'}
            teethData={toothData}
            multiSelect={true}
            selectedTeeth={selectedTeethForChart}
            onTeethSelect={handleTeethSelect}
            onToothClick={handleToothClick}
          />

          {/* View History Button - below chart */}
          {activeObservation && activeObservation.selectedTeeth.length === 1 && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={handleViewHistory}
                size="small"
              >
                View Tooth #{activeObservation.selectedTeeth[0]} History
              </Button>
            </Box>
          )}
        </Box>

        {/* Right Side: Observation Panel - 45% on tablet, 35-40% on desktop */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', sm: '1 1 45%', lg: isSidebarOpen ? '1 1 40%' : '1 1 35%' },
            minWidth: 0,
            transition: 'flex 0.3s ease',
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1, sm: 1.5 },
              height: { xs: 'auto', sm: 'calc(100vh - 240px)' },
              maxHeight: { xs: 400, sm: 'none' },
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              top: 8,
            }}
          >
            {/* Panel Header with Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">
                  Observations
                </Typography>
                <Chip
                  label={`${observations.length} ${activeObservationId ? '▼' : '▶'}`}
                  size="small"
                  color={activeObservationId ? 'primary' : 'default'}
                  variant={activeObservationId ? 'filled' : 'outlined'}
                  onClick={() => setActiveObservationId(activeObservationId ? null : observations[0]?.id || null)}
                  title={activeObservationId ? 'Click to collapse all' : 'Click to expand first'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: activeObservationId ? 'primary.dark' : 'action.hover',
                    },
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddObservationRow}
                  size="small"
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAllObservations}
                  disabled={savingObservations || observations.every(o => o.selectedTeeth.length === 0)}
                  size="small"
                >
                  {savingObservations ? 'Saving...' : 'Save All'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* Observation Rows - Scrollable with fixed height */}
            <Box ref={observationContainerRef} sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
              {observations.map((obs, index) => (
                <div
                  key={obs.id}
                  ref={(el) => { observationRefs.current[obs.id] = el; }}
                >
                  <ObservationRow
                    observation={obs}
                    index={index}
                    isActive={obs.id === activeObservationId}
                    onUpdate={handleUpdateObservation}
                    onDelete={handleDeleteObservation}
                    onSetActive={handleSetActiveObservation}
                    onEdit={handleEditObservation}
                  />
                </div>
              ))}
            </Box>
          </Paper>
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
    </Container>
  );
};

export default DentalConsultation;
