import React from 'react';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Select({
  options,
  value,
  onChange,
  label,
  error,
  leftIcon,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="w-full mb-3 sm:mb-4">
      {label && (        <label className={`block text-sm font-medium mb-1 ${props.required ? 'text-blue-700' : 'text-green-700'}`}>
          {label}
          {props.required ? <span className="text-error-500 ml-1 font-bold">*</span> : 
           !props.disabled && <span className="text-green-500 ml-1 text-xs">(Optional)</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}          
          className={`
            block w-full rounded-md shadow-sm
            focus:border-primary-500 focus:ring-primary-500
            disabled:bg-gray-100 disabled:text-gray-500
            text-sm sm:text-base py-2 px-3 pr-10
            ${error ? 'border-error-300 bg-error-50' : 'border-gray-300'}
            ${props.required ? 'bg-blue-50 border-blue-200 focus:bg-white' : 
              !props.disabled ? 'bg-green-50 border-green-200 focus:bg-white' : ''}
            ${leftIcon ? 'pl-10' : ''}
            appearance-none
            ${!value ? 'text-gray-500' : 'text-gray-900'}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              className={option.value === '' ? 'text-gray-500' : 'text-gray-900'}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}