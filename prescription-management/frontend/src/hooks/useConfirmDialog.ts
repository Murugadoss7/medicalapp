import { useState, useCallback } from 'react';
import type { ConfirmVariant } from '../components/common/ConfirmDialog';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  onConfirm: () => void;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

export const useConfirmDialog = () => {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'info',
    onConfirm: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'info',
        onConfirm: () => {
          setState((prev) => ({ ...prev, open: false }));
          resolve(true);
        },
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    dialogProps: {
      open: state.open,
      title: state.title,
      message: state.message,
      confirmText: state.confirmText,
      cancelText: state.cancelText,
      variant: state.variant,
      onConfirm: state.onConfirm,
      onCancel: handleCancel,
    },
    confirm,
  };
};
