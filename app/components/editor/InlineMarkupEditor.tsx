'use client';

import React from 'react';
import { COLORS } from '@/app/lib/constants';
import { useContentEditableMarkup } from '@/app/hooks/useContentEditableMarkup';

interface InlineMarkupEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  highlightColor?: string;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onParagraphBreak?: (parts: { before: string; after: string }) => void;
  onSplitParagraphs?: (parts: string[]) => void;
}

export default function InlineMarkupEditor({
  value,
  onChange,
  placeholder,
  highlightColor = COLORS.highlight,
  autoFocus = false,
  className = '',
  style,
  onParagraphBreak,
  onSplitParagraphs,
}: InlineMarkupEditorProps) {
  const { editorRef, syncValue, handleKeyDown, handleKeyDownCapture, handleBeforeInput, handleCompositionStart, handleCompositionEnd, handlePaste } =
    useContentEditableMarkup({
    value,
    onChange,
    highlightColor,
    autoFocus,
    onParagraphBreak,
    onSplitParagraphs,
  });

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      data-placeholder={placeholder}
      className={`outline-none empty:before:text-gray-400/70 empty:before:content-[attr(data-placeholder)] ${className}`}
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word', ...style }}
      onInput={syncValue}
      onBeforeInput={handleBeforeInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onPaste={handlePaste}
      onKeyDownCapture={handleKeyDownCapture}
      onKeyDown={handleKeyDown}
    />
  );
}
