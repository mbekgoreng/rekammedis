import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
