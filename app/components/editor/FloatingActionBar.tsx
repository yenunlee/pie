'use client';

import React from 'react';

export interface FloatingActionBarAction {
  id: string;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}

interface FloatingActionBarProps {
  label: string;
  actions: FloatingActionBarAction[];
  onClear?: () => void;
  clearLabel?: string;
}

const variantClass: Record<NonNullable<FloatingActionBarAction['variant']>, string> = {
  default: 'hover:bg-gray-700',
  success: 'hover:bg-emerald-700',
  warning: 'hover:bg-amber-700',
  danger: 'hover:bg-red-700',
};

export default function FloatingActionBar({
  label,
  actions,
  onClear,
  clearLabel = 'Clear',
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-gray-900 px-5 py-3 text-white shadow-2xl">
      <span className="whitespace-nowrap text-sm font-medium">{label}</span>
      {actions.length > 0 && (
        <>
          <div className="h-4 w-px bg-gray-700" />
          <div className="flex items-center gap-1.5">
            {actions.map(action => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={`flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[action.variant ?? 'default']}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
      {onClear && (
        <>
          <div className="h-4 w-px bg-gray-700" />
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 transition-colors hover:text-white"
          >
            {clearLabel}
          </button>
        </>
      )}
    </div>
  );
}
