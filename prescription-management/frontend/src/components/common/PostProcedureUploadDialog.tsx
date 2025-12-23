/**
 * Post-Procedure Upload Dialog
 * Reusable dialog for uploading "After" photos when procedure is marked complete
 * Used in both Consultation page and Treatment Dashboard
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import FileUpload from './FileUpload';

interface PostProcedureUploadDialogProps {
  open: boolean;
  procedureName: string;
  toothNumbers: string[];
  onClose: () => void;
  onUploadComplete: (file: File, fileType: string, caption?: string) => Promise<void>;
  onSkip: () => void;
}

const PostProcedureUploadDialog: React.FC<PostProcedureUploadDialogProps> = ({
  open,
  procedureName,
  toothNumbers,
  onClose,
  onUploadComplete,
  onSkip,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, fileType: string, caption?: string) => {
    setUploading(true);
    try {
      await onUploadComplete(file, fileType, caption);
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Procedure Completed!
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {procedureName} • Tooth {toothNumbers.join(', ')}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="success" icon={<CameraIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600}>
            Add Post-Procedure Photos (Optional)
          </Typography>
          <Typography variant="caption">
            Document the treatment outcome with "After" photos and comments
          </Typography>
        </Alert>

        <FileUpload
          maxFiles={5}
          maxSizeBytes={10 * 1024 * 1024}
          acceptedTypes={['image/jpeg', 'image/png', 'application/pdf', 'application/dicom']}
          defaultFileType="photo_after" // Smart default for post-procedure
          allowCaption={true}
          onUploadSuccess={handleUpload}
          disabled={uploading}
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          💡 Tip: Add detailed comments about the outcome, healing status, or any observations
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleSkip}
          variant="outlined"
          disabled={uploading}
          sx={{ minHeight: 44 }}
        >
          Skip for Now
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          disabled={uploading}
          sx={{ minHeight: 44 }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PostProcedureUploadDialog;
