/**
 * Tooth Treatment Card - Groups all visits/treatments for a specific tooth
 * Expandable card with timeline of visits
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { ToothTreatmentGroup } from '../../utils/caseStudyHelpers';
import { formatDateRange } from '../../utils/caseStudyHelpers';
import TimelineItem from './TimelineItem';

interface ToothTreatmentCardProps {
  group: ToothTreatmentGroup;
  selectedVisits: Set<string>;
  selectedImages: Set<string>;
  onToggleVisit: (visitId: string) => void;
  onToggleImage: (imageId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const ToothTreatmentCard: React.FC<ToothTreatmentCardProps> = ({
  group,
  selectedVisits,
  selectedImages,
  onToggleVisit,
  onToggleImage,
  onSelectAll,
  onDeselectAll,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Count total attachments
  const totalAttachments = group.visits.reduce(
    (sum, visit) => sum + visit.attachments.length,
    0
  );

  // Count selected items for this tooth
  const selectedVisitsCount = group.visits.filter(v =>
    selectedVisits.has(v.visitId)
  ).length;

  const selectedImagesCount = group.visits
    .flatMap(v => v.attachments)
    .filter(a => selectedImages.has(a.id)).length;

  return (
    <Paper
      elevation={3}
      sx={{
        mb: 3,
        overflow: 'hidden',
        border: 1,
        borderColor: selectedVisitsCount > 0 ? '#667eea' : 'rgba(102, 126, 234, 0.15)',
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: selectedVisitsCount > 0
          ? '0 4px 20px rgba(102, 126, 234, 0.25)'
          : '0 2px 12px rgba(102, 126, 234, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: selectedVisitsCount > 0
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
          color: selectedVisitsCount > 0 ? 'white' : 'text.primary',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 60, // iPad-friendly
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: selectedVisitsCount > 0
              ? 'linear-gradient(135deg, #5568d3 0%, #66348a 100%)'
              : 'linear-gradient(90deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)',
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h6" fontWeight={600}>
              🦷 Tooth {group.toothNumber}
            </Typography>
            <Chip
              label={group.summary.treatmentType}
              size="small"
              sx={{
                background: selectedVisitsCount > 0
                  ? 'white'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: selectedVisitsCount > 0 ? '#667eea' : 'white',
                fontWeight: 600,
                border: selectedVisitsCount > 0 ? '1px solid #667eea' : 'none',
                boxShadow: selectedVisitsCount > 0
                  ? '0 2px 8px rgba(102, 126, 234, 0.2)'
                  : '0 2px 8px rgba(102, 126, 234, 0.3)',
              }}
            />
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {group.summary.totalVisits} visit(s) •
            {group.summary.dateRange && ` ${formatDateRange(group.summary.dateRange)}`}
            {totalAttachments > 0 && ` • ${totalAttachments} attachment(s)`}
          </Typography>

          {selectedVisitsCount > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
              Selected: {selectedVisitsCount} visit(s), {selectedImagesCount} image(s)
            </Typography>
          )}
        </Box>

        <IconButton
          sx={{
            color: 'inherit',
            minWidth: 44,
            minHeight: 44, // iPad
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Timeline (collapsible) */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          {/* Timeline items */}
          {group.visits.map((visit) => (
            <TimelineItem
              key={visit.visitId}
              visit={visit}
              isSelected={selectedVisits.has(visit.visitId)}
              selectedImages={selectedImages}
              onToggleVisit={onToggleVisit}
              onToggleImage={onToggleImage}
            />
          ))}

          {/* Action buttons - Themed */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'rgba(102, 126, 234, 0.15)',
            }}
          >
            <Button
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}
              sx={{
                minHeight: 44, // iPad
                flex: 1,
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#5568d3',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
              }}
            >
              Select All Visits
            </Button>
            <Button
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                onDeselectAll();
              }}
              sx={{
                minHeight: 44, // iPad
                flex: 1,
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#5568d3',
                  background: 'rgba(102, 126, 234, 0.05)',
                },
              }}
            >
              Deselect All
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ToothTreatmentCard;
