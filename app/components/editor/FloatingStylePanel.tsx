'use client';

import React, { useEffect } from 'react';
import type { DesignSettings } from '@/app/lib/types';
import AdvancedStyleEditor from '@/app/components/editor/AdvancedStyleEditor';
import { Button } from '@/components/ui/button';

interface FloatingStylePanelProps {
  open: boolean;
  onClose: () => void;
  design: DesignSettings;
  onDesignChange: (design: DesignSettings) => void;
}

export default function FloatingStylePanel({
  open,
  onClose,
  design,
  onDesignChange,
}: FloatingStylePanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex justify-end p-3 pt-[88px] sm:p-6 sm:pt-[96px]">
      {/* Backdrop: pointer-events restored for click-away */}
      <button
        type="button"
        aria-label="스타일 패널 닫기"
        className="pointer-events-auto absolute inset-0 bg-gray-950/20 backdrop-blur-[1px] sm:bg-gray-950/10"
        onClick={onClose}
      />

      <aside
        className="pointer-events-auto relative z-10 flex max-h-[min(720px,calc(100vh-7rem))] w-[min(100%,400px)] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-950/15 ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="floating-style-panel-title"
      >
        {/* Tab grip */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50/90 px-3 py-2 pr-2">
          <span
            id="floating-style-panel-title"
            className="min-w-0 flex-1 pl-1 text-sm font-bold tracking-tight text-gray-900"
          >
            카드 스타일
          </span>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-gray-500" onClick={onClose}>
            <span className="sr-only">닫기</span>
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <AdvancedStyleEditor design={design} onDesignChange={onDesignChange} />
        </div>
      </aside>
    </div>
  );
}
