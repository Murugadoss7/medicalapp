/**
 * Dental Components
 * Export all dental-related components
 */

// Core components (still in use)
export { default as ToothHistoryViewer } from './ToothHistoryViewer';
export { default as DentalPrescriptionBuilder } from './DentalPrescriptionBuilder';
export { default as DentalSummaryTable } from './DentalSummaryTable';
export { default as ObservationRow } from './ObservationRow';
export type { ObservationData, ProcedureData } from './ObservationRow';

// New redesigned components (current implementation)
export { default as NewObservationForm } from './NewObservationForm';
export { default as SavedObservationsPanel } from './SavedObservationsPanel';
export { default as ObservationEditModal } from './ObservationEditModal';
export { default as AnatomicalDentalChart } from './AnatomicalDentalChart';
export { default as TemplateNotesSelector } from './TemplateNotesSelector';

// Note: Old components moved to _backup folder:
// - DentalChart.tsx (replaced by AnatomicalDentalChart)
// - DentalObservationForm.tsx (replaced by NewObservationForm)
// - DentalProcedureForm.tsx (replaced by NewObservationForm with built-in procedure handling)
