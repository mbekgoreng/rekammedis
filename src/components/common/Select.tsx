import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  helperText,
  requiredIndicator,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
          {requiredIndicator && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={twMerge(
          clsx(
            'w-full text-sm bg-white rounded-lg border border-slate-300 text-slate-900 py-2 px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-clinical-600 disabled:bg-slate-100 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-400 focus:border-red-500',
            className
          )
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';
