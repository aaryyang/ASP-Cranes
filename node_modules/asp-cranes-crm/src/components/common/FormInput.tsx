import { InputHTMLAttributes } from 'react';
import { Input } from './Input';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export function FormInput({
  label,
  helperText,
  error,
  fullWidth = true,
  className = '',
  type = 'text',
  id,
  name,
  ...props
}: FormInputProps) {
  // Generate a unique id if none provided
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '_') || 'form_input';
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1 mb-3 sm:mb-4`}>
      {label && (        <label 
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 ${props.required ? 'text-blue-700' : 'text-green-700'}`}
        >
          {label}
          {props.required ? <span className="text-error-500 ml-1 font-bold">*</span> : 
           !props.disabled && <span className="text-green-500 ml-1 text-xs">(Optional)</span>}
        </label>
      )}
      <Input
        id={inputId}
        name={name || inputId}
        type={type}
        className={`${fullWidth ? 'w-full' : ''} ${error ? 'border-error-500' : ''} text-sm sm:text-base ${className}`}
        {...props}
        // Remove spinners from number inputs
        onWheel={type === 'number' ? (e) => e.currentTarget.blur() : undefined}
        onKeyDown={
          type === 'number'
            ? (e) => {
                if (e.key === '-' || e.key === 'e' || e.key === '.') {
                  e.preventDefault();
                }
              }
            : undefined
        }
      />
      {helperText && !error && (
        <p className="text-xs sm:text-sm text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-xs sm:text-sm text-error-500">{error}</p>
      )}
    </div>
  );
}