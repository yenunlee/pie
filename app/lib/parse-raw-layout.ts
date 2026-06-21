/**
 * Reconstructs text pasted from Word multi-column layouts.
 * Handles tab / wide-space columns, stacked column paste, split Hangul syllables, and duplicates.
 */

const SPATIAL_SPLIT = /\t+| {3,}/;
const HANGUL = /[가-힣]/;

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function isSpatialLine(line: string): boolean {
  return SPATIAL_SPLIT.test(line);
}

function splitSpatialParts(line: string): string[] {
  return line
    .split(SPATIAL_SPLIT)
    .map(part => part.trim())
    .filter(Boolean);
}

function dedupeConsecutive(fragments: string[]): string[] {
  const out: string[] = [];
  for (const frag of fragments) {
    const trimmed = frag.trim();
    if (!trimmed) continue;
    if (out[out.length - 1] === trimmed) continue;
    out.push(trimmed);
  }
  return out;
}

function trailingHangulWord(text: string): string | null {
  const match = text.match(/([가-힣]+)$/);
  return match?.[1] ?? null;
}

const CONTINUATION_START = /^(두|라|하|되|며|고|지|보|내|이|어|운|은)/;

/** True when two adjacent fragments were split mid-word (common in 2-column Word paste). */
export function shouldJoinWithoutSpace(previous: string, next: string): boolean {
  if (!previous || !next) return false;
  if (/[.!?。！？]$/.test(previous.trim())) return false;

  const prev = previous.trimEnd();
  const nxt = next.trimStart();
  const lastChar = prev.slice(-1);
  const firstChar = nxt[0];

  if (HANGUL.test(lastChar) && HANGUL.test(firstChar)) {
    if (lastChar === '바' && nxt.startsWith('라')) return true;

    const trailing = trailingHangulWord(prev);
    if (trailing?.length === 1) {
      if (CONTINUATION_START.test(nxt)) return true;
      if (/[를을]$/.test(prev)) return true;
      return false;
    }
  }

  if (/[a-zA-Z]$/.test(lastChar) && /^[a-z]/.test(firstChar)) {
    const lastWord = prev.match(/([a-zA-Z]+)$/);
    if (lastWord && lastWord[1].length <= 2) return true;
  }

  return false;
}

function mergeFragmentStream(fragments: string[]): string[] {
  const merged: string[] = [];

  for (const frag of fragments) {
    const trimmed = frag.trim();
    if (!trimmed) continue;

    const prev = merged[merged.length - 1];
    if (prev && shouldJoinWithoutSpace(prev, trimmed)) {
      merged[merged.length - 1] = prev + trimmed;
      continue;
    }

    merged.push(trimmed);
  }

  return merged;
}

function flattenSpatialRows(lines: string[]): string[] {
  const fragments: string[] = [];

  for (const line of lines) {
    const parts = splitSpatialParts(line);

    if (parts.length === 0) continue;

    if (parts.length === 1 && !isSpatialLine(line) && fragments.length > 0) {
      const prev = fragments[fragments.length - 1];
      if (shouldJoinWithoutSpace(prev, parts[0])) {
        fragments[fragments.length - 1] = prev + parts[0];
        continue;
      }
    }

    fragments.push(parts[0]);
    for (let i = 1; i < parts.length; i += 1) {
      fragments.push(parts[i]);
    }
  }

  return mergeFragmentStream(dedupeConsecutive(fragments));
}

function isShortFragmentLine(line: string): boolean {
  const t = line.trim();
  return t.length > 0 && t.length <= 96 && !/[.!?。！？]$/.test(t);
}

function flattenStackedColumns(lines: string[]): string[] {
  const trimmed = lines.map(line => line.trim()).filter(Boolean);
  if (trimmed.length < 4) return trimmed;

  const half = Math.ceil(trimmed.length / 2);
  const left = trimmed.slice(0, half);
  const right = trimmed.slice(half);
  const rows = Math.max(left.length, right.length);
  const fragments: string[] = [];

  for (let i = 0; i < rows; i += 1) {
    if (left[i]) fragments.push(left[i]);
    if (right[i]) fragments.push(right[i]);
  }

  return mergeFragmentStream(dedupeConsecutive(fragments));
}

function isStackedColumnRun(lines: string[]): boolean {
  const content = lines.map(l => l.trim()).filter(Boolean);
  if (content.length < 4) return false;
  if (content.some(isSpatialLine)) return false;

  const shortCount = content.filter(isShortFragmentLine).length;
  return shortCount / content.length >= 0.75;
}

function scoreMergedSentences(fragments: string[]): number {
  if (fragments.length === 0) return 0;
  let score = 0;
  for (const frag of fragments) {
    if (/[.!?。！？]$/.test(frag.trim())) score += 2;
    if (frag.length >= 12) score += 1;
    const trailing = trailingHangulWord(frag);
    if (trailing?.length === 1) score -= 2;
  }
  return score;
}

function reconstructColumnRun(lines: string[]): string[] {
  const content = lines.filter(line => line.trim());
  if (content.length === 0) return [];

  if (content.some(isSpatialLine)) {
    return flattenSpatialRows(content);
  }

  if (isStackedColumnRun(content)) {
    const stacked = flattenStackedColumns(content);
    const plain = mergeFragmentStream(dedupeConsecutive(content.map(l => l.trim()).filter(Boolean)));
    return scoreMergedSentences(stacked) >= scoreMergedSentences(plain) ? stacked : plain;
  }

  return mergeFragmentStream(dedupeConsecutive(content.map(l => l.trim()).filter(Boolean)));
}

export type RawLayoutKind = 'plain' | 'spatial-columns' | 'stacked-columns';

export interface RawLayoutResult {
  text: string;
  layout: RawLayoutKind;
  note?: string;
}

/** Normalize raw pasted document text before PIE section / Q&A parsing. */
export function reconstructRawDocumentText(raw: string): RawLayoutResult {
  const normalized = normalizeNewlines(raw).trim();
  if (!normalized) return { text: '', layout: 'plain' };

  const lines = normalized.split('\n');
  const output: string[] = [];
  let layout: RawLayoutKind = 'plain';
  let reconstructedRuns = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    const runStart = i;
    const run: string[] = [];

    if (trimmed && (isSpatialLine(line) || isShortFragmentLine(line))) {
      while (i < lines.length) {
        const current = lines[i];
        const currentTrim = current.trim();
        if (!currentTrim) {
          if (run.length > 0) break;
          i += 1;
          continue;
        }

        const runIsSpatial = run.some(isSpatialLine) || isSpatialLine(current);

        if (run.length > 0) {
          const runHasSpatial = run.some(isSpatialLine);
          if (runHasSpatial && !isSpatialLine(current) && !isShortFragmentLine(current)) break;
          if (!runHasSpatial && !isShortFragmentLine(current)) break;
        }

        run.push(current);
        i += 1;
      }

      if (run.length >= 2 && (run.some(isSpatialLine) || isStackedColumnRun(run))) {
        const reconstructed = reconstructColumnRun(run);
        if (reconstructed.length > 0) {
          layout = run.some(isSpatialLine) ? 'spatial-columns' : 'stacked-columns';
          reconstructedRuns += 1;
          output.push(reconstructed.join('\n\n'));
          if (i < lines.length && lines[i].trim() === '') output.push('');
          continue;
        }
      }

      i = runStart;
    }

    output.push(line);
    i += 1;
  }

  const text = output.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const note =
    reconstructedRuns > 0 ? '다단/분栏 붙여넣기를 감지해 문장 조각을 자동으로 이어 붙였습니다.' : undefined;

  return { text, layout, note };
}
