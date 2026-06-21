/** Split message content on blank-line paragraph breaks (same rules as the parser). */
export function splitMessageParagraphs(content: string): string[] | null {
  if (!/\n{2,}/.test(content)) return null;

  const trailingBreak = /\n{2,}$/.test(content);
  const parts = content.split(/\n{2,}/).map(part => part.trim());

  if (trailingBreak) parts.push('');

  const normalized = parts.filter(
    (part, index) => part.length > 0 || (trailingBreak && index === parts.length - 1),
  );

  if (normalized.length <= 1) return null;
  return normalized;
}
