import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, Slide, IconButton, Box, Typography } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import type { SlideProps } from '@mui/material/Slide';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export interface ToastOptions {
  message: string;
  severity?: AlertColor;
  duration?: number;
  title?: string;
}

interface Toast extends ToastOptions {
  id: string;
  open: boolean;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const getIcon = (severity: AlertColor) => {
  switch (severity) {
    case 'success':
      return <CheckCircleOutlineIcon fontSize="inherit" />;
    case 'error':
      return <ErrorOutlineIcon fontSize="inherit" />;
    case 'warning':
      return <WarningAmberIcon fontSize="inherit" />;
    case 'info':
      return <InfoOutlinedIcon fontSize="inherit" />;
    default:
      return null;
  }
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      message: options.message,
      severity: options.severity || 'info',
      duration: options.duration || 4000,
      title: options.title,
      open: true,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const success = useCallback((message: string, title?: string) => {
    showToast({ message, severity: 'success', title, duration: 3000 });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ message, severity: 'error', title, duration: 5000 });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ message, severity: 'warning', title, duration: 4000 });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ message, severity: 'info', title, duration: 4000 });
  }, [showToast]);

  const handleClose = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, open: false } : toast
      )
    );
    // Remove toast after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          autoHideDuration={toast.duration}
          onClose={() => handleClose(toast.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            bottom: { xs: 16 + index * 80, sm: 24 + index * 80 },
            right: { xs: 16, sm: 24 },
          }}
        >
          <Alert
            severity={toast.severity}
            icon={getIcon(toast.severity || 'info')}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => handleClose(toast.id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              minWidth: 300,
              maxWidth: 450,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: 24,
                alignItems: 'center',
              },
              '& .MuiAlert-message': {
                width: '100%',
              },
              '& .MuiAlert-action': {
                alignItems: 'flex-start',
                pt: 0.5,
              },
            }}
          >
            <Box>
              {toast.title && (
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.25 }}
                >
                  {toast.title}
                </Typography>
              )}
              <Typography variant="body2" sx={{ opacity: toast.title ? 0.9 : 1 }}>
                {toast.message}
              </Typography>
            </Box>
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
