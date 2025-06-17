import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  name?: string;
  id?: string;
}

export function Input({ label, error, className = '', leftIcon, rightIcon, name, id, ...props }: InputProps) {
  const inputProps = { ...props };

  const inputName = name || id || props.placeholder?.toLowerCase().replace(/\s+/g, '_') || 'input_field';

  return (
    <div className="space-y-1.5">
      {label && (        <label className={`block text-xs sm:text-sm font-medium ${props.required ? 'text-blue-700' : 'text-green-700'}`}>
          {label}
          {props.required ? <span className="text-error-500 ml-1 font-bold">*</span> : 
           !props.disabled && <span className="text-green-500 ml-1 text-xs">(Optional)</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">
            {leftIcon}
          </div>
        )}
        <input
          name={inputName}
          id={id || inputName}          className={`
            block w-full rounded-md
            shadow-sm
            focus:border-primary-500 focus:ring-primary-500 
            disabled:bg-gray-100 disabled:text-gray-500
            text-sm sm:text-base
            py-1.5 sm:py-2            ${error ? 'border-error-300 bg-error-50' : 'border-gray-300'}
            ${props.required ? 'bg-blue-50 border-blue-200 focus:bg-white' : 
              !props.disabled ? 'bg-green-50 border-green-200 focus:bg-white' : ''}
            ${leftIcon ? 'pl-8 sm:pl-10' : ''}
            ${rightIcon ? 'pr-8 sm:pr-10' : ''}
            ${className}
          `}          placeholder={props.placeholder ? `${props.placeholder}${props.required ? ' *' : ''}` : ''}
          {...inputProps}
        />
        {rightIcon && (
          <div className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}