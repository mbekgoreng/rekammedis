import React from 'react';
import { clsx } from 'clsx';

interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className
}) => {
  return (
    <div className={clsx('border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap outline-none',
              isActive
                ? 'border-clinical-600 text-clinical-800 bg-clinical-50/40 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-[11px] px-1.5 py-0.5 rounded-full font-mono font-bold',
                  isActive ? 'bg-clinical-600 text-white' : 'bg-slate-200 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
