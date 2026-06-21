'use client';

import { useState } from 'react';
import { PIE_DOCUMENT_FORMAT_GUIDE } from '@/app/lib/pie-document-format-guide';

interface ParserFormatGuideProps {
  defaultOpen?: boolean;
  className?: string;
}

export default function ParserFormatGuide({ defaultOpen = false, className = '' }: ParserFormatGuideProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border border-gray-100 bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Parser Format Reference
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            Word 붙여넣기 · Q/A 라벨 · [META]/[ABSTRACT]/[INTERVIEW] 섹션
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-4 pb-4">
          <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-gray-100 bg-gray-50 p-3 font-mono text-[11px] leading-relaxed text-gray-700">
            {PIE_DOCUMENT_FORMAT_GUIDE}
          </pre>
        </div>
      )}
    </div>
  );
}
