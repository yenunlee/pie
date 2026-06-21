import { generateId } from '@/app/lib/utils';
import { parseNaturalNumberedDocument } from '@/app/lib/parse-natural-pie-document';
import { reconstructRawDocumentText } from '@/app/lib/parse-raw-layout';
import type { AppState, GlobalSettings, MessageBlock, MessageRole } from '@/app/lib/types';

export interface ParsePieDocumentResult {
  global: Partial<GlobalSettings>;
  abstract: string;
  messages: MessageBlock[];
  warnings: string[];
}

type Section = 'meta' | 'abstract' | 'interview' | null;

interface ParsedBlock {
  text: string;
  markup: string;
  section: Section;
  roleHint: MessageRole | null;
  isTitle: boolean;
  isMeta: boolean;
}

const META_KEYS: Record<string, keyof GlobalSettings> = {
  volume: 'volume',
  vol: 'volume',
  볼륨: 'volume',
  호: 'issueDate',
  issue: 'issueDate',
  issue_date: 'issueDate',
  발행: 'issueDate',
  발행월: 'issueDate',
  name: 'intervieweeName',
  이름: 'intervieweeName',
  interviewee: 'intervieweeName',
  affiliation: 'intervieweeAffiliation',
  소속: 'intervieweeAffiliation',
  직함: 'intervieweeAffiliation',
  unit: 'unitLabel',
  유닛: 'unitLabel',
};

const SECTION_PATTERNS: Array<{ section: Exclude<Section, null>; re: RegExp }> = [
  { section: 'meta', re: /^\s*(?:\[?\s*META\s*\]?|메타(?:데이터)?)\s*$/i },
  { section: 'abstract', re: /^\s*(?:\[?\s*ABSTRACT\s*\]?|초록|소개(?:글)?|인트로)\s*$/i },
  { section: 'interview', re: /^\s*(?:\[?\s*INTERVIEW\s*\]?|인터뷰(?:\s*본문)?|질의응답|Q\s*&\s*A|Q\/A)\s*$/i },
];

const QUESTION_PREFIX = /^\s*(?:Q(?:uestion)?|질문|인터뷰어)\s*(?:\d+)?\s*[:：.．)\]]\s*(.+)$/i;
const ANSWER_PREFIX = /^\s*(?:A(?:nswer)?|답변|인터뷰이)\s*(?:\d+)?\s*[:：.．)\]]\s*(.+)$/i;

const QUESTION_CUE =
  /(무엇|어떤|어떻게|왜|이유|소개|설명|생각|궁금|목표|업무|분야|흐름|역량|매력|어려|극복|도움|선택|담당|있다면|있을까요|인가요|나요|까요|습니까|부탁드)/;
const INTERVIEW_START_CUE = /(인터뷰에\s*응해|자기소개|소개\s*부탁|먼저\s*자기소개|감사합니다)/;
const ABSTRACT_INVITATION = /(알아보러|알아보려|가보실까요|가볼까요|함께\s*알아)/;
const TITLE_RE = /(.+?)\s+([가-힣]{2,5})\s*(?:님|교수님|변리사님|선배님)?\s*인터뷰\s*$/;

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function splitSpatialLine(line: string): string[] {
  return line
    .split(/\t+| {3,}/)
    .map(part => part.trim())
    .filter(Boolean);
}

function splitRawTextBlocks(text: string): string[] {
  const normalized = normalizeNewlines(text);
  if (!normalized) return [];

  const paragraphCandidates = normalized.includes('\n\n')
    ? normalized.split(/\n{2,}/)
    : normalized.split('\n');

  return paragraphCandidates
    .flatMap(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length <= 1) return splitSpatialLine(block);

      const spatialParts = lines.flatMap(splitSpatialLine);
      const allFragments = spatialParts.every(part => part.length <= 80 && !/[.!?。！？]$/.test(part));
      return allFragments ? spatialParts : [lines.join('\n')];
    })
    .map(part => part.trim())
    .filter(Boolean);
}

function plain(text: string): string {
  return normalizeNewlines(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function collapseMarkup(text: string): string {
  return normalizeNewlines(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripMarkers(text: string): string {
  return text.replace(/\*\*/g, '').replace(/==/g, '');
}

function stripSectionHeaderLines(markup: string): string {
  return markup
    .split('\n')
    .filter(line => !classifySectionMarker(plain(line)))
    .join('\n')
    .trim();
}

function makeParsedBlock(
  markup: string,
  section: Section,
  roleHint: MessageRole | null = null,
): ParsedBlock | null {
  const cleanedMarkup = stripSectionHeaderLines(collapseMarkup(markup));
  if (!cleanedMarkup) return null;

  const blockText = plain(stripMarkers(cleanedMarkup));
  if (!blockText) return null;

  return {
    text: blockText,
    markup: cleanedMarkup,
    section,
    roleHint,
    isTitle: TITLE_RE.test(blockText),
    isMeta: parseMetaLine(blockText, {}),
  };
}

function parseMetaLine(line: string, global: Partial<GlobalSettings>): boolean {
  const match = line.match(/^\s*([A-Za-z가-힣_]+)\s*[:：]\s*(.+)\s*$/);
  if (!match) return false;

  const key = match[1].trim().toLowerCase();
  const value = match[2].trim();
  const field = META_KEYS[key];
  if (!field || field === 'photoUrl' || field === 'coverPhotoUrl') return false;

  global[field] = value;
  return true;
}

function parseTitleMetadata(text: string, global: Partial<GlobalSettings>): boolean {
  const cleaned = stripMarkers(plain(text));
  const match = cleaned.match(TITLE_RE);
  if (!match) return false;

  if (!global.intervieweeAffiliation) global.intervieweeAffiliation = match[1].trim();
  if (!global.intervieweeName) global.intervieweeName = match[2].trim();
  return true;
}

function parseIssueMetadata(text: string, global: Partial<GlobalSettings>) {
  const cleaned = stripMarkers(plain(text));
  const issue = cleaned.match(/(20\d{2}년\s*\d{1,2}월호)/);
  if (issue && !global.issueDate) global.issueDate = issue[1].replace(/\s+/g, ' ');

  const volume = cleaned.match(/\bvol\.?\s*(\d+)\b/i) ?? cleaned.match(/\bPIE\s*(\d+)\b/i);
  if (volume && !global.volume) global.volume = volume[1];
}

function parseLooseProfessionalMetadata(text: string, global: Partial<GlobalSettings>) {
  const cleaned = stripMarkers(plain(text));
  if (!cleaned) return;

  const affiliationLike =
    /(research\s*scientist|professor|교수|교수님\s*연구실|변리사|로펌|연구원|대학원|연구실|google|구글|삼성|네이버|카카오)/i;

  if (!global.intervieweeAffiliation && affiliationLike.test(cleaned)) {
    global.intervieweeAffiliation = cleaned.replace(/\s+에\s+/g, ' ');
  }

  const nameMatch = cleaned.match(/([가-힣]{2,4})\s*교수님/);
  if (nameMatch && !global.intervieweeName) global.intervieweeName = nameMatch[1];
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const normalized = color.trim().toLowerCase();
  const hex = normalized.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      return {
        r: Number.parseInt(h[0] + h[0], 16),
        g: Number.parseInt(h[1] + h[1], 16),
        b: Number.parseInt(h[2] + h[2], 16),
      };
    }
    if (h.length >= 6) {
      return {
        r: Number.parseInt(h.slice(0, 2), 16),
        g: Number.parseInt(h.slice(2, 4), 16),
        b: Number.parseInt(h.slice(4, 6), 16),
      };
    }
  }

  const rgb = normalized.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!rgb) return null;
  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
}

export function isHighlightColor(color: string | null | undefined): boolean {
  if (!color) return false;
  const normalized = color.trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized || normalized === 'inherit' || normalized === 'initial') return false;
  if (normalized.includes('windowtext') || normalized.includes('auto')) return false;

  const namedBlue = ['blue', '#0000ff', '#0563c1', '#2e75b6', '#0070c0', '#4472c4', '#5b9bd5', '#c2eefd', '#b7e4f8'];
  if (namedBlue.includes(normalized)) return true;

  const rgb = parseRgb(color);
  if (!rgb) return false;
  const { r, g, b } = rgb;

  const saturatedBlue = b >= 90 && b > r + 15 && b > g + 5 && r + g + b > 80;
  const lightCyanHighlight = b >= 180 && g >= 170 && r <= 230 && b > r + 5;
  return saturatedBlue || lightCyanHighlight;
}

function isGrayBackground(color: string | null | undefined): boolean {
  if (!color) return false;
  const rgb = parseRgb(color);
  if (!rgb) return false;
  const { r, g, b } = rgb;
  return Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10 && r >= 210 && r <= 248;
}

function isBoldWeight(weight: string | null | undefined): boolean {
  if (!weight) return false;
  const n = Number.parseInt(weight, 10);
  if (!Number.isNaN(n)) return n >= 600;
  return weight === 'bold' || weight === 'bolder';
}

function getInlineStyle(el: HTMLElement, key: string): string {
  const direct = el.style.getPropertyValue(key);
  if (direct) return direct;

  const styleAttr = el.getAttribute('style') ?? '';
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styleAttr.match(new RegExp(`${escaped}\\s*:\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function elementColor(el: HTMLElement): string {
  return getInlineStyle(el, 'color') || el.getAttribute('color') || '';
}

function elementBackground(el: HTMLElement): string {
  return getInlineStyle(el, 'background-color') || getInlineStyle(el, 'background') || '';
}

function isParagraphBlockTag(tag: string): boolean {
  return ['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD'].includes(tag);
}

function markupFromBlockContent(el: HTMLElement): string {
  return Array.from(el.childNodes)
    .map(child => inlineMarkupFromNode(child, false, false))
    .join('');
}

function collectMarkupBlocks(root: HTMLElement): string[] {
  const blocks: string[] = [];

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = textNodeContent(node);
      if (t) blocks.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (isParagraphBlockTag(tag)) {
      const content = markupFromBlockContent(el).trim();
      if (content) blocks.push(content);
      return;
    }

    if (tag === 'BR') return;

    Array.from(el.childNodes).forEach(visit);
  };

  Array.from(root.childNodes).forEach(visit);
  return blocks;
}

function splitBrText(el: HTMLElement): string[] {
  return el.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|td)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n{2,}/)
    .map(plain)
    .filter(Boolean);
}

function textNodeContent(node: Node): string {
  return node.textContent ? plain(node.textContent) : '';
}

function inlineMarkupFromNode(node: Node, inheritedBold: boolean, inheritedHighlight: boolean): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'br') return '\n';

  const bold = inheritedBold || tag === 'b' || tag === 'strong' || isBoldWeight(el.style.fontWeight || getInlineStyle(el, 'font-weight'));
  const highlight =
    inheritedHighlight ||
    isHighlightColor(elementColor(el)) ||
    (tag !== 'p' && tag !== 'div' && tag !== 'li' && isHighlightColor(elementBackground(el)));

  const inner = Array.from(el.childNodes)
    .map(child => inlineMarkupFromNode(child, bold, highlight))
    .join('');

  if (!inner.trim()) return inner;
  if (highlight && !inheritedHighlight) return `==${inner}==`;
  if (bold && !inheritedBold) return `**${inner}**`;
  return inner;
}

/** Convert Word/HTML inline formatting to PIE == / ** markers, preserving paragraph breaks. */
export function htmlInlineToMarkup(html: string): { text: string; hasHighlight: boolean } {
  if (typeof document === 'undefined') {
    return { text: collapseMarkup(html.replace(/<[^>]+>/g, '')), hasHighlight: false };
  }

  const root = document.createElement('div');
  root.innerHTML = html;
  const text = collapseMarkup(collectMarkupBlocks(root).join('\n\n'));
  return { text, hasHighlight: /==[^=]+==/.test(text) };
}

function classifySectionMarker(text: string): Exclude<Section, null> | null {
  for (const { section, re } of SECTION_PATTERNS) {
    if (re.test(text)) return section;
  }
  return null;
}

function blockRoleFromElement(el: HTMLElement, text: string): MessageRole | null {
  const align = (getInlineStyle(el, 'text-align') || '').toLowerCase();
  const bg = elementBackground(el);
  const color = elementColor(el);

  if (align === 'right' || align === 'end') return 'interviewer';
  if (isHighlightColor(bg) || isHighlightColor(color)) return 'interviewer';
  if (isGrayBackground(bg)) return 'interviewee';

  const q = text.match(QUESTION_PREFIX);
  if (q) return 'interviewer';
  const a = text.match(ANSWER_PREFIX);
  if (a) return 'interviewee';

  return null;
}

function blockFromElement(el: HTMLElement, section: Section): ParsedBlock | null {
  const converted = htmlInlineToMarkup(el.innerHTML);
  const text = plain(stripMarkers(converted.text));
  if (!text) return null;

  return {
    text,
    markup: converted.text,
    section,
    roleHint: blockRoleFromElement(el, text),
    isTitle: TITLE_RE.test(text),
    isMeta: parseMetaLine(text, {}),
  };
}

function extractHtmlBlocks(html: string): ParsedBlock[] {
  if (typeof document === 'undefined') return [];

  const root = document.createElement('div');
  root.innerHTML = html;

  const blocks: ParsedBlock[] = [];
  let section: Section = null;

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = textNodeContent(node);
      if (text) blocks.push({ text, markup: text, section, roleHint: null, isTitle: TITLE_RE.test(text), isMeta: parseMetaLine(text, {}) });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (isParagraphBlockTag(tag)) {
      const block = blockFromElement(el, section);
      if (block) {
        const marker = classifySectionMarker(block.text);
        if (marker) {
          section = marker;
        } else {
          blocks.push({ ...block, section });
        }
      } else {
        const brParts = splitBrText(el);
        for (const part of brParts) {
          const marker = classifySectionMarker(part);
          if (marker) section = marker;
          else blocks.push({ text: part, markup: part, section, roleHint: null, isTitle: TITLE_RE.test(part), isMeta: parseMetaLine(part, {}) });
        }
      }
      return;
    }

    if (tag === 'DIV') {
      Array.from(el.childNodes).forEach(visit);
      return;
    }

    Array.from(el.childNodes).forEach(visit);
  };

  Array.from(root.childNodes).forEach(visit);
  return finalizeBlocks(blocks);
}

function extractTextBlocks(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let section: Section = null;

  for (const raw of splitRawTextBlocks(text)) {
    const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let start = 0;
    while (start < lines.length) {
      const marker = classifySectionMarker(lines[start]);
      if (marker) {
        section = marker;
        start += 1;
        continue;
      }
      break;
    }

    const body = collapseMarkup(lines.slice(start).join('\n'));
    if (!body) continue;

    const block = makeParsedBlock(body, section);
    if (block) blocks.push(block);
  }

  return finalizeBlocks(blocks);
}

function lineRoleHint(line: string): MessageRole | null {
  if (QUESTION_PREFIX.test(line)) return 'interviewer';
  if (ANSWER_PREFIX.test(line)) return 'interviewee';
  return null;
}

function blockStartsWithRoleTag(markup: string): boolean {
  const firstLine = markup.split('\n').map(line => line.trim()).find(Boolean) ?? '';
  return lineRoleHint(firstLine) !== null;
}

function isMergeableContentBlock(block: ParsedBlock): boolean {
  return !block.isMeta && !block.isTitle && !classifySectionMarker(block.text);
}

function sectionsCompatible(a: Section, b: Section): boolean {
  if (a === b) return true;
  if (a === null || b === null) return true;
  return false;
}

/** Join blank-line-separated paragraphs into one block when no new Q:/A: tag starts the next part. */
function mergeUntaggedParagraphBlocks(blocks: ParsedBlock[]): ParsedBlock[] {
  const merged: ParsedBlock[] = [];

  for (const block of blocks) {
    const last = merged[merged.length - 1];
    const canMerge =
      last &&
      isMergeableContentBlock(block) &&
      isMergeableContentBlock(last) &&
      block.roleHint !== 'interviewer' &&
      !blockStartsWithRoleTag(block.markup) &&
      last.roleHint !== 'interviewer' &&
      sectionsCompatible(last.section, block.section);

    if (canMerge) {
      const section = last.section ?? block.section;
      const combined = `${last.markup}\n\n${block.markup}`;
      const next = makeParsedBlock(combined, section, last.roleHint ?? block.roleHint);
      if (next) {
        merged[merged.length - 1] = next;
        continue;
      }
    }

    merged.push(block);
  }

  return merged;
}

function finalizeBlocks(blocks: ParsedBlock[]): ParsedBlock[] {
  return mergeUntaggedParagraphBlocks(expandMultiLineQaBlocks(blocks));
}

function stripLineRolePrefix(line: string): string {
  const q = line.match(QUESTION_PREFIX);
  if (q) return q[1].trim();
  const a = line.match(ANSWER_PREFIX);
  if (a) return a[1].trim();
  return line.trim();
}

/** Split blocks that contain multiple Q:/A: lines into separate message blocks. */
function expandMultiLineQaBlocks(blocks: ParsedBlock[]): ParsedBlock[] {
  const expanded: ParsedBlock[] = [];

  for (const block of blocks) {
    const lines = block.markup.split('\n').map(line => line.trim()).filter(Boolean);
    const qaLineCount = lines.filter(line => lineRoleHint(line)).length;

    if (lines.length <= 1 || qaLineCount === 0) {
      expanded.push(block);
      continue;
    }

    let pendingRole: MessageRole | null = null;
    let pendingLines: string[] = [];

    const flush = () => {
      if (!pendingRole || pendingLines.length === 0) return;
      const markup = pendingLines.join('\n\n');
      const next = makeParsedBlock(markup, block.section, pendingRole);
      if (next) expanded.push(next);
      pendingRole = null;
      pendingLines = [];
    };

    for (const line of lines) {
      const role = lineRoleHint(line);
      if (role) {
        flush();
        pendingRole = role;
        pendingLines.push(stripLineRolePrefix(line));
        continue;
      }

      if (pendingRole) {
        pendingLines.push(line);
      } else {
        const solo = makeParsedBlock(line, block.section, block.roleHint);
        if (solo) expanded.push(solo);
      }
    }

    flush();
  }

  return expanded;
}

function removeExplicitRolePrefix(block: ParsedBlock): ParsedBlock {
  const firstLine = block.markup.split('\n').find(line => line.trim())?.trim() ?? block.markup;
  const q = firstLine.match(QUESTION_PREFIX);
  if (q) return { ...block, text: plain(stripMarkers(q[1])), markup: q[1].trim(), roleHint: 'interviewer' };
  const a = firstLine.match(ANSWER_PREFIX);
  if (a) return { ...block, text: plain(stripMarkers(a[1])), markup: a[1].trim(), roleHint: 'interviewee' };
  return block;
}

function isQuestionLike(text: string): boolean {
  const cleaned = stripMarkers(plain(text));
  if (!cleaned || ABSTRACT_INVITATION.test(cleaned)) return false;
  if (INTERVIEW_START_CUE.test(cleaned)) return true;
  if (cleaned.length > 260) return false;
  if (/[?？]\s*$/.test(cleaned)) return true;
  return QUESTION_CUE.test(cleaned) && cleaned.length <= 220;
}

function findFirstInterviewIndex(blocks: ParsedBlock[]): number {
  const explicit = blocks.findIndex(block => block.section === 'interview');
  if (explicit >= 0) return explicit;

  const styled = blocks.findIndex(block => block.roleHint === 'interviewer' && !block.isTitle && !block.isMeta);
  if (styled >= 0) return styled;

  const titleIndex = blocks.findIndex(block => block.isTitle);
  const start = titleIndex >= 0 ? titleIndex + 1 : 0;

  for (let i = start; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block.isMeta || block.isTitle || block.section === 'abstract') continue;
    if (INTERVIEW_START_CUE.test(block.text)) return i;
    if (isQuestionLike(block.text) && i - start >= 2) return i;
  }

  return -1;
}

function collectAbstract(blocks: ParsedBlock[], interviewStart: number, global: Partial<GlobalSettings>): string {
  const explicit = blocks
    .filter(block => block.section === 'abstract' && !block.isMeta && !block.isTitle && !block.roleHint)
    .map(block => stripSectionHeaderLines(block.markup))
    .filter(Boolean);

  if (explicit.length) return explicit.join('\n\n');

  const titleIndex = blocks.findIndex(block => block.isTitle);
  const start = titleIndex >= 0 ? titleIndex + 1 : 0;
  const end = interviewStart >= 0 ? interviewStart : blocks.length;

  return blocks
    .slice(start, end)
    .filter(block => !block.isMeta && !block.isTitle && block.section !== 'interview' && !block.roleHint)
    .map(block => {
      parseIssueMetadata(block.text, global);
      parseLooseProfessionalMetadata(block.text, global);
      return stripSectionHeaderLines(block.markup);
    })
    .filter(Boolean)
    .join('\n\n');
}

function isLooseFragmentCorpus(blocks: ParsedBlock[]): boolean {
  const content = blocks.filter(block => !block.isMeta && !block.isTitle);
  if (content.length < 2) return false;
  if (content.some(block => block.section || block.roleHint || isQuestionLike(block.text))) return false;

  const avgLength = content.reduce((sum, block) => sum + block.text.length, 0) / content.length;
  const shortRatio = content.filter(block => block.text.length <= 90 && !/[.!?。！？]$/.test(block.text)).length / content.length;
  return avgLength <= 70 && shortRatio >= 0.7;
}

function highlightLooseFragments(text: string): string {
  return text
    .split('\n\n')
    .map(fragment => fragment.trim())
    .filter(Boolean)
    .map(fragment => /==.*==/.test(fragment) ? fragment : `==${fragment}==`)
    .join('\n\n');
}

function inferRole(block: ParsedBlock, previousRole: MessageRole | null): MessageRole {
  if (block.roleHint) return block.roleHint;
  if (blockStartsWithRoleTag(block.markup)) {
    const firstLine = block.markup.split('\n').map(line => line.trim()).find(Boolean) ?? '';
    return lineRoleHint(firstLine) ?? 'interviewer';
  }
  if (previousRole === 'interviewee') return 'interviewee';
  if (previousRole === 'interviewer') return 'interviewee';
  if (isQuestionLike(block.text)) return 'interviewer';
  return 'interviewer';
}

function splitSameRoleParagraphs(markup: string): string[] {
  if (!/\n{2,}/.test(markup)) return [markup];

  const parts = markup
    .split(/\n{2,}/)
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length <= 1 || parts.some(part => blockStartsWithRoleTag(part))) {
    return [markup];
  }

  return parts;
}

function collectMessages(blocks: ParsedBlock[], startIndex: number): MessageBlock[] {
  if (startIndex < 0) return [];

  const messages: MessageBlock[] = [];
  let previousRole: MessageRole | null = null;

  for (const originalBlock of blocks.slice(startIndex)) {
    if (originalBlock.isMeta || originalBlock.isTitle || originalBlock.section === 'abstract') continue;
    const block = removeExplicitRolePrefix(originalBlock);
    if (!block.text) continue;

    const role = inferRole(block, previousRole);
    for (const content of splitSameRoleParagraphs(block.markup)) {
      if (!plain(stripMarkers(content))) continue;
      messages.push({ id: generateId(), role, content });
      previousRole = role;
    }
  }

  return messages;
}

function parseMetadata(blocks: ParsedBlock[], global: Partial<GlobalSettings>) {
  for (const block of blocks) {
    parseMetaLine(block.text, global);
    parseIssueMetadata(block.text, global);
    if (block.isTitle) parseTitleMetadata(block.text, global);
  }
}

function chooseBlocks(input: { text?: string; html?: string }): ParsedBlock[] {
  const htmlBlocks = input.html?.trim() ? extractHtmlBlocks(input.html) : [];
  const textBlocks = input.text?.trim() ? extractTextBlocks(input.text) : [];

  const htmlHasStructure =
    htmlBlocks.some(block => block.roleHint || block.section || block.isTitle) ||
    htmlBlocks.length >= Math.max(4, textBlocks.length * 0.5);

  return htmlHasStructure ? htmlBlocks : textBlocks;
}

export function parsePieDocument(input: {
  text?: string;
  html?: string;
}): ParsePieDocumentResult {
  const warnings: string[] = [];
  const global: Partial<GlobalSettings> = {};

  const sourceText = input.text?.trim() ?? '';

  const natural = sourceText ? parseNaturalNumberedDocument(sourceText) : null;
  if (natural) {
    return natural;
  }

  const rawLayout = sourceText ? reconstructRawDocumentText(sourceText) : null;
  const normalizedText = rawLayout?.text ?? input.text;
  if (rawLayout?.note) warnings.push(rawLayout.note);

  const blocks = chooseBlocks({ text: normalizedText, html: input.html });

  parseMetadata(blocks, global);

  const interviewStart = findFirstInterviewIndex(blocks);
  let abstract = collectAbstract(blocks, interviewStart, global);
  let messages = collectMessages(blocks, interviewStart);

  if (abstract && messages.length === 0 && isLooseFragmentCorpus(blocks)) {
    abstract = highlightLooseFragments(abstract);
    warnings.push('질문/답변 구조가 없는 짧은 raw fragment로 감지되어 초록/키워드 카드용 하이라이트로 정리했습니다.');
  }

  if (messages.length === 0) {
    const fallbackText = normalizeNewlines(normalizedText ?? '');
    const fallbackBlocks = extractTextBlocks(fallbackText);
    const fallbackStart = findFirstInterviewIndex(fallbackBlocks);
    messages = collectMessages(fallbackBlocks, fallbackStart);
  }

  if (!abstract) {
    warnings.push('초록을 찾지 못했습니다. Q1 이전 소개 문단 또는 [ABSTRACT] 섹션을 확인하세요.');
  }
  if (messages.length === 0) {
    warnings.push('인터뷰 Q/A를 찾지 못했습니다. Q1./Q2. 번호, Q:/A: 라벨, 또는 Word 서식 붙여넣기를 확인하세요.');
  }

  return { global, abstract, messages, warnings };
}

export function applyParseResult(state: AppState, result: ParsePieDocumentResult): AppState {
  return {
    ...state,
    global: {
      ...state.global,
      ...Object.fromEntries(
        Object.entries(result.global).filter(([, v]) => typeof v === 'string' && v.trim())
      ),
    },
    abstract: { text: result.abstract || state.abstract.text },
    interview: {
      messages: result.messages.length ? result.messages : state.interview.messages,
      pageBreaksAfter: result.messages.length ? [] : state.interview.pageBreaksAfter,
    },
  };
}
