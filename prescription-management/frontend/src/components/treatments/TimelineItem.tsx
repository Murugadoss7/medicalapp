/**
 * Timeline Item - Represents a single visit with observations, procedures, and attachments
 * Selectable for case study generation
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  Chip,
} from '@mui/material';
import {
  Visibility as ObservationIcon,
  MedicalServices as ProcedureIcon,
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { VisitData } from '../../utils/caseStudyHelpers';

interface TimelineItemProps {
  visit: VisitData;
  isSelected: boolean;
  selectedImages: Set<string>;
  onToggleVisit: (visitId: string) => void;
  onToggleImage: (imageId: string) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  visit,
  isSelected,
  selectedImages,
  onToggleVisit,
  onToggleImage,
}) => {
  return (
    <Paper
      elevation={isSelected ? 3 : 1}
      sx={{
        p: 2,
        mb: 2,
        border: 2,
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease',
        bgcolor: isSelected ? 'primary.50' : 'background.paper',
      }}
    >
      {/* Header with checkbox and date */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleVisit(visit.visitId)}
          sx={{
            mt: -1,
            mr: 1,
            '& .MuiSvgIcon-root': { fontSize: 28 }, // Larger for iPad
          }}
        />

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {format(visit.date, 'MMM dd, yyyy')}
          </Typography>

          {/* Observations */}
          {visit.observations.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              {visit.observations.map((obs, index) => (
                <Box
                  key={obs.id || index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <ObservationIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Observation:
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {obs.observation_notes || obs.condition_type || 'No notes'}
                    </Typography>
                    {obs.severity && (
                      <Chip
                        label={obs.severity}
                        size="small"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Procedures */}
          {visit.procedures.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              {visit.procedures.map((proc, index) => (
                <Box
                  key={proc.id || index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <ProcedureIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.3 }} />
                  <Box>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      {proc.procedure_name || proc.name || 'Procedure'}
                    </Typography>
                    {proc.procedure_notes && (
                      <Typography variant="caption" color="text.secondary">
                        {proc.procedure_notes}
                      </Typography>
                    )}
                    {proc.status && (
                      <Chip
                        label={proc.status}
                        size="small"
                        color={proc.status === 'completed' ? 'success' : 'default'}
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Attachments */}
          {visit.attachments.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {visit.attachments.length} Attachment(s)
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(3, 1fr)', // Mobile: 3 columns
                    sm: 'repeat(4, 1fr)', // Tablet: 4 columns
                    md: 'repeat(5, 1fr)', // Desktop: 5 columns
                  },
                  gap: 1,
                }}
              >
                {visit.attachments.map((att, index) => (
                  <Box
                    key={att.id || index}
                    onClick={() => onToggleImage(att.id)}
                    sx={{
                      position: 'relative',
                      paddingTop: '100%', // 1:1 aspect ratio
                      cursor: 'pointer',
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: 2,
                      borderColor: selectedImages.has(att.id) ? 'primary.main' : 'divider',
                      transition: 'all 0.2s ease',
                      bgcolor: 'grey.50',
                      '&:hover': {
                        borderColor: 'primary.light',
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {/* Image */}
                    <Box
                      component="img"
                      src={att.file_path}
                      alt={att.file_name || 'Attachment'}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Selection checkbox overlay */}
                    <Checkbox
                      checked={selectedImages.has(att.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleImage(att.id)}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'white',
                        borderRadius: '50%',
                        padding: 0.5,
                        '& .MuiSvgIcon-root': { fontSize: 20 },
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                    />

                    {/* File type badge */}
                    {att.file_type && (
                      <Chip
                        label={att.file_type.replace('_', ' ')}
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default TimelineItem;
