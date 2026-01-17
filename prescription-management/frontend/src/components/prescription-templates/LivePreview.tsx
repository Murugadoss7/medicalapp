/**
 * Live Preview Component
 * Renders a real-time preview of the prescription template
 */

import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { PrescriptionTemplate } from '../../store/api';

interface LivePreviewProps {
  template: Partial<PrescriptionTemplate>;
}

// Sample data for preview
const sampleData = {
  clinic: {
    name: 'Arunachalam Dental Clinic',
    address: '123 Main Street, Anna Nagar, Chennai 600040',
    phone: '+91 98765 43210',
  },
  doctor: {
    name: 'Dr. Arunachalam',
    specialization: 'Dental Surgery',
    license: 'TN-DEN-12345',
  },
  patient: {
    name: 'Balu Kumar',
    age: 35,
    gender: 'Male',
    date: new Date().toLocaleDateString('en-IN'),
    rxNumber: 'RX-2026-001',
  },
  medicines: [
    { name: 'Amoxicillin 500mg', dosage: '1 tablet', frequency: '3 times daily', duration: '5 days', instructions: 'After meals' },
    { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days', instructions: 'With food' },
    { name: 'Chlorhexidine Mouthwash', dosage: '10ml', frequency: 'Twice daily', duration: '7 days', instructions: 'Rinse for 30 seconds' },
  ],
};

// Paper dimensions in mm
const PAPER_SIZES = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
  letter: { width: 216, height: 279 },
};

// Convert mm to pixels (at 96 DPI, 1mm = ~3.78px, but we scale down for preview)
const mmToPx = (mm: number, scale = 0.4) => mm * 3.78 * scale;

export const LivePreview: React.FC<LivePreviewProps> = ({ template }) => {
  const paperSize = PAPER_SIZES[template.paper_size as keyof typeof PAPER_SIZES] || PAPER_SIZES.a4;
  const isLandscape = template.orientation === 'landscape';

  const width = isLandscape ? paperSize.height : paperSize.width;
  const height = isLandscape ? paperSize.width : paperSize.height;

  const layoutConfig = template.layout_config as Record<string, Record<string, unknown>> || {};
  const headerConfig = layoutConfig.header || {};
  const footerConfig = layoutConfig.footer || {};

  // Get logo position
  const logoPosition = (headerConfig.logo as Record<string, unknown>)?.position || 'left';
  const signaturePosition = (footerConfig.signature as Record<string, unknown>)?.position || 'right';

  // Debug: Log layout config to verify it's being read correctly
  console.log('[LivePreview] layout_config:', template.layout_config);
  console.log('[LivePreview] headerConfig.logo:', headerConfig.logo);
  console.log('[LivePreview] logoPosition:', logoPosition);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        py: 2,
        overflow: 'auto',
      }}
    >
      {/* Paper */}
      <Box
        sx={{
          width: mmToPx(width),
          minHeight: mmToPx(height),
          bgcolor: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          borderRadius: 1,
          p: `${mmToPx(template.margin_top || 15)}px ${mmToPx(template.margin_right || 15)}px ${mmToPx(template.margin_bottom || 15)}px ${mmToPx(template.margin_left || 15)}px`,
          fontFamily: 'Arial, sans-serif',
          fontSize: mmToPx(3),
          position: 'relative',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: logoPosition === 'center' ? 'center' : 'flex-start',
              justifyContent: 'flex-start',
              flexDirection: logoPosition === 'center' ? 'column' : logoPosition === 'right' ? 'row-reverse' : 'row',
              gap: 1.5,
              mb: 1,
            }}
          >
            {/* Logo */}
            {template.logo_url ? (
              <Box
                component="img"
                src={template.logo_url}
                alt="Clinic Logo"
                sx={{
                  maxWidth: mmToPx(30),
                  maxHeight: mmToPx(20),
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: mmToPx(20),
                  height: mmToPx(15),
                  border: '1px dashed #ccc',
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: mmToPx(2),
                }}
              >
                Logo
              </Box>
            )}

            {/* Clinic Info */}
            <Box sx={{ textAlign: logoPosition === 'center' ? 'center' : 'left', flex: 1 }}>
              <Typography
                sx={{
                  fontSize: mmToPx(5),
                  fontWeight: 700,
                  color: '#333',
                  lineHeight: 1.2,
                }}
              >
                {sampleData.clinic.name}
              </Typography>
              <Typography sx={{ fontSize: mmToPx(2.5), color: '#666', lineHeight: 1.4 }}>
                {sampleData.clinic.address}
              </Typography>
              <Typography sx={{ fontSize: mmToPx(2.5), color: '#666' }}>
                Phone: {sampleData.clinic.phone}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Doctor Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontSize: mmToPx(3.5), fontWeight: 600, color: '#333' }}>
                {sampleData.doctor.name}
              </Typography>
              <Typography sx={{ fontSize: mmToPx(2.5), color: '#666' }}>
                {sampleData.doctor.specialization} | Reg: {sampleData.doctor.license}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />
        </Box>

        {/* Patient Info */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
            p: 1,
            bgcolor: '#f8f9fa',
            borderRadius: 0.5,
          }}
        >
          <Box sx={{ minWidth: '40%' }}>
            <Typography sx={{ fontSize: mmToPx(2.2), color: '#666' }}>Patient Name</Typography>
            <Typography sx={{ fontSize: mmToPx(3), fontWeight: 600 }}>{sampleData.patient.name}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: mmToPx(2.2), color: '#666' }}>Age/Gender</Typography>
            <Typography sx={{ fontSize: mmToPx(3), fontWeight: 600 }}>
              {sampleData.patient.age} / {sampleData.patient.gender}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: mmToPx(2.2), color: '#666' }}>Date</Typography>
            <Typography sx={{ fontSize: mmToPx(3), fontWeight: 600 }}>{sampleData.patient.date}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: mmToPx(2.2), color: '#666' }}>Rx No.</Typography>
            <Typography sx={{ fontSize: mmToPx(3), fontWeight: 600 }}>{sampleData.patient.rxNumber}</Typography>
          </Box>
        </Box>

        {/* Rx Symbol */}
        <Typography
          sx={{
            fontSize: mmToPx(6),
            fontWeight: 700,
            fontFamily: 'serif',
            color: '#667eea',
            mb: 1,
          }}
        >
          Rx
        </Typography>

        {/* Prescription Table */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
              gap: 0,
              borderTop: '1px solid #ddd',
              borderLeft: '1px solid #ddd',
            }}
          >
            {/* Header Row */}
            {['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map((header) => (
              <Box
                key={header}
                sx={{
                  p: 0.5,
                  bgcolor: '#f0f0f0',
                  borderBottom: '1px solid #ddd',
                  borderRight: '1px solid #ddd',
                }}
              >
                <Typography sx={{ fontSize: mmToPx(2.5), fontWeight: 600 }}>{header}</Typography>
              </Box>
            ))}

            {/* Data Rows */}
            {sampleData.medicines.map((med, idx) => (
              <React.Fragment key={idx}>
                <Box sx={{ p: 0.5, borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                  <Typography sx={{ fontSize: mmToPx(2.5) }}>{med.name}</Typography>
                </Box>
                <Box sx={{ p: 0.5, borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                  <Typography sx={{ fontSize: mmToPx(2.5) }}>{med.dosage}</Typography>
                </Box>
                <Box sx={{ p: 0.5, borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                  <Typography sx={{ fontSize: mmToPx(2.5) }}>{med.frequency}</Typography>
                </Box>
                <Box sx={{ p: 0.5, borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                  <Typography sx={{ fontSize: mmToPx(2.5) }}>{med.duration}</Typography>
                </Box>
                <Box sx={{ p: 0.5, borderBottom: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                  <Typography sx={{ fontSize: mmToPx(2.5) }}>{med.instructions}</Typography>
                </Box>
              </React.Fragment>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            position: 'absolute',
            bottom: mmToPx(template.margin_bottom || 15),
            left: mmToPx(template.margin_left || 15),
            right: mmToPx(template.margin_right || 15),
            display: 'flex',
            justifyContent: signaturePosition === 'center' ? 'center' : signaturePosition === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          <Box sx={{ textAlign: signaturePosition === 'center' ? 'center' : signaturePosition === 'right' ? 'right' : 'left' }}>
            {template.signature_url ? (
              <Box
                component="img"
                src={template.signature_url}
                alt="Signature"
                sx={{
                  maxWidth: mmToPx(40),
                  maxHeight: mmToPx(15),
                  objectFit: 'contain',
                  mb: 0.5,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: mmToPx(35),
                  height: mmToPx(10),
                  borderBottom: '1px solid #333',
                  mb: 0.5,
                }}
              />
            )}
            <Typography sx={{ fontSize: mmToPx(2.8), fontWeight: 500 }}>
              {template.signature_text || sampleData.doctor.name}
            </Typography>
            {footerConfig.showDate !== false && (
              <Typography sx={{ fontSize: mmToPx(2.2), color: '#666', mt: 0.5 }}>
                Date: {sampleData.patient.date}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LivePreview;
