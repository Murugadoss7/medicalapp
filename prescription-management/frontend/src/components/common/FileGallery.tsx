/**
 * FileGallery Component
 * Displays uploaded files in a grid layout with preview and actions
 * iPad-friendly with lightbox for images
 */

import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  ButtonGroup,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface FileAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other';
  file_size: number;
  mime_type: string;
  caption?: string;
  created_at: string;
}

interface FileGalleryProps {
  attachments: FileAttachment[];
  onDelete?: (attachmentId: string) => void;
  onDownload?: (attachment: FileAttachment) => void;
  onUpdateCaption?: (attachmentId: string, caption: string) => Promise<void>;
  filterType?: string | null;  // Filter by file_type
  readOnly?: boolean;
}

export const FileGallery = ({
  attachments,
  onDelete,
  onDownload,
  onUpdateCaption,
  filterType = null,
  readOnly = false,
}: FileGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<FileAttachment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(filterType);

  // Caption editing state
  const [editCaptionDialogOpen, setEditCaptionDialogOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileAttachment | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [updatingCaption, setUpdatingCaption] = useState(false);

  // Filter attachments
  const filteredAttachments = selectedFilter
    ? attachments.filter(a => a.file_type === selectedFilter)
    : attachments;

  // Get file icon
  const getFileIcon = (attachment: FileAttachment) => {
    if (attachment.mime_type.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 48 }} />;
    }
    if (attachment.mime_type === 'application/pdf') {
      return <PdfIcon sx={{ fontSize: 48 }} />;
    }
    return <DocumentIcon sx={{ fontSize: 48 }} />;
  };

  // Get file type label
  const getFileTypeLabel = (fileType: string): string => {
    const labels: Record<string, string> = {
      xray: 'X-Ray',
      photo_before: 'Before Photo',
      photo_after: 'After Photo',
      test_result: 'Test Result',
      document: 'Document',
      other: 'Other',
    };
    return labels[fileType] || fileType;
  };

  // Get file type color
  const getFileTypeColor = (fileType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' => {
    const colors: Record<string, any> = {
      xray: 'primary',
      photo_before: 'warning',
      photo_after: 'success',
      test_result: 'info',
      document: 'secondary',
      other: 'default',
    };
    return colors[fileType] || 'default';
  };

  // Open lightbox for images
  const handleOpenLightbox = (attachment: FileAttachment) => {
    if (attachment.mime_type.startsWith('image/')) {
      setLightboxImage(attachment);
      setLightboxOpen(true);
    }
  };

  // Close lightbox
  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
  };

  // Handle delete click
  const handleDeleteClick = (attachment: FileAttachment) => {
    setFileToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (fileToDelete && onDelete) {
      onDelete(fileToDelete.id);
    }
    setDeleteDialogOpen(false);
    setFileToDelete(null);
  };

  // Handle download
  const handleDownload = (attachment: FileAttachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Default download behavior
      window.open(attachment.file_path, '_blank');
    }
  };

  // Handle edit caption click
  const handleEditCaptionClick = (attachment: FileAttachment) => {
    setFileToEdit(attachment);
    setEditedCaption(attachment.caption || '');
    setEditCaptionDialogOpen(true);
  };

  // Confirm caption edit
  const handleConfirmEditCaption = async () => {
    if (fileToEdit && onUpdateCaption) {
      try {
        setUpdatingCaption(true);
        await onUpdateCaption(fileToEdit.id, editedCaption);
        setEditCaptionDialogOpen(false);
        setFileToEdit(null);
      } catch (error) {
        console.error('Failed to update caption:', error);
      } finally {
        setUpdatingCaption(false);
      }
    }
  };

  if (attachments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No files uploaded yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter Buttons */}
      <Box sx={{ mb: 2 }}>
        <ButtonGroup variant="outlined" sx={{ flexWrap: 'wrap' }}>
          <Button
            onClick={() => setSelectedFilter(null)}
            variant={selectedFilter === null ? 'contained' : 'outlined'}
            sx={{ minHeight: 44 }}
          >
            All ({attachments.length})
          </Button>
          <Button
            onClick={() => setSelectedFilter('xray')}
            variant={selectedFilter === 'xray' ? 'contained' : 'outlined'}
            sx={{ minHeight: 44 }}
          >
            X-Rays ({attachments.filter(a => a.file_type === 'xray').length})
          </Button>
          <Button
            onClick={() => setSelectedFilter('photo_before')}
            variant={selectedFilter === 'photo_before' ? 'contained' : 'outlined'}
            sx={{ minHeight: 44 }}
          >
            Before ({attachments.filter(a => a.file_type === 'photo_before').length})
          </Button>
          <Button
            onClick={() => setSelectedFilter('photo_after')}
            variant={selectedFilter === 'photo_after' ? 'contained' : 'outlined'}
            sx={{ minHeight: 44 }}
          >
            After ({attachments.filter(a => a.file_type === 'photo_after').length})
          </Button>
        </ButtonGroup>
      </Box>

      {/* File Grid */}
      <Grid container spacing={2}>
        {filteredAttachments.map((attachment) => {
          const isImage = attachment.mime_type.startsWith('image/');

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={attachment.id}>
              <Card elevation={2}>
                {/* File Preview */}
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '75%',  // 4:3 aspect ratio
                    backgroundColor: 'action.hover',
                    cursor: isImage ? 'pointer' : 'default',
                  }}
                  onClick={() => isImage && handleOpenLightbox(attachment)}
                >
                  {isImage ? (
                    <CardMedia
                      component="img"
                      image={attachment.file_path}
                      alt={attachment.file_name}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      {getFileIcon(attachment)}
                    </Box>
                  )}

                  {/* Zoom icon overlay for images */}
                  {isImage && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '50%',
                        p: 1,
                      }}
                    >
                      <ZoomInIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                  )}
                </Box>

                {/* File Info */}
                <CardContent sx={{ pb: 1 }}>
                  <Stack spacing={1}>
                    <Chip
                      label={getFileTypeLabel(attachment.file_type)}
                      color={getFileTypeColor(attachment.file_type)}
                      size="small"
                    />

                    <Typography variant="caption" noWrap title={attachment.file_name}>
                      {attachment.file_name}
                    </Typography>

                    {attachment.caption && (
                      <Typography variant="caption" color="text.secondary">
                        {attachment.caption}
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      {(attachment.file_size / 1024).toFixed(1)} KB
                    </Typography>
                  </Stack>
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <IconButton
                    onClick={() => handleDownload(attachment)}
                    size="small"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <DownloadIcon />
                  </IconButton>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!readOnly && onUpdateCaption && (
                      <IconButton
                        onClick={() => handleEditCaptionClick(attachment)}
                        size="small"
                        color="primary"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <EditIcon />
                      </IconButton>
                    )}

                    {!readOnly && onDelete && (
                      <IconButton
                        onClick={() => handleDeleteClick(attachment)}
                        size="small"
                        color="error"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {lightboxImage?.file_name}
            </Typography>
            <IconButton onClick={handleCloseLightbox}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {lightboxImage && (
            <img
              src={lightboxImage.file_path}
              alt={lightboxImage.file_name}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
          {lightboxImage?.caption && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {lightboxImage.caption}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => lightboxImage && handleDownload(lightboxImage)}>
            Download
          </Button>
          <Button onClick={handleCloseLightbox}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete File?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{fileToDelete?.file_name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{ minHeight: 44 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Caption Dialog */}
      <Dialog
        open={editCaptionDialogOpen}
        onClose={() => !updatingCaption && setEditCaptionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Edit Caption</Typography>
            <IconButton
              onClick={() => setEditCaptionDialogOpen(false)}
              disabled={updatingCaption}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>File:</strong> {fileToEdit?.file_name}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Caption / Comment"
              placeholder="Add a comment (e.g., 'Deep cavity near pulp', 'Before treatment')"
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              disabled={updatingCaption}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setEditCaptionDialogOpen(false)}
            variant="outlined"
            sx={{ minHeight: 44 }}
            disabled={updatingCaption}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEditCaption}
            variant="contained"
            sx={{ minHeight: 44 }}
            disabled={updatingCaption}
          >
            {updatingCaption ? 'Saving...' : 'Save Caption'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileGallery;
