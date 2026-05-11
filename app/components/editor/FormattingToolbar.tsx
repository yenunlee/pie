'use client';

import React from 'react';

type FormatType = 'bold' | 'highlight';

const FORMAT_MARKERS: Record<FormatType, string> = {
  bold: '**',
  highlight: '==',
};

export function applyTextFormat(
  textarea: HTMLTextAreaElement,
  value: string,
  format: FormatType,
  onChange: (value: string) => void
) {
  const marker = FORMAT_MARKERS[format];
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const fallback = format === 'bold' ? 'bold text' : 'highlight text';
  const wrapped = `${marker}${selected || fallback}${marker}`;
  const next = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;

  onChange(next);

  requestAnimationFrame(() => {
    textarea.focus();
    const selectionStart = start + marker.length;
    const selectionEnd = selectionStart + (selected || fallback).length;
    textarea.setSelectionRange(selectionStart, selectionEnd);
  });
}

export function handleFormatShortcut(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (value: string) => void
) {
  if (!(event.metaKey || event.ctrlKey)) return;

  const key = event.key.toLowerCase();
  if (key !== 'b' && key !== 'h') return;

  event.preventDefault();
  applyTextFormat(textarea, value, key === 'b' ? 'bold' : 'highlight', onChange);
}

export default function FormattingToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}) {
  const apply = (format: FormatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    applyTextFormat(textarea, value, format, onChange);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
      <button
        type="button"
        onClick={() => apply('bold')}
        className="rounded-md px-2 py-1 text-xs font-black text-gray-700 hover:bg-gray-100"
        title="Bold (Cmd/Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => apply('highlight')}
        className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
        title="Highlight (Cmd/Ctrl+H)"
      >
        H
      </button>
      <span className="px-1 text-[10px] font-medium text-gray-400">⌘/Ctrl+B · ⌘/Ctrl+H</span>
    </div>
  );
}
