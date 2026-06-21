'use client';

import { useCallback, useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { htmlInlineToMarkup } from '@/app/lib/parse-pie-document';
import { normalizeNumberedQaText } from '@/app/lib/parse-natural-pie-document';
import {
  DOCUMENT_UPLOAD_ACCEPT,
  isAcceptedDocumentFile,
  pickDocumentFromDataTransfer,
  readDocumentFile,
} from '@/app/lib/read-document-file';

interface DocumentImportPanelProps {
  value: string;
  onChange: (text: string) => void;
  onPasteHtml?: (html: string) => void;
  onImportDocument?: (payload: { text: string; html?: string; fileName: string }) => void;
  rows?: number;
  className?: string;
  textareaClassName?: string;
}

export default function DocumentImportPanel({
  value,
  onChange,
  onPasteHtml,
  onImportDocument,
  rows = 8,
  className = '',
  textareaClassName = '',
}: DocumentImportPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [lastPasteMode, setLastPasteMode] = useState<'html' | 'text' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const applyImport = useCallback(
    (payload: { text: string; html?: string; fileName: string }) => {
      if (onImportDocument) {
        onImportDocument(payload);
      } else {
        onChange(payload.text);
        if (payload.html) onPasteHtml?.(payload.html);
      }
      setUploadedFileName(payload.fileName);
      setLastPasteMode(payload.html ? 'html' : 'text');
    },
    [onChange, onImportDocument, onPasteHtml],
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!isAcceptedDocumentFile(file)) {
        setUploadError('Word(.docx), .txt, .md 파일만 업로드할 수 있습니다.');
        return;
      }

      setUploadError(null);
      setUploading(true);
      try {
        const result = await readDocumentFile(file);
        applyImport({
          text: normalizeNumberedQaText(result.text),
          html: result.html,
          fileName: result.fileName,
        });
      } catch {
        setUploadError('파일을 읽지 못했습니다. Word(.docx) 또는 텍스트 파일인지 확인해 주세요.');
      } finally {
        setUploading(false);
      }
    },
    [applyImport],
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setDragging(false);
    if (uploading) return;

    const file = pickDocumentFromDataTransfer(e.dataTransfer);
    if (!file) {
      setUploadError('Word(.docx), .txt, .md 파일만 드롭할 수 있습니다.');
      return;
    }

    await processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    setUploadedFileName(null);
    const html = e.clipboardData.getData('text/html');
    if (html?.trim()) {
      e.preventDefault();
      onPasteHtml?.(html);
      const { text } = htmlInlineToMarkup(html);
      onChange(normalizeNumberedQaText(text));
      setLastPasteMode('html');
      return;
    }
    setLastPasteMode('text');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUploadedFileName(null);
    onChange(e.target.value);
  };

  const zoneClass = dragging
    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200 ring-offset-1'
    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-3xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileRef.current?.click()}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mb-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3.5 transition-colors ${zoneClass}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
            <FileUp className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? '파일 읽는 중…' : dragging ? '여기에 놓으세요' : 'Word 원고 파일 업로드'}
            </p>
            <p className="text-xs text-gray-400">
              .docx · .txt · .md — 클릭하거나 드래그 앤 드롭
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-600">
            파일 선택
          </span>
        </div>

        {uploadError ? (
          <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-600">
            {uploadError}
          </p>
        ) : null}

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            또는 붙여넣기
          </p>
          {uploadedFileName ? (
            <p className="truncate text-[11px] text-blue-600">업로드됨: {uploadedFileName}</p>
          ) : null}
        </div>

        <textarea
          value={value}
          onChange={handleTextChange}
          onPaste={handlePaste}
          placeholder="Word 원고 전체를 붙여넣으세요. 파란 글씨 → ==하이라이트==, 검은 문단 → 질문, 파란 문단 → 답변으로 자동 분류됩니다."
          rows={rows}
          spellCheck={false}
          className={`w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-700 placeholder:text-gray-300 focus:border-gray-300 focus:outline-none ${textareaClassName}`}
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-gray-300">
            {uploadedFileName
              ? '파일에서 불러옴 — Parse document로 계속'
              : lastPasteMode === 'html'
                ? '서식 유지 붙여넣기 감지됨'
                : '일반 붙여넣기 — Word에서 Cmd+V 권장'}
          </p>
          <p className="text-[10px] text-gray-300">{value.length.toLocaleString()} chars</p>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={DOCUMENT_UPLOAD_ACCEPT}
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
