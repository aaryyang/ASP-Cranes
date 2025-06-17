import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const toastVariants = cva(
  'pointer-events-auto relative w-full max-w-md overflow-hidden rounded-lg p-3 sm:p-4 shadow-xl border backdrop-blur-sm shadow-lg',
  {
    variants: {
      variant: {
        default: 'bg-white/95 text-gray-900 border-gray-200',
        success: 'bg-success-50/95 text-success-900 border-success-300',
        error: 'bg-error-50/95 text-error-900 border-error-300',
        warning: 'bg-warning-50/95 text-warning-900 border-warning-300',
        info: 'bg-primary-50/95 text-primary-900 border-primary-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title: string;
  description?: string;
  onClose?: () => void;
  duration?: number;
  isVisible?: boolean;
}

function Toast({
  className,
  variant,
  title,
  description,
  onClose,
  duration = 5000,
  isVisible = true,
  ...props
}: ToastProps) {
  const [isOpen, setIsOpen] = useState(isVisible);

  useEffect(() => {
    setIsOpen(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (isOpen && duration !== Infinity) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary-500" />;
      default:
        return null;
    }
  };  return (
    <AnimatePresence>
      {isOpen && (        <motion.div          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 sm:bottom-10 left-4 right-4 sm:left-auto sm:right-8 z-[9999] flex items-center justify-center pointer-events-none"
        >
          <div className={`pointer-events-auto ${toastVariants({ variant, className })}`} {...props}>
            <div className="flex items-start">
              {variant && <div className="flex-shrink-0">{getIcon()}</div>}
              <div className={`${variant ? 'ml-2 sm:ml-3' : ''} flex-1 pt-0.5`}>
                <p className="text-sm font-medium">{title}</p>
                {description && (
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-600 line-clamp-3">{description}</p>
                )}
              </div>
              <div className="ml-2 sm:ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none p-0.5"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Toast,  };