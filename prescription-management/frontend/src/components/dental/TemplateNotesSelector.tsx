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

const INITIAL_VISIBLE_COUNT = 4;

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

  // Templates to display based on showAll
  const visibleTemplates = useMemo(() => {
    if (showAll) return templates;
    return templates.slice(0, INITIAL_VISIBLE_COUNT);
  }, [templates, showAll]);

  const hasMore = templates.length > INITIAL_VISIBLE_COUNT;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={500}>
          Quick Notes Templates
        </Typography>
        <Button
          size="small"
          startIcon={showCreateForm ? <CloseIcon /> : <AddIcon />}
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={disabled}
          sx={{ textTransform: 'none', fontSize: '0.7rem' }}
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

      {/* Templates List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">Loading templates...</Typography>
        </Box>
      ) : templates.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ py: 1 }}>
          No templates for "{conditionType}". Create one above!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {visibleTemplates.map((template) => {
            const isSelected = selectedTemplateIds.includes(template.id);

            return (
              <Box
                key={template.id}
                onClick={() => handleToggleTemplate(template.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  p: 1,
                  border: 2,
                  borderRadius: 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  '&:hover': {
                    borderColor: disabled ? 'divider' : 'primary.light',
                    bgcolor: disabled ? 'background.paper' : (isSelected ? 'primary.50' : 'grey.50'),
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Checkbox */}
                <Checkbox
                  size="small"
                  checked={isSelected}
                  disabled={disabled}
                  sx={{ p: 0, mt: 0.25 }}
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
                        sx={{ height: 18, fontSize: '0.6rem', fontFamily: 'monospace' }}
                      />
                    )}
                    <Chip
                      label={getMatchLabel(template)}
                      size="small"
                      color={getMatchColor(template)}
                      sx={{ height: 18, fontSize: '0.6rem' }}
                    />
                    {template.is_global && (
                      <Chip
                        label="Global"
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>

                  {/* Template text */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {template.template_text}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {/* Show More/Less */}
          {hasMore && (
            <Button
              size="small"
              onClick={() => setShowAll(!showAll)}
              endIcon={showAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: 'none', fontSize: '0.7rem', alignSelf: 'center' }}
            >
              {showAll ? 'Show Less' : `Show ${templates.length - INITIAL_VISIBLE_COUNT} More`}
            </Button>
          )}
        </Box>
      )}

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
