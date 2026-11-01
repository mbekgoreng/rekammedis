import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  noPadding = false,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge('bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden', className)}
      {...props}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-semibold text-slate-800 text-base tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};
