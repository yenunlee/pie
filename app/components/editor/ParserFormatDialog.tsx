'use client';

import { useEffect } from 'react';
import { PIE_DOCUMENT_FORMAT_GUIDE } from '@/app/lib/pie-document-format-guide';
import { Button } from '@/components/ui/button';

interface ParserFormatDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ParserFormatDialog({ open, onClose }: ParserFormatDialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-gray-950/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parser-format-title"
        className="relative z-10 flex max-h-[min(640px,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p id="parser-format-title" className="text-sm font-semibold text-gray-900">
              Parser format reference
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Word 붙여넣기 · Q/A 라벨 · [META]/[ABSTRACT]/[INTERVIEW]
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-gray-500" onClick={onClose}>
            <span className="sr-only">닫기</span>
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <pre className="flex-1 overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[11px] leading-relaxed text-gray-700">
          {PIE_DOCUMENT_FORMAT_GUIDE}
        </pre>
      </div>
    </div>
  );
}
