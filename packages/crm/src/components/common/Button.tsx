import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variants = {
  default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  destructive: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
};

const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base',
  lg: 'px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg',
};

export function Button({
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading,
  fullWidth,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}      {leftIcon && !isLoading && <span className="mr-1.5 sm:mr-2 flex-shrink-0 flex items-center">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {rightIcon && <span className="ml-1.5 sm:ml-2 flex-shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
}