import { htmlInlineToMarkup } from '@/app/lib/parse-pie-document';
import { normalizeNumberedQaText } from '@/app/lib/parse-natural-pie-document';

export const DOCUMENT_UPLOAD_ACCEPT =
  '.docx,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface ReadDocumentResult {
  text: string;
  html?: string;
  fileName: string;
  source: 'docx' | 'text';
}

export function isAcceptedDocumentFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'docx' || ext === 'txt' || ext === 'md') return true;
  if (file.type === DOCX_MIME || file.type === 'text/plain' || file.type === 'text/markdown') {
    return true;
  }
  return false;
}

export function pickDocumentFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const files = Array.from(dataTransfer.files);
  return files.find(isAcceptedDocumentFile) ?? null;
}

export async function readDocumentFile(file: File): Promise<ReadDocumentResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isDocx = ext === 'docx' || file.type === DOCX_MIME;

  if (isDocx) {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = result.value.trim();
    const { text: rawText } = htmlInlineToMarkup(html);
    const text = normalizeNumberedQaText(rawText);
    return { text, html, fileName: file.name, source: 'docx' };
  }

  const text = await file.text();
  return { text, fileName: file.name, source: 'text' };
}
