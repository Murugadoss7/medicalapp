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
        borderColor: selectedVisitsCount > 0 ? 'primary.light' : 'divider',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: selectedVisitsCount > 0 ? 'primary.light' : 'grey.100',
          color: selectedVisitsCount > 0 ? 'primary.contrastText' : 'text.primary',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 60, // iPad-friendly
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
                bgcolor: selectedVisitsCount > 0 ? 'white' : 'primary.main',
                color: selectedVisitsCount > 0 ? 'primary.main' : 'white',
                fontWeight: 600,
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

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
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
