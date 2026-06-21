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
    <aside
      className="fixed bottom-0 right-0 top-[73px] z-40 flex w-[min(100%,400px)] flex-col border-l border-gray-200 bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.06)] sm:top-[81px]"
      role="dialog"
      aria-modal="false"
      aria-labelledby="floating-style-panel-title"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50/90 px-3 py-2.5 pr-2">
        <div className="min-w-0 flex-1 pl-1">
          <span id="floating-style-panel-title" className="text-sm font-bold tracking-tight text-gray-900">
            카드 스타일
          </span>
          <p className="text-[10px] text-gray-400">왼쪽 미리보기에 즉시 반영됩니다</p>
        </div>
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
  );
}
