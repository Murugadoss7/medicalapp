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
  CameraAlt as BeforeIcon,
  CheckCircle as AfterIcon,
  LocalHospital as XrayIcon,
  Science as TestIcon,
  Attachment as OtherIcon,
} from '@mui/icons-material';
import { useToast } from './Toast';
import { TextField, ButtonGroup } from '@mui/material';

type FileTypeOption = 'xray' | 'photo_before' | 'photo_after' | 'test_result' | 'document' | 'other';

interface FileUploadProps {
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  // Legacy prop (kept for backward compatibility)
  fileType?: FileTypeOption;
  // NEW: Smart default file type based on context
  defaultFileType?: FileTypeOption;
  // NEW: Allow caption per file
  allowCaption?: boolean;
  // Legacy callback (kept for backward compatibility)
  onUploadSuccess?: (file: File, fileType: string, caption?: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
  error?: string;
  fileType: FileTypeOption; // NEW: Type per file
  caption?: string; // NEW: Caption per file
}

export const FileUpload = ({
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024,  // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/dicom'],
  fileType = 'document', // Legacy
  defaultFileType, // NEW
  allowCaption = true, // NEW
  onUploadSuccess,
  onUploadError,
  disabled = false,
}: FileUploadProps) => {
  const toast = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: Current default file type (can be changed by user)
  const [currentDefaultType, setCurrentDefaultType] = useState<FileTypeOption>(
    defaultFileType || fileType || 'document'
  );

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
        fileType: currentDefaultType, // NEW: Initialize with default
        caption: '', // NEW: Empty caption
      };

      setFiles(prev => [...prev, uploadedFile]);

      // Simulate upload progress (in real app, this would be actual upload)
      simulateUpload(uploadedFile);
    });
  }, [files, disabled, maxFiles, maxSizeBytes, acceptedTypes, toast, onUploadError, currentDefaultType]);

  // NEW: Update file type for specific file
  const updateFileType = (index: number, newType: FileTypeOption) => {
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, fileType: newType } : f))
    );
  };

  // NEW: Update caption for specific file
  const updateCaption = (index: number, newCaption: string) => {
    setFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, caption: newCaption } : f))
    );
  };

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

    // CRITICAL FIX: Wait for actual backend upload to complete before clearing preview
    // The onUploadSuccess callback is actually async (handleUploadAttachment)
    // We must await it so the file stays visible until backend upload finishes
    if (onUploadSuccess) {
      try {
        // Await the callback (it's async and uploads to backend)
        await onUploadSuccess(uploadedFile.file, uploadedFile.fileType, uploadedFile.caption);

        toast.success(`File uploaded: ${uploadedFile.file.name}`);

        // Only clear after successful backend upload
        setFiles(prev => prev.filter(f => f.file !== uploadedFile.file));

        // Clean up preview URL to prevent memory leaks
        if (uploadedFile.preview) {
          URL.revokeObjectURL(uploadedFile.preview);
        }
      } catch (error) {
        // If upload fails, keep the file in preview and mark it as error
        setFiles(prev =>
          prev.map(f =>
            f.file === uploadedFile.file
              ? { ...f, error: 'Upload failed', progress: 0 }
              : f
          )
        );
        // Error toast is handled by the parent component
      }
    }
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

  // File type options with icons
  const fileTypeOptions = [
    { type: 'photo_before' as FileTypeOption, label: 'Before', icon: <BeforeIcon />, color: '#2196f3' },
    { type: 'photo_after' as FileTypeOption, label: 'After', icon: <AfterIcon />, color: '#4caf50' },
    { type: 'xray' as FileTypeOption, label: 'X-ray', icon: <XrayIcon />, color: '#9c27b0' },
    { type: 'test_result' as FileTypeOption, label: 'Test', icon: <TestIcon />, color: '#ff9800' },
    { type: 'other' as FileTypeOption, label: 'Other', icon: <OtherIcon />, color: '#757575' },
  ];

  return (
    <Box>
      {/* File Type Selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
          File Type (applies to all new files):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {fileTypeOptions.map(({ type, label, icon, color }) => (
            <Button
              key={type}
              variant={currentDefaultType === type ? 'contained' : 'outlined'}
              startIcon={icon}
              onClick={() => setCurrentDefaultType(type)}
              disabled={disabled}
              sx={{
                minHeight: 44, // iPad-friendly
                minWidth: 90,
                fontWeight: currentDefaultType === type ? 600 : 400,
                bgcolor: currentDefaultType === type ? color : 'transparent',
                borderColor: currentDefaultType === type ? color : 'divider',
                color: currentDefaultType === type ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: currentDefaultType === type ? color : 'action.hover',
                  borderColor: color,
                },
              }}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>

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
                  {uploadedFile.progress < 100 && !uploadedFile.error && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadedFile.progress}
                      sx={{ mt: 1 }}
                    />
                  )}

                  {uploadedFile.progress === 100 && !uploadedFile.error && (
                    <Chip
                      label="Uploaded"
                      color="success"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}

                  {/* Error Display */}
                  {uploadedFile.error && (
                    <Chip
                      label={uploadedFile.error}
                      color="error"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}

                  {/* NEW: Per-file type selector */}
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Type:
                    </Typography>
                    <ButtonGroup size="small" variant="outlined">
                      <Button
                        variant={uploadedFile.fileType === 'photo_before' ? 'contained' : 'outlined'}
                        onClick={() => updateFileType(index, 'photo_before')}
                        sx={{ minHeight: 36, fontSize: '0.75rem' }}
                      >
                        Before
                      </Button>
                      <Button
                        variant={uploadedFile.fileType === 'photo_after' ? 'contained' : 'outlined'}
                        onClick={() => updateFileType(index, 'photo_after')}
                        sx={{ minHeight: 36, fontSize: '0.75rem' }}
                      >
                        After
                      </Button>
                      <Button
                        variant={uploadedFile.fileType === 'xray' ? 'contained' : 'outlined'}
                        onClick={() => updateFileType(index, 'xray')}
                        sx={{ minHeight: 36, fontSize: '0.75rem' }}
                      >
                        X-ray
                      </Button>
                      <Button
                        variant={uploadedFile.fileType === 'test_result' ? 'contained' : 'outlined'}
                        onClick={() => updateFileType(index, 'test_result')}
                        sx={{ minHeight: 36, fontSize: '0.75rem' }}
                      >
                        Test
                      </Button>
                    </ButtonGroup>
                  </Box>

                  {/* NEW: Caption field */}
                  {allowCaption && (
                    <TextField
                      placeholder="Add comment (e.g., 'Deep cavity near pulp')"
                      value={uploadedFile.caption || ''}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      rows={2}
                      sx={{ mt: 1.5 }}
                      disabled={disabled}
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
