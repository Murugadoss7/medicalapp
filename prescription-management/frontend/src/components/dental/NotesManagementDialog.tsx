/**
 * NotesManagementDialog Component
 * Full-screen dialog to view, edit, and delete all dental observation note templates
 * Follows Medical Futurism design system - iPad optimized
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Chip,
  Divider,
  Collapse,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  useListObservationTemplatesQuery,
  useUpdateObservationTemplateMutation,
  useDeleteObservationTemplateMutation,
  useGetCurrentUserQuery,
  DentalObservationTemplate,
} from '../../store/api';
import { useToast } from '../common/Toast';

interface NotesManagementDialogProps {
  open: boolean;
  onClose: () => void;
  selectedTemplateIds?: string[];
  onTemplateSelect?: (templateIds: string[]) => void;
}

const NotesManagementDialog: React.FC<NotesManagementDialogProps> = ({
  open,
  onClose,
  selectedTemplateIds = [],
  onTemplateSelect,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<DentalObservationTemplate>>({});
  const [filterCondition, setFilterCondition] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTemplateIds);

  // API hooks
  const { data: currentUser } = useGetCurrentUserQuery();
  const { data: templatesData, isLoading, refetch } = useListObservationTemplatesQuery();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateObservationTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteObservationTemplateMutation();

  // Get current doctor ID
  const currentDoctorId = currentUser?.doctor_id;

  const templates = templatesData?.templates || [];

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (!filterCondition) return templates;
    return templates.filter((t) =>
      t.condition_type?.toLowerCase().includes(filterCondition.toLowerCase())
    );
  }, [templates, filterCondition]);

  // Group templates by condition type
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, DentalObservationTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      const condition = template.condition_type || 'General';
      if (!groups[condition]) {
        groups[condition] = [];
      }
      groups[condition].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  // Check if current user can edit/delete a template
  const canModifyTemplate = (template: DentalObservationTemplate): boolean => {
    if (!currentDoctorId) return false;
    return template.created_by_doctor === currentDoctorId;
  };

  // Start editing
  const handleEdit = (template: DentalObservationTemplate) => {
    if (!canModifyTemplate(template)) {
      toast.error('Only the creator can edit this template');
      return;
    }
    setEditingId(template.id);
    setEditFormData({
      template_text: template.template_text,
      short_code: template.short_code || '',
      condition_type: template.condition_type || '',
      tooth_surface: template.tooth_surface || '',
      severity: template.severity || '',
      is_global: template.is_global,
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  // Save edited template
  const handleSaveEdit = async (templateId: string) => {
    try {
      await updateTemplate({
        templateId,
        templateData: {
          template_text: editFormData.template_text,
          short_code: editFormData.short_code || undefined,
          condition_type: editFormData.condition_type || undefined,
          tooth_surface: editFormData.tooth_surface || undefined,
          severity: editFormData.severity || undefined,
          is_global: editFormData.is_global,
        },
      }).unwrap();

      toast.success('Template updated successfully');
      setEditingId(null);
      setEditFormData({});
      refetch();
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  // Delete template
  const handleDelete = async (templateId: string, template: DentalObservationTemplate) => {
    if (!canModifyTemplate(template)) {
      toast.error('Only the creator can delete this template');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteTemplate(templateId).unwrap();
      toast.success('Template deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  // Toggle template selection
  const handleToggleSelection = (templateId: string) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(templateId)) {
        return prev.filter((id) => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  // Sync local state when props change
  React.useEffect(() => {
    setLocalSelectedIds(selectedTemplateIds);
  }, [selectedTemplateIds]);

  // Apply selections and close
  const handleApplySelections = () => {
    if (onTemplateSelect) {
      onTemplateSelect(localSelectedIds);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 4,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          minHeight: fullScreen ? '100vh' : '80vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: { xs: 2, sm: 2.5 },
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
          },
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: '#667eea',
            }}
          >
            Manage Note Templates
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            sx={{
              color: showFilters ? '#667eea' : 'text.secondary',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <FilterIcon />
          </IconButton>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'text.secondary',
              minWidth: 44,
              minHeight: 44,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Filter Section */}
      <Collapse in={showFilters}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'rgba(102, 126, 234, 0.05)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Filter by condition type..."
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'white',
              },
            }}
          />
        </Box>
      </Collapse>

      {/* Content */}
      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          overflowY: 'auto',
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : Object.keys(groupedTemplates).length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No templates found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(groupedTemplates).map(([condition, conditionTemplates]) => (
              <Box key={condition}>
                {/* Condition Group Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: '#667eea',
                    }}
                  >
                    {condition}
                  </Typography>
                  <Chip
                    label={conditionTemplates.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                    }}
                  />
                </Box>

                {/* Templates in this group */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {conditionTemplates.map((template) => {
                    const isEditing = editingId === template.id;

                    return (
                      <Box
                        key={template.id}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          border: '1px solid',
                          borderColor: isEditing ? '#667eea' : 'divider',
                          borderRadius: 2,
                          bgcolor: isEditing ? 'rgba(102, 126, 234, 0.03)' : 'white',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#667eea',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
                          },
                        }}
                      >
                        {isEditing ? (
                          // Edit Mode
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              size="small"
                              label="Template Text"
                              value={editFormData.template_text || ''}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, template_text: e.target.value })
                              }
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1.5,
                                },
                              }}
                            />

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <TextField
                                size="small"
                                label="Short Code"
                                value={editFormData.short_code || ''}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData,
                                    short_code: e.target.value.toUpperCase(),
                                  })
                                }
                                inputProps={{ maxLength: 20 }}
                                sx={{
                                  width: { xs: '100%', sm: 150 },
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                  },
                                }}
                              />

                              <TextField
                                size="small"
                                label="Surface"
                                value={editFormData.tooth_surface || ''}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, tooth_surface: e.target.value })
                                }
                                sx={{
                                  width: { xs: '100%', sm: 120 },
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                  },
                                }}
                              />

                              <TextField
                                size="small"
                                label="Severity"
                                value={editFormData.severity || ''}
                                onChange={(e) =>
                                  setEditFormData({ ...editFormData, severity: e.target.value })
                                }
                                sx={{
                                  width: { xs: '100%', sm: 120 },
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                  },
                                }}
                              />

                              <FormControlLabel
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={editFormData.is_global || false}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, is_global: e.target.checked })
                                    }
                                    sx={{
                                      color: '#667eea',
                                      '&.Mui-checked': {
                                        color: '#667eea',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                    Global
                                  </Typography>
                                }
                                sx={{ ml: 'auto' }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CancelIcon sx={{ fontSize: 14 }} />}
                                onClick={handleCancelEdit}
                                sx={{
                                  minHeight: 32,
                                  px: 1.5,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<SaveIcon sx={{ fontSize: 14 }} />}
                                onClick={() => handleSaveEdit(template.id)}
                                disabled={isUpdating || !editFormData.template_text?.trim()}
                                sx={{
                                  minHeight: 32,
                                  px: 1.5,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                  },
                                }}
                              >
                                {isUpdating ? 'Saving...' : 'Save'}
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          // View Mode
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            {/* Selection Checkbox */}
                            {onTemplateSelect && (
                              <Checkbox
                                size="small"
                                checked={localSelectedIds.includes(template.id)}
                                onChange={() => handleToggleSelection(template.id)}
                                sx={{
                                  p: 0,
                                  mt: 0.5,
                                  color: '#667eea',
                                  '&.Mui-checked': {
                                    color: '#667eea',
                                  },
                                }}
                              />
                            )}

                            {/* Template Content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              {/* Template Tags */}
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              {template.short_code && (
                                <Chip
                                  label={template.short_code}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    fontFamily: 'monospace',
                                    borderColor: '#667eea',
                                    color: '#667eea',
                                  }}
                                />
                              )}
                              {template.tooth_surface && (
                                <Chip
                                  label={template.tooth_surface}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                                    color: '#667eea',
                                  }}
                                />
                              )}
                              {template.severity && (
                                <Chip
                                  label={template.severity}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                                    color: '#667eea',
                                  }}
                                />
                              )}
                              {template.is_global && (
                                <Chip
                                  label="Global"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    bgcolor: 'rgba(118, 75, 162, 0.1)',
                                    color: '#764ba2',
                                  }}
                                />
                              )}
                            </Box>

                            {/* Template Text */}
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8125rem',
                                lineHeight: 1.5,
                                color: 'text.primary',
                                mb: 0.5,
                              }}
                            >
                              {template.template_text}
                            </Typography>

                            {/* Creator Information */}
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.6875rem',
                                color: canModifyTemplate(template) ? '#10b981' : 'text.secondary',
                                fontWeight: 500,
                                display: 'block',
                                mb: 1,
                              }}
                            >
                              {canModifyTemplate(template) ? '✓ Created by you' : '○ Created by another doctor'}
                            </Typography>

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                                onClick={() => handleEdit(template)}
                                disabled={!canModifyTemplate(template)}
                                sx={{
                                  minHeight: 32,
                                  px: 1.5,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderColor: canModifyTemplate(template) ? '#667eea' : 'divider',
                                  color: canModifyTemplate(template) ? '#667eea' : 'text.disabled',
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  '&:hover': canModifyTemplate(template) ? {
                                    borderColor: '#5568d3',
                                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                                  } : {},
                                  '&.Mui-disabled': {
                                    borderColor: 'divider',
                                    color: 'text.disabled',
                                  },
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
                                onClick={() => handleDelete(template.id, template)}
                                disabled={!canModifyTemplate(template) || isDeleting}
                                sx={{
                                  minHeight: 32,
                                  px: 1.5,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderColor: canModifyTemplate(template) ? '#ef4444' : 'divider',
                                  color: canModifyTemplate(template) ? '#ef4444' : 'text.disabled',
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  '&:hover': canModifyTemplate(template) ? {
                                    borderColor: '#dc2626',
                                    bgcolor: 'rgba(239, 68, 68, 0.05)',
                                  } : {},
                                  '&.Mui-disabled': {
                                    borderColor: 'divider',
                                    color: 'text.disabled',
                                  },
                                }}
                              >
                                Delete
                              </Button>
                            </Box>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {onTemplateSelect
            ? `${localSelectedIds.length} selected • ${templates.length} total`
            : `Total: ${templates.length} templates`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {onTemplateSelect && (
            <Button
              variant="contained"
              onClick={handleApplySelections}
              sx={{
                minHeight: { xs: 40, sm: 48 },
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
                fontWeight: 700,
                borderRadius: 2,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                },
              }}
            >
              Apply ({localSelectedIds.length})
            </Button>
          )}
          <Button
            variant={onTemplateSelect ? 'outlined' : 'contained'}
            onClick={onClose}
            sx={{
              minHeight: { xs: 40, sm: 48 },
              px: { xs: 2, sm: 3 },
              fontSize: { xs: '0.8125rem', sm: '0.9375rem' },
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              ...(onTemplateSelect
                ? {
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5568d3',
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                    },
                  }
                : {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                    },
                  }),
            }}
          >
            {onTemplateSelect ? 'Cancel' : 'Close'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default NotesManagementDialog;
