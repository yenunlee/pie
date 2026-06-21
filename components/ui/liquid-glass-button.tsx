'use client';

import React from 'react';

/**
 * Liquid-glass pill button (lab45 advanced header).
 * Styles live under `.lgb-*` in globals.css.
 */
export function LiquidGlassButton({
  children,
  onClick,
  className = '',
  disabled = false,
  tone = 'default',
  shape = 'pill',
  size = 'default',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  tone?: 'default' | 'onDark';
  shape?: 'pill' | 'rect';
  size?: 'default' | 'sm' | 'lg';
}) {
  const wrapClass = [
    'lgb-wrap',
    tone === 'onDark' ? 'lgb-on-dark' : '',
    shape === 'rect' ? 'lgb-rect' : '',
    size === 'sm' ? 'lgb-sm' : '',
    size === 'lg' ? 'lgb-lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      <div className="lgb-shadow" aria-hidden="true" />
      <button onClick={onClick} type="button" disabled={disabled}>
        <span>{children}</span>
      </button>
    </div>
  );
}
