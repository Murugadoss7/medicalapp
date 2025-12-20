/**
 * FileUpload Component
 * Reusable drag-and-drop file upload with validation
 * iPad-friendly design with large touch targets
 */

import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useToast } from './Toast';

interface FileUploadProps {
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];  // ['image/jpeg', 'image/png', 'application/pdf']
  fileType?: 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other';
  onUploadSuccess?: (file: File, fileType: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  preview?: string;  // For image previews
  progress: number;
  error?: string;
}

export const FileUpload = ({
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024,  // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/dicom'],
  fileType = 'document',
  onUploadSuccess,
  onUploadError,
  disabled = false,
}: FileUploadProps) => {
  const toast = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit`;
    }

    // Check file type
    if (!acceptedTypes.some(type => file.type.match(type))) {
      return 'File type not allowed. Allowed: JPG, PNG, PDF, DICOM';
    }

    // Check max files
    if (files.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    return null;
  };

  // Handle file selection
  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const fileArray = Array.from(selectedFiles);

    fileArray.forEach((file) => {
      const error = validateFile(file);

      if (error) {
        toast.error(error);
        if (onUploadError) onUploadError(error);
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      const uploadedFile: UploadedFile = {
        file,
        preview,
        progress: 0,
      };

      setFiles(prev => [...prev, uploadedFile]);

      // Simulate upload progress (in real app, this would be actual upload)
      simulateUpload(uploadedFile);
    });
  }, [files, disabled, maxFiles, maxSizeBytes, acceptedTypes, toast, onUploadError]);

  // Simulate upload progress
  const simulateUpload = async (uploadedFile: UploadedFile) => {
    // In real implementation, this would call the upload API
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));

      setFiles(prev =>
        prev.map(f =>
          f.file === uploadedFile.file ? { ...f, progress } : f
        )
      );
    }

    // Call success callback
    if (onUploadSuccess) {
      onUploadSuccess(uploadedFile.file, fileType);
    }

    toast.success(`File uploaded: ${uploadedFile.file.name}`);
  };

  // Remove file
  const handleRemove = (fileToRemove: UploadedFile) => {
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    setFiles(prev => prev.filter(f => f.file !== fileToRemove.file));
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  // Click to upload
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type === 'application/pdf') return <PdfIcon />;
    return <DocumentIcon />;
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        elevation={isDragging ? 8 : 2}
        sx={{
          p: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: disabled ? 'divider' : 'primary.main',
            backgroundColor: disabled ? 'background.paper' : 'action.hover',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Stack alignItems="center" spacing={2}>
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />

          <Typography variant="h6" align="center">
            Drop files here or click to upload
          </Typography>

          <Typography variant="caption" color="text.secondary" align="center">
            Supported: JPG, PNG, PDF, DICOM
            <br />
            Max size: {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB
            <br />
            Max files: {maxFiles}
          </Typography>

          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            disabled={disabled || files.length >= maxFiles}
            sx={{ minHeight: 44 }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Browse Files
          </Button>
        </Stack>
      </Paper>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="subtitle2">
            Uploaded Files ({files.length}/{maxFiles})
          </Typography>

          {files.map((uploadedFile, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                {/* File Icon or Preview */}
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'action.hover',
                    borderRadius: 1,
                  }}
                >
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    getFileIcon(uploadedFile.file)
                  )}
                </Box>

                {/* File Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {uploadedFile.file.name}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {(uploadedFile.file.size / 1024).toFixed(1)} KB
                  </Typography>

                  {/* Upload Progress */}
                  {uploadedFile.progress < 100 && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadedFile.progress}
                      sx={{ mt: 1 }}
                    />
                  )}

                  {uploadedFile.progress === 100 && (
                    <Chip
                      label="Uploaded"
                      color="success"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>

                {/* Delete Button */}
                <IconButton
                  onClick={() => handleRemove(uploadedFile)}
                  disabled={disabled}
                  size="large"
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default FileUpload;
