import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-1.5 sm:px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-800',
        secondary: 'bg-secondary-100 text-secondary-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-800',
        outline: 'text-gray-700 border border-gray-200',
      },
      size: {
        xs: 'text-[10px] px-1 sm:px-1.5 py-0.5 min-w-[16px] h-[16px]',
        sm: 'text-[11px] px-1.5 sm:px-2 py-0.5 min-w-[18px] h-[18px]',
        md: 'text-xs px-1.5 sm:px-2.5 py-0.5 min-w-[20px] h-[20px]',
        lg: 'text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 min-w-[22px] h-[22px] sm:min-w-[24px] sm:h-[24px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, size, className })} {...props} />
  );
}

export { Badge };