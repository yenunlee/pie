import { generateId } from '@/app/lib/utils';
import type { GlobalSettings, MessageBlock } from '@/app/lib/types';

export interface NaturalParseResult {
  global: Partial<GlobalSettings>;
  abstract: string;
  messages: MessageBlock[];
  warnings: string[];
}

const NUMBERED_Q_MARKER = /\*\*Q\s*\d+\s*[.．:：]|(?<!\*)\bQ\s*\d+\s*[.．:：]/i;
const NUMBERED_Q_SPLIT = /(?=(?:\*\*Q\s*\d+\s*[.．:：]|(?<!\*)\bQ\s*\d+\s*[.．:：]))/i;
const NUMBERED_Q_LINE = /^\s*\*{0,2}\s*Q\s*(\d+)\s*[.．:：]\s*(.*?)\*{0,2}\s*$/i;

const PIE_ISSUE_HEADER =
  /^(20\d{2}년\s*\d{1,2}월).*?PIE\s*(\d+)\s*장.*?(?:<\s*)?(?:(\d+)학번\s*)?([가-힣]{2,4})\s*님>?/i;

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function collapseBlankLines(text: string): string {
  return normalizeNewlines(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function plain(text: string): string {
  return normalizeNewlines(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, '').trim();
}

/** Repair flattened Word/docx text where paragraphs and Q1./Q2. markers run together. */
export function normalizeNumberedQaText(text: string): string {
  let normalized = normalizeNewlines(text);

  normalized = normalized.replace(/(\*\*[^*]+?\*\*)([^\n*\s])/g, '$1\n\n$2');
  normalized = normalized.replace(/([^\n])(\*\*Q\s*\d+\s*[.．:：])/gi, '$1\n\n$2');
  normalized = normalized.replace(/([.!?。！？…\s])(Q\s*\d+\s*[.．:：])/g, '$1\n\n$2');
  normalized = normalized.replace(
    /(\*\*Q\s*\d+\s*[.．:：][\s\S]*?\*\*)\s+(?=[^\n])/gi,
    '$1\n\n',
  );
  normalized = normalized.replace(
    /([^\n*]+?)\*\*\s*\n+\s*(Q\s*\d+\s*[.．:：])/gi,
    '$1\n\n**$2',
  );

  return collapseBlankLines(normalized);
}

export function isNumberedQaDocument(text: string): boolean {
  const normalized = normalizeNumberedQaText(text);
  const matches = normalized.match(/\*\*Q\s*\d+\s*[.．:：]|\bQ\s*\d+\s*[.．:：]/gi);
  return (matches?.length ?? 0) >= 2;
}

function parsePieHeaderLine(line: string, global: Partial<GlobalSettings>): boolean {
  const cleaned = plain(stripBoldMarkers(line));
  const match = cleaned.match(PIE_ISSUE_HEADER);
  if (!match) return false;

  if (!global.issueDate) {
    global.issueDate = match[1].replace(/\s+/g, ' ') + '호';
  }
  if (!global.volume) global.volume = match[2];
  if (!global.intervieweeName && match[4]) global.intervieweeName = match[4];
  return true;
}

function enrichGlobalFromPreamble(preamble: string, global: Partial<GlobalSettings>) {
  const cleaned = plain(stripBoldMarkers(preamble));
  const nameMatch =
    cleaned.match(/([가-힣]{2,4})\s*님(?:께서|의|\s)/) ??
    cleaned.match(/([가-힣]{2,4})\s*님/);
  if (nameMatch && !global.intervieweeName) global.intervieweeName = nameMatch[1];

  const gradeMatch = cleaned.match(/(\d+)학번/);
  const affiliation =
    gradeMatch && global.intervieweeName
      ? `서울대학교 산업공학과 ${gradeMatch[1]}학번`
      : null;
  if (affiliation && !global.intervieweeAffiliation) {
    global.intervieweeAffiliation = affiliation;
  }
}

function splitAnswerParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map(part => plain(part.replace(/\*\*+\s*$/, '').replace(/^\*\*+\s*/, '')))
    .filter(Boolean);
}

function parseNumberedQaSection(section: string): MessageBlock[] {
  const messages: MessageBlock[] = [];
  const parts = section.split(NUMBERED_Q_SPLIT).map(part => part.trim()).filter(Boolean);

  for (const part of parts) {
    if (!NUMBERED_Q_MARKER.test(part)) continue;

    const boldWrapped = part.match(
      /^\*\*Q\s*\d+\s*[.．:：]\s*([\s\S]*?)\*\*\s*([\s\S]*)$/i,
    );
    if (boldWrapped) {
      const question = plain(boldWrapped[1]);
      if (question) {
        messages.push({ id: generateId(), role: 'interviewer', content: question });
      }
      for (const paragraph of splitAnswerParagraphs(boldWrapped[2])) {
        messages.push({ id: generateId(), role: 'interviewee', content: paragraph });
      }
      continue;
    }

    const plainWrapped = part.match(
      /^Q\s*\d+\s*[.．:：]\s*([\s\S]*?)\*\*\s*([\s\S]*)$/i,
    );
    if (plainWrapped) {
      const question = plain(plainWrapped[1]);
      if (question) {
        messages.push({ id: generateId(), role: 'interviewer', content: question });
      }
      for (const paragraph of splitAnswerParagraphs(plainWrapped[2])) {
        messages.push({ id: generateId(), role: 'interviewee', content: paragraph });
      }
      continue;
    }

    const lines = part.split('\n');
    const firstLine = lines[0]?.trim() ?? '';
    const qMatch = firstLine.match(NUMBERED_Q_LINE);
    if (!qMatch) continue;

    const question = plain(qMatch[2]);
    if (question) {
      messages.push({ id: generateId(), role: 'interviewer', content: question });
    }

    const answerBody = lines.slice(1).join('\n').trim();
    for (const paragraph of splitAnswerParagraphs(answerBody)) {
      messages.push({ id: generateId(), role: 'interviewee', content: paragraph });
    }
  }

  return messages;
}

/** Parse full PIE manuscript with Q1. Q2. … and no [ABSTRACT]/[INTERVIEW] labels. */
export function parseNaturalNumberedDocument(text: string): NaturalParseResult | null {
  const normalized = normalizeNumberedQaText(text);
  if (!isNumberedQaDocument(normalized)) return null;

  const firstQ = normalized.search(NUMBERED_Q_SPLIT);
  if (firstQ < 0) return null;

  const preamble = normalized.slice(0, firstQ).trim();
  const qaSection = normalized.slice(firstQ).trim();
  const global: Partial<GlobalSettings> = {};
  const warnings: string[] = [];

  const preambleLines = preamble.split('\n').map(line => line.trim()).filter(Boolean);
  let abstractStart = 0;
  if (preambleLines[0] && parsePieHeaderLine(preambleLines[0], global)) {
    abstractStart = 1;
  }
  enrichGlobalFromPreamble(preamble, global);

  const abstract = preambleLines
    .slice(abstractStart)
    .join('\n\n')
    .trim();

  const messages = parseNumberedQaSection(qaSection);
  if (messages.length === 0) return null;

  warnings.push('Q1/Q2… 형식의 원고를 자동으로 인식했습니다.');

  return { global, abstract, messages, warnings };
}
