/**
 * TemplateNotesSelector Component
 * Displays matching observation note templates based on condition, surface, and severity
 * Supports multi-select with checkbox-style buttons
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  TextField,
  Checkbox,
  FormControlLabel,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  useGetMatchingTemplatesQuery,
  useCreateObservationTemplateMutation,
  DentalObservationTemplate,
} from '../../store/api';

interface TemplateNotesSelectorProps {
  conditionType: string;
  toothSurface?: string;
  severity?: string;
  selectedTemplateIds: string[];
  onTemplateSelect: (templateIds: string[]) => void;
  customNotes: string;
  onCustomNotesChange: (notes: string) => void;
  disabled?: boolean;
}

// Initial rows to show (multiple templates per row, wrapping to 2 rows)
const INITIAL_ROWS = 2;

export const TemplateNotesSelector: React.FC<TemplateNotesSelectorProps> = ({
  conditionType,
  toothSurface,
  severity,
  selectedTemplateIds,
  onTemplateSelect,
  customNotes,
  onCustomNotesChange,
  disabled = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateGlobal, setNewTemplateGlobal] = useState(false);
  const [newTemplateShortCode, setNewTemplateShortCode] = useState('');

  // Fetch matching templates
  const { data: templatesData, isLoading, refetch } = useGetMatchingTemplatesQuery(
    { condition_type: conditionType, tooth_surface: toothSurface, severity },
    { skip: !conditionType }
  );

  const [createTemplate, { isLoading: isCreating }] = useCreateObservationTemplateMutation();

  const templates = templatesData?.templates || [];

  // Auto-filter templates based on condition, surface, and severity (automatic filtering)
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // If template has specific criteria, it must match
      const conditionMatch = !template.condition_type || template.condition_type === conditionType;
      const surfaceMatch = !template.tooth_surface || !toothSurface || template.tooth_surface === toothSurface;
      const severityMatch = !template.severity || !severity || template.severity === severity;

      return conditionMatch && surfaceMatch && severityMatch;
    });
  }, [templates, conditionType, toothSurface, severity]);

  // Estimate templates per row (responsive calculation)
  const TEMPLATES_PER_ROW = 3; // Approximate, will wrap naturally

  // Templates to display based on showAll
  const visibleTemplates = useMemo(() => {
    if (showAll) return filteredTemplates;
    // Show approximately INITIAL_ROWS worth of templates
    return filteredTemplates.slice(0, INITIAL_ROWS * TEMPLATES_PER_ROW);
  }, [filteredTemplates, showAll]);

  const hasMore = filteredTemplates.length > INITIAL_ROWS * TEMPLATES_PER_ROW;

  // Toggle template selection
  const handleToggleTemplate = (templateId: string) => {
    if (disabled) return;

    const isSelected = selectedTemplateIds.includes(templateId);
    if (isSelected) {
      onTemplateSelect(selectedTemplateIds.filter(id => id !== templateId));
    } else {
      onTemplateSelect([...selectedTemplateIds, templateId]);
    }
  };

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplateText.trim()) return;

    try {
      await createTemplate({
        condition_type: conditionType || undefined,
        tooth_surface: toothSurface || undefined,
        severity: severity || undefined,
        template_text: newTemplateText.trim(),
        short_code: newTemplateShortCode.trim() || undefined,
        is_global: newTemplateGlobal,
      }).unwrap();

      // Reset form and refresh
      setNewTemplateText('');
      setNewTemplateShortCode('');
      setNewTemplateGlobal(false);
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  // Get match indicator based on score
  const getMatchColor = (template: DentalObservationTemplate): 'success' | 'info' | 'default' => {
    const score = template.match_score || 0;
    if (score === 3) return 'success';
    if (score === 2) return 'info';
    return 'default';
  };

  const getMatchLabel = (template: DentalObservationTemplate): string => {
    const score = template.match_score || 0;
    if (score === 3) return 'Exact';
    if (score === 2) return 'Good';
    return 'General';
  };

  if (!conditionType) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
        Select a condition to see quick notes templates
      </Typography>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={500}>
          Quick Notes Templates
        </Typography>
        <Button
          size="small"
          startIcon={showCreateForm ? <CloseIcon /> : <AddIcon />}
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={disabled}
          sx={{
            textTransform: 'none',
            fontSize: '0.7rem',
            minHeight: 28,
            px: 1.5,
            borderRadius: 1.5,
            border: '1px solid #667eea',
            color: '#667eea',
            bgcolor: 'white',
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.08)',
              borderColor: '#5568d3',
            },
          }}
        >
          {showCreateForm ? 'Cancel' : 'New'}
        </Button>
      </Box>

      {/* Create Template Form */}
      <Collapse in={showCreateForm}>
        <Box sx={{ bgcolor: 'info.50', border: 1, borderColor: 'info.200', borderRadius: 1, p: 1.5, mb: 1.5 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            value={newTemplateText}
            onChange={(e) => setNewTemplateText(e.target.value)}
            placeholder="Enter template note text..."
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <TextField
              size="small"
              value={newTemplateShortCode}
              onChange={(e) => setNewTemplateShortCode(e.target.value.toUpperCase())}
              placeholder="Short code"
              inputProps={{ maxLength: 20 }}
              sx={{ width: 120 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={newTemplateGlobal}
                  onChange={(e) => setNewTemplateGlobal(e.target.checked)}
                />
              }
              label={<Typography variant="caption">Make Global</Typography>}
            />
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleCreateTemplate}
            disabled={!newTemplateText.trim() || isCreating}
            sx={{ textTransform: 'none', fontSize: '0.7rem' }}
          >
            {isCreating ? 'Saving...' : 'Save Template'}
          </Button>
        </Box>
      </Collapse>

      {/* Templates List - Scrollable Container */}
      <Box
        sx={{
          maxHeight: showAll ? 400 : 'auto',
          overflowY: showAll ? 'auto' : 'visible',
          overflowX: 'hidden',
          mb: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 10,
            '&:hover': {
              background: 'linear-gradient(180deg, #5568d3 0%, #66348a 100%)',
            },
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">Loading templates...</Typography>
          </Box>
        ) : filteredTemplates.length === 0 ? (
          <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
            {templates.length === 0
              ? `No templates for "${conditionType}". Create one above!`
              : 'No matching templates for selected options. Clear filters or create a new one!'}
          </Typography>
        ) : (
          <Box>
            {/* Grid Layout - Multiple per row, wrapping to 2 rows initially */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                mb: 1,
              }}
            >
              {visibleTemplates.map((template) => {
                const isSelected = selectedTemplateIds.includes(template.id);

                return (
                  <Box
                    key={template.id}
                    onClick={() => handleToggleTemplate(template.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.75,
                      p: 1,
                      border: 2,
                      borderRadius: 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1,
                      borderColor: isSelected ? '#667eea' : 'divider',
                      bgcolor: isSelected ? 'rgba(102, 126, 234, 0.08)' : 'white',
                      minWidth: { xs: '100%', sm: 'calc(50% - 6px)', md: 'calc(33.333% - 8px)' },
                      flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 6px)', md: '1 1 calc(33.333% - 8px)' },
                      maxWidth: { xs: '100%', sm: 'calc(50% - 6px)', md: 'calc(33.333% - 8px)' },
                      '&:hover': {
                        borderColor: disabled ? 'divider' : '#667eea',
                        bgcolor: disabled ? 'white' : (isSelected ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.03)'),
                        boxShadow: disabled ? 'none' : '0 2px 8px rgba(102, 126, 234, 0.15)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      disabled={disabled}
                      sx={{
                        p: 0,
                        mt: 0.25,
                        color: '#667eea',
                        '&.Mui-checked': {
                          color: '#667eea',
                        },
                      }}
                    />

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Tags row */}
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                        {template.short_code && (
                          <Chip
                            label={template.short_code}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              fontFamily: 'monospace',
                              borderColor: '#667eea',
                              color: '#667eea',
                            }}
                          />
                        )}
                        <Chip
                          label={getMatchLabel(template)}
                          size="small"
                          color={getMatchColor(template)}
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }}
                        />
                        {template.is_global && (
                          <Chip
                            label="Global"
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              borderColor: '#764ba2',
                              color: '#764ba2',
                            }}
                          />
                        )}
                      </Box>

                      {/* Template text - limited to 2 lines */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: 'text.primary',
                        }}
                      >
                        {template.template_text}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Show More/Less */}
            {hasMore && (
              <Button
                size="small"
                onClick={() => setShowAll(!showAll)}
                endIcon={showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  alignSelf: 'center',
                  display: 'block',
                  margin: '0 auto',
                  color: '#667eea',
                  minHeight: 32,
                  px: 2,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.08)',
                  },
                }}
              >
                {showAll ? 'Show Less' : `Show ${filteredTemplates.length - (INITIAL_ROWS * TEMPLATES_PER_ROW)} More`}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Selected count */}
      {selectedTemplateIds.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: 'primary.main' }} />
          <Typography variant="caption" color="primary.main" fontWeight={500}>
            {selectedTemplateIds.length} template{selectedTemplateIds.length > 1 ? 's' : ''} selected
          </Typography>
        </Box>
      )}

      {/* Custom Notes */}
      <TextField
        fullWidth
        multiline
        rows={2}
        size="small"
        label="Additional Notes"
        value={customNotes}
        onChange={(e) => onCustomNotesChange(e.target.value)}
        placeholder="Add any additional observations..."
        disabled={disabled}
        sx={{ mt: 1.5 }}
      />
    </Box>
  );
};

export default TemplateNotesSelector;
