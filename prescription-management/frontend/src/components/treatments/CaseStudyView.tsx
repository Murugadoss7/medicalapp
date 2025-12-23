/**
 * Case Study View - Main component for case study feature
 * Shows treatment journey grouped by tooth with timeline
 * Allows selection of visits and images for AI case study generation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Print as PrintIcon,
  Image as ImageIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import dentalService from '../../services/dentalService';
import { groupByTooth, ToothTreatmentGroup, sortToothNumbers } from '../../utils/caseStudyHelpers';
import ToothFilterBar from './ToothFilterBar';
import ToothTreatmentCard from './ToothTreatmentCard';
import { useToast } from '../common/Toast';
import { useGenerateCaseStudyMutation, useGetPatientCaseStudiesQuery, useGetCaseStudyQuery } from '../../store/api';

interface CaseStudyViewProps {
  patientMobile: string;
  patientFirstName: string;
}

const CaseStudyView: React.FC<CaseStudyViewProps> = ({
  patientMobile,
  patientFirstName,
}) => {
  // Hooks
  const toast = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [toothGroups, setToothGroups] = useState<Map<string, ToothTreatmentGroup>>(new Map());
  const [selectedTooth, setSelectedTooth] = useState<string>('all');
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // AI Generation state
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['full_narrative']));

  // RTK Query mutation
  const [generateCaseStudy, { isLoading: generating }] = useGenerateCaseStudyMutation();

  // RTK Query for saved case studies
  const { data: savedCaseStudies, refetch: refetchCaseStudies } = useGetPatientCaseStudiesQuery({
    mobile: patientMobile,
    firstName: patientFirstName,
  });

  // State for viewing saved case study
  const [viewingCaseStudyId, setViewingCaseStudyId] = useState<string | null>(null);
  const { data: viewedCaseStudy } = useGetCaseStudyQuery(viewingCaseStudyId || '', {
    skip: !viewingCaseStudyId,
  });

  // Load data on mount
  useEffect(() => {
    loadCaseStudyData();
  }, [patientMobile, patientFirstName]);

  /**
   * Load all data for case study
   */
  const loadCaseStudyData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [obsData, procData, attData] = await Promise.all([
        dentalService.observations.getPatientObservations(patientMobile, patientFirstName),
        dentalService.procedures.getPatientProcedures(patientMobile, patientFirstName),
        dentalService.attachments.getPatientAttachments(patientMobile, patientFirstName),
      ]);

      // Extract arrays from response (some endpoints return {observations: [], total: X})
      const observationsList = obsData?.observations || obsData || [];
      const proceduresList = procData?.upcoming || procData?.completed || procData || [];
      const attachmentsList = attData || [];

      setObservations(observationsList);
      setProcedures(
        Array.isArray(proceduresList)
          ? proceduresList
          : [...(proceduresList?.upcoming || []), ...(proceduresList?.completed || [])]
      );
      setAttachments(attachmentsList);

      // Group by tooth
      const groups = groupByTooth(observationsList,
        Array.isArray(proceduresList)
          ? proceduresList
          : [...(proceduresList?.upcoming || []), ...(proceduresList?.completed || [])],
        attachmentsList
      );
      setToothGroups(groups);

    } catch (error: any) {
      console.error('Failed to load case study data:', error);
      toast.error('Failed to load case study data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle tooth filter change
   */
  const handleToothChange = (tooth: string) => {
    setSelectedTooth(tooth);
  };

  /**
   * Toggle visit selection
   */
  const handleToggleVisit = (visitId: string) => {
    setSelectedVisits(prev => {
      const next = new Set(prev);
      if (next.has(visitId)) {
        next.delete(visitId);
        // Also deselect all images in this visit
        const visit = findVisitById(visitId);
        if (visit) {
          visit.attachments.forEach(att => {
            selectedImages.delete(att.id);
          });
          setSelectedImages(new Set(selectedImages));
        }
      } else {
        next.add(visitId);
      }
      return next;
    });
  };

  /**
   * Toggle image selection
   */
  const handleToggleImage = (imageId: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  /**
   * Select all visits and images for a tooth
   */
  const handleSelectAllForTooth = (toothNumber: string) => {
    const group = toothGroups.get(toothNumber);
    if (!group) return;

    // Add all visit IDs
    const newSelectedVisits = new Set(selectedVisits);
    const newSelectedImages = new Set(selectedImages);

    group.visits.forEach(visit => {
      newSelectedVisits.add(visit.visitId);
      visit.attachments.forEach(att => {
        newSelectedImages.add(att.id);
      });
    });

    setSelectedVisits(newSelectedVisits);
    setSelectedImages(newSelectedImages);
  };

  /**
   * Deselect all visits and images for a tooth
   */
  const handleDeselectAllForTooth = (toothNumber: string) => {
    const group = toothGroups.get(toothNumber);
    if (!group) return;

    const newSelectedVisits = new Set(selectedVisits);
    const newSelectedImages = new Set(selectedImages);

    group.visits.forEach(visit => {
      newSelectedVisits.delete(visit.visitId);
      visit.attachments.forEach(att => {
        newSelectedImages.delete(att.id);
      });
    });

    setSelectedVisits(newSelectedVisits);
    setSelectedImages(newSelectedImages);
  };

  /**
   * Find visit by ID across all groups
   */
  const findVisitById = (visitId: string) => {
    for (const group of toothGroups.values()) {
      const visit = group.visits.find(v => v.visitId === visitId);
      if (visit) return visit;
    }
    return null;
  };

  /**
   * Get observation and procedure IDs from selected visits
   */
  const getSelectedIds = () => {
    const observationIds: string[] = [];
    const procedureIds: string[] = [];

    selectedVisits.forEach(visitId => {
      const visit = findVisitById(visitId);
      if (visit) {
        visit.observations.forEach((obs: any) => {
          if (obs.id && !observationIds.includes(obs.id)) {
            observationIds.push(obs.id);
          }
        });
        visit.procedures.forEach((proc: any) => {
          if (proc.id && !procedureIds.includes(proc.id)) {
            procedureIds.push(proc.id);
          }
        });
      }
    });

    return { observationIds, procedureIds };
  };

  /**
   * Generate case study using AI
   */
  const handleGenerateCaseStudy = async () => {
    if (selectedVisits.size === 0) {
      toast.error('Please select at least one visit');
      return;
    }

    const { observationIds, procedureIds } = getSelectedIds();

    if (observationIds.length === 0 && procedureIds.length === 0) {
      toast.error('No valid observations or procedures selected');
      return;
    }

    try {
      const result = await generateCaseStudy({
        patient_mobile_number: patientMobile,
        patient_first_name: patientFirstName,
        observation_ids: observationIds,
        procedure_ids: procedureIds,
      }).unwrap();

      setGeneratedCaseStudy(result);
      setShowResultDialog(true);
      toast.success('Case study generated successfully!');
      // Refetch saved case studies list
      refetchCaseStudies();
    } catch (error: any) {
      console.error('Failed to generate case study:', error);
      const errorMessage = error?.data?.detail || 'Failed to generate case study';
      toast.error(errorMessage);
    }
  };

  /**
   * View a saved case study - fetch full content
   */
  const handleViewCaseStudy = async (caseStudyId: string) => {
    setViewingCaseStudyId(caseStudyId);
  };

  // Effect to show viewed case study when data is fetched
  useEffect(() => {
    if (viewedCaseStudy && viewingCaseStudyId) {
      setGeneratedCaseStudy({
        ...viewedCaseStudy,
        content: {
          pre_treatment_summary: viewedCaseStudy.pre_treatment_summary,
          initial_diagnosis: viewedCaseStudy.initial_diagnosis,
          treatment_goals: viewedCaseStudy.treatment_goals,
          treatment_summary: viewedCaseStudy.treatment_summary,
          procedures_performed: viewedCaseStudy.procedures_performed,
          outcome_summary: viewedCaseStudy.outcome_summary,
          success_metrics: viewedCaseStudy.success_metrics,
          full_narrative: viewedCaseStudy.full_narrative,
        },
        metadata: {
          model: viewedCaseStudy.generation_model,
        },
        attachments: viewedCaseStudy.attachments || [],
      });
      setShowResultDialog(true);
      setViewingCaseStudyId(null); // Reset
    }
  }, [viewedCaseStudy, viewingCaseStudyId]);

  /**
   * Delete a case study
   */
  const handleDeleteCaseStudy = async (caseStudyId: string, caseStudyNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete Case Study #${caseStudyNumber}?`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/v1/case-studies/${caseStudyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        toast.success('Case study deleted');
        refetchCaseStudies();
      } else {
        toast.error('Failed to delete case study');
      }
    } catch (error) {
      toast.error('Failed to delete case study');
    }
  };

  /**
   * Toggle section expansion in result dialog
   */
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  /**
   * Get filtered groups based on selected tooth
   */
  const filteredGroups = selectedTooth === 'all'
    ? Array.from(toothGroups.values())
    : toothGroups.has(selectedTooth)
      ? [toothGroups.get(selectedTooth)!]
      : [];

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Empty state - no data
  if (toothGroups.size === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          📁 No Treatment Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This patient has no dental observations or procedures yet.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Create observations and procedures in the Dental Consultation page
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}> {/* Extra padding for sticky footer */}
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Case Study - Treatment Journey
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select visits and images to include in the AI-generated case study
        </Typography>
      </Box>

      {/* Info alert */}
      {selectedVisits.size === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select visits by clicking the checkboxes. Choose specific images by clicking on thumbnails.
        </Alert>
      )}

      {/* Tooth filter */}
      <ToothFilterBar
        availableTeeth={Array.from(toothGroups.keys())}
        selectedTooth={selectedTooth}
        onToothChange={handleToothChange}
      />

      {/* Treatment cards */}
      {filteredGroups.length > 0 ? (
        filteredGroups.map(group => (
          <ToothTreatmentCard
            key={group.toothNumber}
            group={group}
            selectedVisits={selectedVisits}
            selectedImages={selectedImages}
            onToggleVisit={handleToggleVisit}
            onToggleImage={handleToggleImage}
            onSelectAll={() => handleSelectAllForTooth(group.toothNumber)}
            onDeselectAll={() => handleDeselectAllForTooth(group.toothNumber)}
          />
        ))
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No treatment data for Tooth {selectedTooth}
          </Typography>
        </Box>
      )}

      {/* Saved Case Studies Section */}
      {savedCaseStudies?.case_studies?.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 4, mb: 3, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HistoryIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Saved Case Studies ({savedCaseStudies.total})
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {savedCaseStudies.case_studies.map((cs: any) => (
              <Paper
                key={cs.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {cs.title || `Case Study #${cs.case_study_number}`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={cs.case_study_number}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      size="small"
                      label={new Date(cs.created_at).toLocaleDateString()}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      size="small"
                      label={cs.status}
                      color={cs.status === 'finalized' ? 'success' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewCaseStudy(cs.id)}
                    title="View Case Study"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCaseStudy(cs.id, cs.case_study_number)}
                    title="Delete Case Study"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}

      {/* Sticky bottom action bar */}
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: 2,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          zIndex: 1100,
        }}
      >
        {/* Selection summary */}
        <Box>
          <Typography variant="body1" fontWeight={600}>
            Selected for Case Study:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedVisits.size} visit(s) • {selectedImages.size} image(s)
          </Typography>
        </Box>

        {/* Generate button */}
        <Button
          variant="contained"
          size="large"
          startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
          disabled={generating || selectedVisits.size === 0}
          onClick={handleGenerateCaseStudy}
          sx={{
            minHeight: 48, // iPad-friendly
            px: 3,
          }}
        >
          {generating ? 'Generating...' : 'Generate Case Study with AI'}
        </Button>
      </Paper>

      {/* Result Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="span">
              Generated Case Study
            </Typography>
            {generatedCaseStudy?.metadata && (
              <Chip
                size="small"
                label={`${generatedCaseStudy.metadata.total_tokens} tokens • $${generatedCaseStudy.metadata.estimated_cost_usd}`}
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          <IconButton onClick={() => setShowResultDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {generatedCaseStudy?.content && (
            <Box>
              {/* Title */}
              <Typography variant="h6" gutterBottom color="primary">
                {generatedCaseStudy.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3 }}>
                Case Study #{generatedCaseStudy.case_study_number}
              </Typography>

              {/* Sections */}
              {[
                { key: 'full_narrative', label: 'Full Case Study Narrative' },
                { key: 'pre_treatment_summary', label: 'Pre-Treatment Summary' },
                { key: 'initial_diagnosis', label: 'Initial Diagnosis' },
                { key: 'treatment_goals', label: 'Treatment Goals' },
                { key: 'treatment_summary', label: 'Treatment Summary' },
                { key: 'procedures_performed', label: 'Procedures Performed' },
                { key: 'outcome_summary', label: 'Outcome Summary' },
                { key: 'success_metrics', label: 'Success Metrics' },
              ].map(({ key, label }) => (
                generatedCaseStudy.content[key] && (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Button
                      fullWidth
                      onClick={() => toggleSection(key)}
                      sx={{
                        justifyContent: 'space-between',
                        textTransform: 'none',
                        bgcolor: 'grey.100',
                        '&:hover': { bgcolor: 'grey.200' },
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {label}
                      </Typography>
                      {expandedSections.has(key) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Button>
                    <Collapse in={expandedSections.has(key)}>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: 'pre-wrap' }}
                        >
                          {generatedCaseStudy.content[key]}
                        </Typography>
                      </Paper>
                    </Collapse>
                  </Box>
                )
              ))}

              {/* Attachments Section */}
              {generatedCaseStudy.attachments && generatedCaseStudy.attachments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ImageIcon fontSize="small" />
                    Linked Images ({generatedCaseStudy.attachments.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {generatedCaseStudy.attachments.map((att: any) => (
                      <Paper key={att.id} variant="outlined" sx={{ p: 1, width: 150 }}>
                        <Box
                          component="img"
                          src={att.file_path}
                          alt={att.caption || att.file_name}
                          sx={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 1 }}
                          onError={(e: any) => { e.target.style.display = 'none'; }}
                        />
                        <Typography variant="caption" display="block" noWrap>
                          {att.file_type}
                        </Typography>
                        {att.taken_date && (
                          <Typography variant="caption" color="text.secondary">
                            {att.taken_date}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Generated with {generatedCaseStudy?.metadata?.model || 'AI'} • Saved as #{generatedCaseStudy?.case_study_number}
          </Typography>
          <Button onClick={() => setShowResultDialog(false)}>
            Close
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => {
              // Create print-friendly content using DOM manipulation
              const printWindow = window.open('', '_blank');
              if (printWindow) {
                const doc = printWindow.document;
                doc.open();

                // Create HTML structure safely
                const html = doc.createElement('html');
                const head = doc.createElement('head');
                const title = doc.createElement('title');
                title.textContent = `Case Study - ${generatedCaseStudy?.case_study_number || 'Report'}`;
                head.appendChild(title);

                const style = doc.createElement('style');
                style.textContent = `
                  body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                  h1 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
                  .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
                  .section { margin-bottom: 25px; }
                  .section-title { background: #f5f5f5; padding: 8px 12px; font-weight: bold; }
                  .section-content { padding: 12px; border-left: 3px solid #1976d2; margin-top: 8px; white-space: pre-wrap; }
                `;
                head.appendChild(style);
                html.appendChild(head);

                const body = doc.createElement('body');

                const h1 = doc.createElement('h1');
                h1.textContent = generatedCaseStudy?.title || 'Case Study';
                body.appendChild(h1);

                const meta = doc.createElement('div');
                meta.className = 'meta';
                meta.textContent = `Case Study #${generatedCaseStudy?.case_study_number} | Generated: ${new Date(generatedCaseStudy?.created_at).toLocaleString()}`;
                body.appendChild(meta);

                // Add sections
                const sections = [
                  { key: 'full_narrative', label: 'Case Study Narrative' },
                  { key: 'pre_treatment_summary', label: 'Pre-Treatment Summary' },
                  { key: 'initial_diagnosis', label: 'Initial Diagnosis' },
                  { key: 'treatment_summary', label: 'Treatment Summary' },
                  { key: 'outcome_summary', label: 'Outcome Summary' },
                ];

                sections.forEach(({ key, label }) => {
                  const content = generatedCaseStudy?.content?.[key];
                  if (content) {
                    const section = doc.createElement('div');
                    section.className = 'section';

                    const sectionTitle = doc.createElement('div');
                    sectionTitle.className = 'section-title';
                    sectionTitle.textContent = label;
                    section.appendChild(sectionTitle);

                    const sectionContent = doc.createElement('div');
                    sectionContent.className = 'section-content';
                    sectionContent.textContent = content;
                    section.appendChild(sectionContent);

                    body.appendChild(section);
                  }
                });

                // Add images section if attachments exist
                if (generatedCaseStudy?.attachments?.length > 0) {
                  const imagesSection = doc.createElement('div');
                  imagesSection.className = 'section';

                  const imagesTitle = doc.createElement('div');
                  imagesTitle.className = 'section-title';
                  imagesTitle.textContent = 'Clinical Images';
                  imagesSection.appendChild(imagesTitle);

                  const imagesContainer = doc.createElement('div');
                  imagesContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 16px; padding: 12px;';

                  generatedCaseStudy.attachments.forEach((att: any) => {
                    const imgWrapper = doc.createElement('div');
                    imgWrapper.style.cssText = 'text-align: center; width: 200px;';

                    const img = doc.createElement('img');
                    img.src = att.file_path;
                    img.alt = att.caption || att.file_name;
                    img.style.cssText = 'max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;';
                    imgWrapper.appendChild(img);

                    const caption = doc.createElement('div');
                    caption.style.cssText = 'font-size: 12px; color: #666; margin-top: 4px;';
                    caption.textContent = `${att.file_type}${att.taken_date ? ' - ' + att.taken_date : ''}`;
                    imgWrapper.appendChild(caption);

                    imagesContainer.appendChild(imgWrapper);
                  });

                  imagesSection.appendChild(imagesContainer);
                  body.appendChild(imagesSection);
                }

                html.appendChild(body);
                doc.appendChild(html);
                doc.close();
                printWindow.print();
              }
            }}
          >
            Print / Save PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseStudyView;
