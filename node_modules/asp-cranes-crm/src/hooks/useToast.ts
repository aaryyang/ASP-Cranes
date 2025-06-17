import { useState } from 'react';

interface Toast {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (toast: Toast) => {
    setToast(toast);
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToast(null);
      }, toast.duration || 3000);
    }
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast
  };
} 