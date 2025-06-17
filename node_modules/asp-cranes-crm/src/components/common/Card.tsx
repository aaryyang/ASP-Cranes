import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg bg-white w-full transition-shadow',
  {
    variants: {
      variant: {
        default: 'shadow-sm hover:shadow-md',
        bordered: 'border border-gray-200',
        flat: '',
      },
      padding: {
        none: '',
        sm: 'p-2 sm:p-3 md:p-4',
        md: 'p-3 sm:p-4 md:p-5',
        lg: 'p-4 sm:p-5 md:p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component
        className={`${cardVariants({ variant, padding, className })} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`p-3 sm:p-4 md:p-6 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-base sm:text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-3 sm:p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

const CardFooter = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={`flex flex-col sm:flex-row items-center gap-3 p-3 sm:p-4 md:p-6 pt-0 ${className}`}
    {...props} 
  />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardFooter };