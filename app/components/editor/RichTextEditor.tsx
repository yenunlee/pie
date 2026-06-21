'use client';

import React from 'react';
import { COLORS } from '@/app/lib/constants';
import { useContentEditableMarkup } from '@/app/hooks/useContentEditableMarkup';
import { applyMarkupCommand } from '@/app/lib/markup-editor-core';

export { sanitizeMarkupNewlines } from '@/app/lib/markup-editor-core';

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 120,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const { editorRef, syncValue, handleKeyDown, handleKeyDownCapture, handleBeforeInput, handleCompositionStart, handleCompositionEnd, handlePaste, pushUndoSnapshot } =
    useContentEditableMarkup({
    value,
    onChange,
    highlightColor: COLORS.highlight,
  });

  const applyCommand = (command: 'bold' | 'highlight') => {
    const editor = editorRef.current;
    if (!editor) return;
    pushUndoSnapshot();
    applyMarkupCommand(editor, command, COLORS.highlight, onChange);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            applyCommand('bold');
          }}
          className="rounded-md px-2 py-1 text-xs font-black text-gray-700 hover:bg-gray-100"
          title="Bold (Cmd/Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={event => {
            event.preventDefault();
            applyCommand('highlight');
          }}
          className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
          title="Highlight (Cmd/Ctrl+H)"
        >
          H
        </button>
        <span className="px-1 text-[10px] font-medium text-gray-400">
          Enter 줄바꿈 · Cmd/Ctrl+B/H · Cmd/Ctrl+Z · Cmd/Ctrl+Shift+Z
        </span>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={placeholder}
        data-placeholder={placeholder}
        className="rich-text-editor w-full rounded-md border border-gray-200 px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-200 empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
        style={{ minHeight, whiteSpace: 'pre-wrap' }}
        onInput={syncValue}
        onBeforeInput={handleBeforeInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        onKeyDownCapture={handleKeyDownCapture}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
