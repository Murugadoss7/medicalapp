/**
 * Prescription Templates Management Page
 * Allows tenants to customize their prescription layouts
 * Medical Futurism Design with glassmorphism
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Skeleton,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Description as TemplateIcon,
  Print as PrintIcon,
  Visibility as PreviewIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useListPrescriptionTemplatesQuery,
  useGetPresetTemplatesQuery,
  useCreatePrescriptionTemplateFromPresetMutation,
  useDeletePrescriptionTemplateMutation,
  useSetDefaultPrescriptionTemplateMutation,
  useUpdatePrescriptionTemplateMutation,
  useListDoctorsQuery,
  useGetMyTenantQuery,
  PrescriptionTemplate,
  PresetTemplateInfo,
} from '../../store/api';

// Glassmorphism styles
const glassCard = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: 3,
  border: '1px solid rgba(102, 126, 234, 0.15)',
  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
};

const gradientHeader = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const PrescriptionTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null);

  // Fetch templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates,
  } = useListPrescriptionTemplatesQuery({});

  // Fetch presets
  const {
    data: presetsData,
    isLoading: presetsLoading,
  } = useGetPresetTemplatesQuery();

  // Fetch doctors for assignment dropdown
  const { data: doctorsData } = useListDoctorsQuery({ is_active: true, per_page: 100 });

  // Fetch current tenant/clinic info
  const { data: tenantData } = useGetMyTenantQuery();
  const clinicName = tenantData?.tenant_name || 'Clinic';

  // Mutations
  const [createFromPreset, { isLoading: creating }] = useCreatePrescriptionTemplateFromPresetMutation();
  const [deleteTemplate, { isLoading: deleting }] = useDeletePrescriptionTemplateMutation();
  const [setDefault, { isLoading: settingDefault }] = useSetDefaultPrescriptionTemplateMutation();
  const [updateTemplate] = useUpdatePrescriptionTemplateMutation();

  // Get doctor name by ID
  const getDoctorName = (doctorId?: string) => {
    if (!doctorId) return `${clinicName} (Default)`;
    const doctor = doctorsData?.doctors.find(d => d.id === doctorId);
    return doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor';
  };

  // Get office name by doctor and office ID
  const getOfficeName = (doctorId?: string, officeId?: string) => {
    if (!doctorId || !officeId) return '';
    const doctor = doctorsData?.doctors.find(d => d.id === doctorId);
    const office = doctor?.offices?.find(o => o.id === officeId);
    return office?.name || '';
  };

  // Get offices for a specific doctor
  const getDoctorOffices = (doctorId?: string) => {
    if (!doctorId) return [];
    const doctor = doctorsData?.doctors.find(d => d.id === doctorId);
    return doctor?.offices || [];
  };

  // Handle doctor assignment change
  const handleDoctorChange = async (templateId: string, doctorId: string | null) => {
    try {
      // When doctor changes, clear office_id as well
      await updateTemplate({
        id: templateId,
        data: { doctor_id: doctorId, office_id: null }
      }).unwrap();
      refetchTemplates();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  // Handle office assignment change
  const handleOfficeChange = async (templateId: string, doctorId: string, officeId: string | null) => {
    try {
      await updateTemplate({
        id: templateId,
        data: { doctor_id: doctorId, office_id: officeId }
      }).unwrap();
      refetchTemplates();
    } catch (error) {
      console.error('Failed to update office assignment:', error);
    }
  };

  const handleCreateFromPreset = async (preset: PresetTemplateInfo) => {
    try {
      await createFromPreset({
        preset_type: preset.type,
        data: {
          preset_type: preset.type as 'classic' | 'modern' | 'minimal',
          name: `${preset.name} Template`,
          is_default: templatesData?.templates.length === 0, // Make first template default
        },
      }).unwrap();
      refetchTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      await setDefault(templateId).unwrap();
      refetchTemplates();
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  // Unset default - just update the template with is_default: false
  const handleUnsetDefault = async (templateId: string) => {
    try {
      await updateTemplate({ id: templateId, data: { is_default: false } }).unwrap();
      refetchTemplates();
    } catch (error) {
      console.error('Failed to unset default:', error);
    }
  };

  const handleDeleteClick = (template: PrescriptionTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTemplate) {
      try {
        await deleteTemplate(selectedTemplate.id).unwrap();
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
        refetchTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/settings/templates/${templateId}/edit`);
  };

  // Get preset icon color
  const getPresetColor = (type: string) => {
    switch (type) {
      case 'classic':
        return '#667eea';
      case 'modern':
        return '#764ba2';
      case 'minimal':
        return '#10b981';
      default:
        return '#667eea';
    }
  };

  // Get paper size label
  const getPaperSizeLabel = (size: string) => {
    switch (size) {
      case 'a4':
        return 'A4';
      case 'a5':
        return 'A5';
      case 'letter':
        return 'Letter';
      default:
        return size.toUpperCase();
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={gradientHeader}>
              Prescription Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Customize how your prescriptions look when printed
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/settings/templates/new')}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
            },
          }}
        >
          Create Template
        </Button>
      </Box>

      {/* Preset Gallery */}
      <Paper sx={{ ...glassCard, p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Start with a Template
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a preset and customize it to match your clinic's branding
        </Typography>

        {presetsLoading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3}>
            {presetsData?.presets.map((preset) => (
              <Grid item xs={12} md={4} key={preset.type}>
                <Fade in timeout={300}>
                  <Card
                    sx={{
                      height: '100%',
                      border: `2px solid ${getPresetColor(preset.type)}20`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: getPresetColor(preset.type),
                        boxShadow: `0 8px 24px ${getPresetColor(preset.type)}30`,
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent>
                      {/* Preview Box */}
                      <Box
                        sx={{
                          height: 120,
                          borderRadius: 2,
                          mb: 2,
                          background: `linear-gradient(135deg, ${getPresetColor(preset.type)}10 0%, ${getPresetColor(preset.type)}05 100%)`,
                          border: `1px solid ${getPresetColor(preset.type)}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TemplateIcon sx={{ fontSize: 48, color: getPresetColor(preset.type), opacity: 0.7 }} />
                      </Box>

                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {preset.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                        {preset.description}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          size="small"
                          label={getPaperSizeLabel(preset.paper_size)}
                          sx={{
                            bgcolor: `${getPresetColor(preset.type)}15`,
                            color: getPresetColor(preset.type),
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleCreateFromPreset(preset)}
                        disabled={creating}
                        sx={{
                          borderColor: getPresetColor(preset.type),
                          color: getPresetColor(preset.type),
                          '&:hover': {
                            borderColor: getPresetColor(preset.type),
                            bgcolor: `${getPresetColor(preset.type)}10`,
                          },
                        }}
                      >
                        {creating ? <CircularProgress size={20} /> : 'Use This Template'}
                      </Button>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Your Templates */}
      <Paper sx={{ ...glassCard, p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Your Templates
        </Typography>

        {templatesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : templatesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load templates. Please try again.
          </Alert>
        ) : templatesData?.templates.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 2,
              border: '2px dashed rgba(102, 126, 234, 0.2)',
              borderRadius: 3,
            }}
          >
            <TemplateIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No templates yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Create your first template from one of the presets above
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {templatesData?.templates.map((template) => (
              <Grid item xs={12} key={template.id}>
                <Card
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    border: template.is_default
                      ? '2px solid #10b981'
                      : '1px solid rgba(102, 126, 234, 0.1)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  {/* Template Icon */}
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      background: template.preset_type
                        ? `linear-gradient(135deg, ${getPresetColor(template.preset_type)}20 0%, ${getPresetColor(template.preset_type)}10 100%)`
                        : 'linear-gradient(135deg, #667eea20 0%, #667eea10 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  >
                    <TemplateIcon
                      sx={{
                        fontSize: 28,
                        color: template.preset_type ? getPresetColor(template.preset_type) : '#667eea',
                      }}
                    />
                  </Box>

                  {/* Template Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {template.name}
                      </Typography>
                      {template.is_default && (
                        <Chip
                          size="small"
                          icon={<StarIcon sx={{ fontSize: 14 }} />}
                          label="Default"
                          sx={{
                            bgcolor: '#10b98120',
                            color: '#10b981',
                            fontWeight: 600,
                            height: 24,
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={getPaperSizeLabel(template.paper_size)}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      {template.preset_type && (
                        <Chip
                          size="small"
                          label={template.preset_type.charAt(0).toUpperCase() + template.preset_type.slice(1)}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                      {template.logo_url && (
                        <Chip
                          size="small"
                          label="Has Logo"
                          sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#10b98115', color: '#10b981' }}
                        />
                      )}
                      <Chip
                        size="small"
                        label={getDoctorName(template.doctor_id)}
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: template.doctor_id ? '#667eea15' : '#f5f5f5',
                          color: template.doctor_id ? '#667eea' : '#666',
                        }}
                      />
                      {template.office_id && (
                        <Chip
                          size="small"
                          label={getOfficeName(template.doctor_id, template.office_id)}
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: '#764ba215',
                            color: '#764ba2',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Assignment Dropdowns */}
                  <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
                    {/* Doctor Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={template.doctor_id || ''}
                        onChange={(e) => handleDoctorChange(template.id, e.target.value || null)}
                        displayEmpty
                        sx={{ height: 32, fontSize: '0.8rem' }}
                      >
                        <MenuItem value="">
                          <em>{clinicName} (Default)</em>
                        </MenuItem>
                        {doctorsData?.doctors.map((doctor) => (
                          <MenuItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.first_name} {doctor.last_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Office Dropdown - Only show if doctor is selected and has offices */}
                    {template.doctor_id && getDoctorOffices(template.doctor_id).length > 0 && (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={template.office_id || ''}
                          onChange={(e) => handleOfficeChange(template.id, template.doctor_id!, e.target.value || null)}
                          displayEmpty
                          sx={{ height: 32, fontSize: '0.8rem' }}
                        >
                          <MenuItem value="">
                            <em>All Offices</em>
                          </MenuItem>
                          {getDoctorOffices(template.doctor_id).map((office) => (
                            <MenuItem key={office.id} value={office.id}>
                              {office.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {template.is_default ? (
                      <IconButton
                        size="small"
                        onClick={() => handleUnsetDefault(template.id)}
                        disabled={settingDefault}
                        title="Remove default (click to unset)"
                        sx={{ color: '#10b981' }}
                      >
                        <StarIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleSetDefault(template.id)}
                        disabled={settingDefault}
                        title="Set as default"
                        sx={{ color: 'text.secondary' }}
                      >
                        <StarBorderIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleEditTemplate(template.id)}
                      title="Edit template"
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(template)}
                      disabled={deleting}
                      title="Delete template"
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Delete Template?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrescriptionTemplates;
