/**
 * Template Editor Component
 * Allows editing prescription template settings with live preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Slider,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetPrescriptionTemplateQuery,
  useUpdatePrescriptionTemplateMutation,
  useUploadPrescriptionTemplateLogoMutation,
  useUploadPrescriptionTemplateSignatureMutation,
  PrescriptionTemplate,
  PrescriptionTemplateUpdate,
} from '../../store/api';
import { LivePreview } from './LivePreview';

// Glassmorphism styles
const glassCard = {
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: 3,
  border: '1px solid rgba(102, 126, 234, 0.15)',
  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const TemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form state
  const [formData, setFormData] = useState<PrescriptionTemplateUpdate>({
    name: '',
    description: '',
    paper_size: 'a4',
    orientation: 'portrait',
    margin_top: 15,
    margin_bottom: 15,
    margin_left: 15,
    margin_right: 15,
    signature_text: '',
    layout_config: {},
  });

  // Fetch template
  const {
    data: template,
    isLoading,
    error,
    refetch,
  } = useGetPrescriptionTemplateQuery(templateId || '', {
    skip: !templateId,
  });

  // Mutations
  const [updateTemplate, { isLoading: saving }] = useUpdatePrescriptionTemplateMutation();
  const [uploadLogo, { isLoading: uploadingLogo }] = useUploadPrescriptionTemplateLogoMutation();
  const [uploadSignature, { isLoading: uploadingSignature }] = useUploadPrescriptionTemplateSignatureMutation();

  // Initialize form data when template loads
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        paper_size: template.paper_size,
        orientation: template.orientation,
        margin_top: template.margin_top,
        margin_bottom: template.margin_bottom,
        margin_left: template.margin_left,
        margin_right: template.margin_right,
        signature_text: template.signature_text || '',
        layout_config: template.layout_config || {},
        logo_url: template.logo_url,
        signature_url: template.signature_url,
      });
    }
  }, [template]);

  // Handle form changes
  const handleChange = useCallback((field: keyof PrescriptionTemplateUpdate, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Handle layout config changes
  const handleLayoutChange = useCallback((section: string, key: string, value: unknown) => {
    console.log('[TemplateEditor] handleLayoutChange called:', { section, key, value });
    setFormData((prev) => {
      const currentConfig = prev.layout_config || {};
      const currentSection = (currentConfig as Record<string, Record<string, unknown>>)[section] || {};
      const newConfig = {
        ...currentConfig,
        [section]: {
          ...currentSection,
          [key]: value,
        },
      };
      console.log('[TemplateEditor] New layout_config:', newConfig);
      return {
        ...prev,
        layout_config: newConfig,
      };
    });
    setHasChanges(true);
  }, []);

  // Handle save
  const handleSave = async () => {
    if (!templateId) return;
    try {
      await updateTemplate({ id: templateId, data: formData }).unwrap();
      setHasChanges(false);
      setSnackbar({ open: true, message: 'Template saved successfully!', severity: 'success' });
      refetch();
    } catch (error) {
      console.error('Failed to save template:', error);
      setSnackbar({ open: true, message: 'Failed to save template', severity: 'error' });
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !templateId) return;
    try {
      await uploadLogo({ id: templateId, file }).unwrap();
      setSnackbar({ open: true, message: 'Logo uploaded successfully!', severity: 'success' });
      refetch();
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setSnackbar({ open: true, message: 'Failed to upload logo', severity: 'error' });
    }
  };

  // Handle signature upload
  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !templateId) return;
    try {
      await uploadSignature({ id: templateId, file }).unwrap();
      setSnackbar({ open: true, message: 'Signature uploaded successfully!', severity: 'success' });
      refetch();
    } catch (error) {
      console.error('Failed to upload signature:', error);
      setSnackbar({ open: true, message: 'Failed to upload signature', severity: 'error' });
    }
  };

  // Handle print preview - generates proper HTML document
  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Sample data for preview (same as LivePreview)
    const sampleData = {
      clinic: { name: 'Arunachalam Dental Clinic', address: '123 Main Street, Anna Nagar, Chennai 600040', phone: '+91 98765 43210' },
      doctor: { name: 'Dr. Arunachalam', specialization: 'Dental Surgery', license: 'TN-DEN-12345' },
      patient: { name: 'Balu Kumar', age: 35, gender: 'Male', date: new Date().toLocaleDateString('en-IN'), rxNumber: 'RX-2026-001' },
      medicines: [
        { name: 'Amoxicillin 500mg', dosage: '1 tablet', frequency: '3 times daily', duration: '5 days', instructions: 'After meals' },
        { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days', instructions: 'With food' },
        { name: 'Chlorhexidine Mouthwash', dosage: '10ml', frequency: 'Twice daily', duration: '7 days', instructions: 'Rinse for 30 seconds' },
      ],
    };

    const currentTemplate = { ...template, ...formData };
    const logoUrl = currentTemplate.logo_url || '';
    const signatureUrl = currentTemplate.signature_url || '';
    const signatureText = currentTemplate.signature_text || sampleData.doctor.name;

    // Get logo position from layout_config
    const layoutConfig = (currentTemplate.layout_config || {}) as Record<string, Record<string, unknown>>;
    const headerConfig = layoutConfig.header || {};
    const logoPosition = ((headerConfig.logo as Record<string, unknown>)?.position as string) || 'left';
    console.log('[PrintPreview] logoPosition:', logoPosition);

    // Build document using safe DOM methods
    const doc = printWindow.document;

    // Create title
    const titleEl = doc.createElement('title');
    titleEl.textContent = `Print Preview - ${formData.name || 'Template'}`;
    doc.head.appendChild(titleEl);

    // Create style with logo position support
    const styleEl = doc.createElement('style');
    styleEl.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: ${formData.margin_top || 15}mm ${formData.margin_right || 15}mm ${formData.margin_bottom || 15}mm ${formData.margin_left || 15}mm; }
      .header { display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px; }
      .header.logo-right { flex-direction: row-reverse; }
      .header.logo-center { flex-direction: column; align-items: center; text-align: center; }
      .logo { max-width: 80px; max-height: 60px; object-fit: contain; }
      .clinic-info { flex: 1; }
      .header.logo-center .clinic-info { text-align: center; }
      .clinic-name { font-size: 18pt; font-weight: bold; color: #333; }
      .clinic-address, .clinic-phone { font-size: 10pt; color: #666; margin-top: 3px; }
      .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
      .doctor-info { margin-bottom: 10px; }
      .doctor-name { font-size: 12pt; font-weight: 600; }
      .doctor-details { font-size: 10pt; color: #666; }
      .patient-section { display: flex; flex-wrap: wrap; gap: 25px; background: #f8f9fa; padding: 12px; margin: 15px 0; border-radius: 4px; }
      .patient-field label { font-size: 9pt; color: #666; display: block; }
      .patient-field span { font-size: 11pt; font-weight: 600; }
      .rx-symbol { font-size: 24pt; font-weight: bold; color: #667eea; font-family: serif; margin: 15px 0 10px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10pt; }
      th { background-color: #f0f0f0; font-weight: 600; }
      .footer { margin-top: 40px; text-align: right; }
      .signature-img { max-width: 120px; max-height: 50px; object-fit: contain; }
      .signature-line { width: 150px; border-bottom: 1px solid #333; margin-left: auto; margin-bottom: 5px; height: 30px; }
      .signature-name { font-size: 11pt; font-weight: 500; }
      .signature-date { font-size: 9pt; color: #666; margin-top: 5px; }
      @media print { body { padding: ${formData.margin_top || 15}mm ${formData.margin_right || 15}mm ${formData.margin_bottom || 15}mm ${formData.margin_left || 15}mm; } @page { margin: 0; } }
    `;
    doc.head.appendChild(styleEl);

    // Build body content using DOM methods
    const container = doc.createElement('div');

    // Header with logo and clinic info - respects logo position
    const header = doc.createElement('div');
    header.className = `header logo-${logoPosition}`;
    if (logoUrl) {
      const logoImg = doc.createElement('img');
      logoImg.className = 'logo';
      logoImg.src = logoUrl;
      logoImg.alt = 'Clinic Logo';
      header.appendChild(logoImg);
    }
    const clinicInfo = doc.createElement('div');
    clinicInfo.className = 'clinic-info';
    const clinicName = doc.createElement('div');
    clinicName.className = 'clinic-name';
    clinicName.textContent = sampleData.clinic.name;
    const clinicAddress = doc.createElement('div');
    clinicAddress.className = 'clinic-address';
    clinicAddress.textContent = sampleData.clinic.address;
    const clinicPhone = doc.createElement('div');
    clinicPhone.className = 'clinic-phone';
    clinicPhone.textContent = 'Phone: ' + sampleData.clinic.phone;
    clinicInfo.appendChild(clinicName);
    clinicInfo.appendChild(clinicAddress);
    clinicInfo.appendChild(clinicPhone);
    header.appendChild(clinicInfo);
    container.appendChild(header);

    // Divider
    const divider1 = doc.createElement('hr');
    divider1.className = 'divider';
    container.appendChild(divider1);

    // Doctor info
    const doctorInfo = doc.createElement('div');
    doctorInfo.className = 'doctor-info';
    const doctorName = doc.createElement('div');
    doctorName.className = 'doctor-name';
    doctorName.textContent = sampleData.doctor.name;
    const doctorDetails = doc.createElement('div');
    doctorDetails.className = 'doctor-details';
    doctorDetails.textContent = sampleData.doctor.specialization + ' | Reg: ' + sampleData.doctor.license;
    doctorInfo.appendChild(doctorName);
    doctorInfo.appendChild(doctorDetails);
    container.appendChild(doctorInfo);

    // Divider
    const divider2 = doc.createElement('hr');
    divider2.className = 'divider';
    container.appendChild(divider2);

    // Patient section
    const patientSection = doc.createElement('div');
    patientSection.className = 'patient-section';
    const patientFields = [
      { label: 'Patient Name', value: sampleData.patient.name },
      { label: 'Age/Gender', value: sampleData.patient.age + ' / ' + sampleData.patient.gender },
      { label: 'Date', value: sampleData.patient.date },
      { label: 'Rx No.', value: sampleData.patient.rxNumber },
    ];
    patientFields.forEach(field => {
      const fieldDiv = doc.createElement('div');
      fieldDiv.className = 'patient-field';
      const label = doc.createElement('label');
      label.textContent = field.label;
      const span = doc.createElement('span');
      span.textContent = field.value;
      fieldDiv.appendChild(label);
      fieldDiv.appendChild(span);
      patientSection.appendChild(fieldDiv);
    });
    container.appendChild(patientSection);

    // Rx symbol
    const rxSymbol = doc.createElement('div');
    rxSymbol.className = 'rx-symbol';
    rxSymbol.textContent = 'Rx';
    container.appendChild(rxSymbol);

    // Prescription table
    const table = doc.createElement('table');
    const thead = doc.createElement('thead');
    const headerRow = doc.createElement('tr');
    ['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'].forEach(text => {
      const th = doc.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = doc.createElement('tbody');
    sampleData.medicines.forEach(med => {
      const row = doc.createElement('tr');
      [med.name, med.dosage, med.frequency, med.duration, med.instructions].forEach(text => {
        const td = doc.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    // Footer with signature
    const footer = doc.createElement('div');
    footer.className = 'footer';
    if (signatureUrl) {
      const sigImg = doc.createElement('img');
      sigImg.className = 'signature-img';
      sigImg.src = signatureUrl;
      sigImg.alt = 'Signature';
      footer.appendChild(sigImg);
    } else {
      const sigLine = doc.createElement('div');
      sigLine.className = 'signature-line';
      footer.appendChild(sigLine);
    }
    const sigName = doc.createElement('div');
    sigName.className = 'signature-name';
    sigName.textContent = signatureText;
    const sigDate = doc.createElement('div');
    sigDate.className = 'signature-date';
    sigDate.textContent = 'Date: ' + sampleData.patient.date;
    footer.appendChild(sigName);
    footer.appendChild(sigDate);
    container.appendChild(footer);

    doc.body.appendChild(container);

    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !template) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Template not found or failed to load. Please try again.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/settings/templates')} sx={{ mt: 2 }}>
          Back to Templates
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/settings/templates')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            Edit Template: {template.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || !hasChanges}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
            },
          }}
        >
          Save Changes
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper sx={{ ...glassCard, p: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="General" />
              <Tab label="Layout" />
              <Tab label="Branding" />
            </Tabs>

            {/* General Tab */}
            <TabPanel value={activeTab} index={0}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Paper Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Paper Size</InputLabel>
                    <Select
                      value={formData.paper_size}
                      label="Paper Size"
                      onChange={(e) => handleChange('paper_size', e.target.value)}
                    >
                      <MenuItem value="a4">A4</MenuItem>
                      <MenuItem value="a5">A5</MenuItem>
                      <MenuItem value="letter">Letter</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Orientation</InputLabel>
                    <Select
                      value={formData.orientation}
                      label="Orientation"
                      onChange={(e) => handleChange('orientation', e.target.value)}
                    >
                      <MenuItem value="portrait">Portrait</MenuItem>
                      <MenuItem value="landscape">Landscape</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Typography variant="body2" sx={{ mt: 3, mb: 1 }}>
                Margins (mm)
              </Typography>
              <Grid container spacing={2}>
                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                  <Grid item xs={6} key={side}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {side}: {formData[`margin_${side}`]}mm
                    </Typography>
                    <Slider
                      size="small"
                      value={formData[`margin_${side}`] as number}
                      onChange={(_, value) => handleChange(`margin_${side}`, value)}
                      min={0}
                      max={50}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Layout Tab */}
            <TabPanel value={activeTab} index={1}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Header Settings
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Logo Position</InputLabel>
                <Select
                  value={(formData.layout_config as Record<string, Record<string, unknown>>)?.header?.logo?.position || 'left'}
                  label="Logo Position"
                  onChange={(e) => handleLayoutChange('header', 'logo', { ...(formData.layout_config as Record<string, Record<string, unknown>>)?.header?.logo, position: e.target.value })}
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Footer Settings
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Signature Position</InputLabel>
                <Select
                  value={(formData.layout_config as Record<string, Record<string, unknown>>)?.footer?.signature?.position || 'right'}
                  label="Signature Position"
                  onChange={(e) => handleLayoutChange('footer', 'signature', { ...(formData.layout_config as Record<string, Record<string, unknown>>)?.footer?.signature, position: e.target.value })}
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={(formData.layout_config as Record<string, Record<string, unknown>>)?.footer?.showDate !== false}
                    onChange={(e) => handleLayoutChange('footer', 'showDate', e.target.checked)}
                  />
                }
                label="Show date in footer"
              />
            </TabPanel>

            {/* Branding Tab */}
            <TabPanel value={activeTab} index={2}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Clinic Logo
              </Typography>
              <Box sx={{ mb: 3 }}>
                {template.logo_url ? (
                  <Box sx={{ mb: 2 }}>
                    <img
                      src={template.logo_url}
                      alt="Clinic Logo"
                      style={{ maxWidth: '100%', maxHeight: 100, objectFit: 'contain' }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    No logo uploaded
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={uploadingLogo ? <CircularProgress size={18} /> : <UploadIcon />}
                  disabled={uploadingLogo}
                  size="small"
                >
                  Upload Logo
                  <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Signature
              </Typography>
              <TextField
                fullWidth
                label="Signature Text"
                value={formData.signature_text}
                onChange={(e) => handleChange('signature_text', e.target.value)}
                placeholder="Dr. John Doe"
                sx={{ mb: 2 }}
                helperText="Used when no signature image is uploaded"
              />
              {template.signature_url ? (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={template.signature_url}
                    alt="Signature"
                    style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }}
                  />
                </Box>
              ) : null}
              <Button
                variant="outlined"
                component="label"
                startIcon={uploadingSignature ? <CircularProgress size={18} /> : <UploadIcon />}
                disabled={uploadingSignature}
                size="small"
              >
                Upload Signature Image
                <input type="file" hidden accept="image/*" onChange={handleSignatureUpload} />
              </Button>
            </TabPanel>
          </Paper>
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper sx={{ ...glassCard, p: 2, minHeight: 600 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Live Preview
              </Typography>
              <Button startIcon={<PrintIcon />} size="small" onClick={handlePrintPreview}>
                Print Preview
              </Button>
            </Box>
            <LivePreview
              template={{
                ...template,
                ...formData,
              } as PrescriptionTemplate}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateEditor;
