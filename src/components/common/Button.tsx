import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-clinical-700 hover:bg-clinical-800 text-white shadow-sm focus:ring-clinical-500 active:scale-[0.99]',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 active:scale-[0.99]',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-clinical-500 bg-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500 active:scale-[0.99]',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 active:scale-[0.99]',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300'
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
