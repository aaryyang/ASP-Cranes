import { TextareaHTMLAttributes } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextArea({ label, error, helperText, className = '', ...props }: TextAreaProps) {
  const id = props.id || `textarea-${props.name || Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className="space-y-2">
      {label && (        <label htmlFor={id} className={`block text-sm font-medium ${props.required ? 'text-blue-700' : 'text-green-700'}`}>
          {label}
          {props.required ? <span className="text-error-500 ml-1 font-bold">*</span> : 
           !props.disabled && <span className="text-green-500 ml-1 text-xs">(Optional)</span>}
        </label>
      )}
      <textarea
        id={id}        className={`block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
          error ? 'border-error-300 bg-error-50' : 'border-gray-300'
        } ${props.required ? 'bg-blue-50 border-blue-200 focus:bg-white' : 
           !props.disabled ? 'bg-green-50 border-green-200 focus:bg-white' : ''} ${className}`}
        placeholder={props.placeholder ? `${props.placeholder}${props.required ? ' *' : ''}` : ''}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

TextArea.displayName = 'TextArea';