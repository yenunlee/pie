import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensure marker pairs (** / ==) are balanced so unfinished toggles cannot leak formatting to the tail. */
export function balanceFormattingMarkers(text: string): string {
  let s = text;
  const doubles = ((s.match(/\*\*/g) ?? []).length);
  const eqpairs = ((s.match(/==/g) ?? []).length);
  if (doubles % 2 === 1) s += '**';
  if (eqpairs % 2 === 1) s += '==';
  return s;
}

export function parseFormattedText(text: string): Array<{ text: string; highlight: boolean; bold: boolean }> {
  try {
    const parts: Array<{ text: string; highlight: boolean; bold: boolean }> = [];
    const regex = /(==|\*\*)/g;
    let lastIndex = 0;
    let match;
    let highlight = false;
    let bold = false;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), highlight, bold });
      }

      if (match[1] === '==') {
        highlight = !highlight;
      } else {
        bold = !bold;
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight, bold });
    }

    return parts.length ? parts : [{ text, highlight: false, bold: false }];
  } catch {
    return [{ text, highlight: false, bold: false }];
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
