'use client';

import React, { useEffect, useRef } from 'react';
import { COLORS } from '@/app/lib/constants';
import { balanceFormattingMarkers, parseFormattedText } from '@/app/lib/utils';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markerFor(text: string, bold: boolean, highlight: boolean) {
  if (!text) return '';
  if (bold && highlight) return `**==${text}==**`;
  if (bold) return `**${text}**`;
  if (highlight) return `==${text}==`;
  return text;
}

/** Collapse CRLF / trim runaway blank lines. */
export function sanitizeMarkupNewlines(markup: string): string {
  return markup.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n');
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace(/^#/, '').trim();
  const full = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const v = Number.parseInt(full, 16);
  if (Number.isNaN(v) || full.length !== 6) return [184, 216, 248];
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function rgbStringToRgb(value: string): [number, number, number] | null {
  const m = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!m) return null;
  return [Math.round(Number(m[1])), Math.round(Number(m[2])), Math.round(Number(m[3]))];
}

function rgbClose(a: [number, number, number], b: [number, number, number], tol = 5) {
  return (
    Math.abs(a[0] - b[0]) <= tol
    && Math.abs(a[1] - b[1]) <= tol
    && Math.abs(a[2] - b[2]) <= tol
  );
}

function matchesHighlight(background: string, highlightHex: string): boolean {
  const t = background.trim().toLowerCase();
  if (!t || t === 'transparent' || t === 'rgba(0, 0, 0, 0)' || t === 'rgba(0,0,0,0)') {
    return false;
  }

  const expected = hexToRgb(highlightHex);
  const rgb = rgbStringToRgb(t);
  if (rgb) return rgbClose(rgb, expected);

  if (/#([0-9a-f]{3}|[0-9a-f]{6})\b/i.test(t.replace(/\s/g, ''))) {
    try {
      const h = t.includes('#') ? t : `#${t}`;
      return rgbClose(hexToRgb(h), expected);
    } catch {
      return false;
    }
  }

  return false;
}

/** Only treat highlighted inline nodes with a style attribute — avoids bogus computed backgrounds. */
function elementHasToolbarHighlight(el: HTMLElement, highlightHex: string): boolean {
  const tag = el.tagName.toUpperCase();
  if (
    tag !== 'SPAN'
    && tag !== 'FONT'
    && tag !== 'B'
    && tag !== 'STRONG'
    && tag !== 'I'
    && tag !== 'EM'
    && tag !== 'MARK'
    && tag !== 'A') {
    return false;
  }
  const attrs = el.getAttribute('style') ?? '';
  if (!attrs.includes('background')) return false;
  return matchesHighlight(el.style.backgroundColor, highlightHex);
}

function markupToHtml(rawValue: string) {
  const value = balanceFormattingMarkers(rawValue);

  const highlightStyle = [
    `background-color:${COLORS.highlight}`,
    'border-radius:3px',
    'padding:0 2px',
    'box-decoration-break:clone',
    '-webkit-box-decoration-break:clone',
    'line-height:inherit',
  ].join(';');

  return parseFormattedText(value)
    .map((part) => {
      const content = part.text.split('\n').map(escapeHtml).join('<br>');

      const styles = [
        part.bold ? 'font-weight:800' : '',
        part.highlight ? highlightStyle : '',
      ]
        .filter(Boolean)
        .join(';');

      return styles ? `<span style="${styles}">${content}</span>` : content;
    })
    .join('');
}

function isBoldElement(element: HTMLElement): boolean {
  const tag = element.tagName;
  const fontWeight =
    element.style.fontWeight || window.getComputedStyle(element).fontWeight;
  return (
    tag === 'B'
    || tag === 'STRONG'
    || fontWeight === 'bold'
    || fontWeight === 'bolder'
    || Number(fontWeight) >= 600
  );
}

function canonicalMarkup(s: string): string {
  return sanitizeMarkupNewlines(balanceFormattingMarkers(s));
}

function htmlToMarkup(root: HTMLElement): string {
  const hex = COLORS.highlight;

  const walk = (node: Node, bold = false, highlight = false): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return markerFor(node.textContent ?? '', bold, highlight);
    }

    if (node.nodeName === 'BR') {
      return '\n';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toUpperCase();

    /** Layout DIV/P wrappers must not steal computed bold/highlight — fixes line reflow at B/H. */
    const nextBold = ['DIV', 'P'].includes(tag) ? bold : bold || isBoldElement(element);
    const nextHighlight = highlight || elementHasToolbarHighlight(element, hex);

    let text = Array.from(element.childNodes)
      .map((child) => walk(child, nextBold, nextHighlight))
      .join('');

    if ((tag === 'DIV' || tag === 'P') && element.nextSibling) {
      text += '\n';
    }

    return text;
  };

  return Array.from(root.childNodes).map((node) => walk(node)).join('').replace(/\n{5,}/g, '\n\n\n\n');
}

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
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const canon = canonicalMarkup(value);
    if (document.activeElement === editor && canon === lastValueRef.current) return;

    try {
      if (canonicalMarkup(htmlToMarkup(editor)) === canon) return;
    } catch {
      // dom may still be patching; overwrite from props
    }

    editor.innerHTML = markupToHtml(value);
    lastValueRef.current = canon;
  }, [value]);

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const next = sanitizeMarkupNewlines(balanceFormattingMarkers(htmlToMarkup(editor)));
      lastValueRef.current = next;
      onChange(next);
    } catch {
      const fallback =
        sanitizeMarkupNewlines(balanceFormattingMarkers(editor.innerText.replace(/\u00a0/g, ' ') || ''));
      lastValueRef.current = fallback;
      onChange(fallback);
    }
  };

  const insertLineBreak = () => {
    const editor = editorRef.current;
    if (!editor) return false;
    if (typeof document.execCommand === 'function') {
      document.execCommand('insertLineBreak');
      return true;
    }
    return false;
  };

  const applyCommand = (command: 'bold' | 'highlight') => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    try {
      if (command === 'bold') {
        document.execCommand('bold');
      } else {
        document.execCommand('backColor', false, COLORS.highlight);
      }
      requestAnimationFrame(syncValue);
    } catch {
      syncValue();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
        <button
          type="button"
          onMouseDown={(event) => {
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
          onMouseDown={(event) => {
            event.preventDefault();
            applyCommand('highlight');
          }}
          className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
          title="Highlight (Cmd/Ctrl+H)"
        >
          H
        </button>
        <span className="px-1 text-[10px] font-medium text-gray-400">
          Enter 줄바꿈 · Cmd/Ctrl+B/H · Undo
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
        onPaste={() => window.requestAnimationFrame(syncValue)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'h') {
            event.preventDefault();
            applyCommand('highlight');
          }
          const native = event.nativeEvent;
          if (event.key === 'Enter' && !native.isComposing) {
            event.preventDefault();
            if (!insertLineBreak()) {
              document.execCommand('insertHTML', false, '<br>');
            }
            requestAnimationFrame(syncValue);
          }
        }}
      />
    </div>
  );
}
