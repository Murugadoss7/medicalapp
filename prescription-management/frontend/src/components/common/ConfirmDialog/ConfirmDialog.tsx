import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const getVariantConfig = (variant: ConfirmVariant) => {
  switch (variant) {
    case 'danger':
      return {
        icon: <DeleteOutlineIcon sx={{ fontSize: 40 }} />,
        color: '#d32f2f',
        bgColor: '#ffebee',
        buttonColor: 'error' as const,
      };
    case 'warning':
      return {
        icon: <WarningAmberIcon sx={{ fontSize: 40 }} />,
        color: '#ed6c02',
        bgColor: '#fff4e5',
        buttonColor: 'warning' as const,
      };
    case 'info':
    default:
      return {
        icon: <HelpOutlineIcon sx={{ fontSize: 40 }} />,
        color: '#0288d1',
        bgColor: '#e3f2fd',
        buttonColor: 'primary' as const,
      };
  }
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  onConfirm,
  onCancel,
}) => {
  const config = getVariantConfig(variant);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onCancel}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'grey.500',
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle sx={{ pb: 1, pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: config.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: config.color,
            }}
          >
            {config.icon}
          </Box>
          <Typography variant="h6" component="div" textAlign="center" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText textAlign="center" sx={{ color: 'text.secondary' }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: 'center' }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={config.buttonColor}
          sx={{
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
          }}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
