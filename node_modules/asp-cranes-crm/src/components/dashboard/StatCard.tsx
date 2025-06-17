import React from 'react';
import { Card } from '../common/Card';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva(
  'rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-white',
        primary: 'bg-primary-50',
        secondary: 'bg-secondary-50',
        accent: 'bg-accent-50',
        success: 'bg-success-50',
        warning: 'bg-warning-50',
        error: 'bg-error-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  footer?: React.ReactNode;
}

export function StatCard({
  className,
  variant,
  title,
  value,
  icon,
  trend,
  footer,
  ...props
}: StatCardProps) {
  return (
    <Card
      className={statCardVariants({ variant, className })}
      padding="lg"
      {...props}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          
          {trend && (
            <div className="mt-1 flex items-center">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {trend.isPositive ? '+' : '-'}
                {Math.abs(trend.value)}%
              </span>
              <span className="ml-1 text-xs text-gray-500">from last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-2 rounded-md ${variant !== 'default' ? 'bg-white/60' : 'bg-gray-100'}`}>
            {icon}
          </div>
        )}
      </div>
      
      {footer && <div className="mt-4 pt-4 border-t border-gray-200">{footer}</div>}
    </Card>
  );
}