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

export function sanitizeMarkupNewlines(markup: string): string {
  return markup.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n');
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace(/^#/, '').trim();
  const full = n.length === 3 ? n.split('').map(c => c + c).join('') : n;
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
    && tag !== 'A'
  ) {
    return false;
  }
  const attrs = el.getAttribute('style') ?? '';
  if (!attrs.includes('background')) return false;
  return matchesHighlight(el.style.backgroundColor, highlightHex);
}

export function markupToHtml(rawValue: string, highlightColor = COLORS.highlight) {
  const value = balanceFormattingMarkers(rawValue);

  const highlightStyle = [
    `background-color:${highlightColor}`,
    'border-radius:3px',
    'padding:0 2px',
    'box-decoration-break:clone',
    '-webkit-box-decoration-break:clone',
    'line-height:inherit',
  ].join(';');

  return parseFormattedText(value)
    .map(part => {
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
  const fontWeight = element.style.fontWeight || window.getComputedStyle(element).fontWeight;
  return (
    tag === 'B'
    || tag === 'STRONG'
    || fontWeight === 'bold'
    || fontWeight === 'bolder'
    || Number(fontWeight) >= 600
  );
}

export function canonicalMarkup(s: string): string {
  return sanitizeMarkupNewlines(balanceFormattingMarkers(s));
}

export function htmlToMarkup(root: HTMLElement, highlightColor = COLORS.highlight): string {
  const walk = (node: Node, bold = false, highlight = false): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return markerFor(node.textContent ?? '', bold, highlight);
    }
    if (node.nodeName === 'BR') return '\n';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const element = node as HTMLElement;
    const tag = element.tagName.toUpperCase();
    const nextBold = ['DIV', 'P'].includes(tag) ? bold : bold || isBoldElement(element);
    const nextHighlight = highlight || elementHasToolbarHighlight(element, highlightColor);

    let text = Array.from(element.childNodes)
      .map(child => walk(child, nextBold, nextHighlight))
      .join('');

    if ((tag === 'DIV' || tag === 'P') && element.nextSibling) {
      text += '\n';
    }

    return text;
  };

  return Array.from(root.childNodes).map(node => walk(node)).join('').replace(/\n{5,}/g, '\n\n\n\n');
}

export function splitMarkupAtSelection(
  editor: HTMLElement,
  highlightColor = COLORS.highlight,
): { before: string; after: string } {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    const full = syncMarkupFromEditor(editor, highlightColor);
    return { before: full, after: '' };
  }

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer)) {
    const full = syncMarkupFromEditor(editor, highlightColor);
    return { before: full, after: '' };
  }

  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(editor);
  beforeRange.setEnd(range.startContainer, range.startOffset);

  const afterRange = document.createRange();
  afterRange.selectNodeContents(editor);
  afterRange.setStart(range.endContainer, range.endOffset);

  const beforeEl = document.createElement('div');
  beforeEl.appendChild(beforeRange.cloneContents());
  const afterEl = document.createElement('div');
  afterEl.appendChild(afterRange.cloneContents());

  return {
    before: syncMarkupFromEditor(beforeEl, highlightColor),
    after: syncMarkupFromEditor(afterEl, highlightColor),
  };
}

/** True when Enter should split into a new bubble (cursor on a blank line). */
export function getBubbleParagraphSplitAtEnter(
  editor: HTMLElement,
  highlightColor = COLORS.highlight,
): { before: string; after: string } | null {
  const { before, after } = splitMarkupAtSelection(editor, highlightColor);
  if (!before.endsWith('\n')) return null;

  const afterNormalized = after.replace(/^\n+/, '');
  if (afterNormalized.length > 0) return null;

  return {
    before: before.replace(/\n+$/, ''),
    after: afterNormalized,
  };
}

export function syncMarkupFromEditor(
  editor: HTMLElement,
  highlightColor = COLORS.highlight,
): string {
  try {
    return sanitizeMarkupNewlines(balanceFormattingMarkers(htmlToMarkup(editor, highlightColor)));
  } catch {
    return sanitizeMarkupNewlines(balanceFormattingMarkers(editor.innerText.replace(/\u00a0/g, ' ') || ''));
  }
}

export function applyMarkupCommand(
  editor: HTMLElement,
  command: 'bold' | 'highlight',
  highlightColor = COLORS.highlight,
  onSync?: (value: string) => void,
) {
  editor.focus();
  try {
    if (command === 'bold') {
      document.execCommand('bold');
    } else {
      document.execCommand('backColor', false, highlightColor);
    }
    if (onSync) requestAnimationFrame(() => onSync(syncMarkupFromEditor(editor, highlightColor)));
  } catch {
    onSync?.(syncMarkupFromEditor(editor, highlightColor));
  }
}

export function insertBubbleLineBreak(editor: HTMLElement): void {
  editor.focus();
  document.execCommand('insertHTML', false, '<br>');

  const selection = window.getSelection();
  if (!selection) return;

  const lastBreak = editor.querySelector('br:last-of-type');
  if (!lastBreak) return;

  const range = document.createRange();
  range.setStartAfter(lastBreak);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function runEditorHistoryCommand(
  editor: HTMLElement,
  command: 'undo' | 'redo',
  highlightColor = COLORS.highlight,
  onSync?: (value: string) => void,
) {
  editor.focus();
  try {
    document.execCommand(command);
  } catch {
    // browser may reject; still sync DOM
  }
  if (onSync) {
    requestAnimationFrame(() => onSync(syncMarkupFromEditor(editor, highlightColor)));
  }
}
