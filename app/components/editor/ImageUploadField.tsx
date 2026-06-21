'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  IMAGE_UPLOAD_ACCEPT,
  isAcceptedImageFile,
  pickImageFromDataTransfer,
  uploadImageFile,
  type ImageStorageFolder,
} from '@/app/lib/upload-image';

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  cloudUploadEnabled?: boolean;
  previewShape: 'square' | 'circle';
  storageFolder?: ImageStorageFolder;
  emptyLabel?: string;
}

export default function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  cloudUploadEnabled,
  previewShape,
  storageFolder = 'covers',
  emptyLabel = '클릭 또는 드래그하여 업로드',
}: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        setError('PNG, JPG, WebP, GIF만 업로드할 수 있습니다.');
        return;
      }

      setError(null);
      setUploading(true);
      try {
        const url = await uploadImageFile(file, { cloudUploadEnabled, folder: storageFolder });
        onChange(url);
      } catch {
        setError('업로드에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setUploading(false);
      }
    },
    [cloudUploadEnabled, onChange, storageFolder],
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const file = pickImageFromDataTransfer(e.dataTransfer);
    if (!file) {
      setError('이미지 파일만 드롭할 수 있습니다.');
      return;
    }

    await processFile(file);
  };

  const previewClass =
    previewShape === 'circle'
      ? 'h-14 w-14 rounded-full border border-gray-200 object-cover'
      : 'h-16 w-16 rounded-xl border border-gray-200 object-cover';

  const zoneClass = dragging
    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200 ring-offset-1'
    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30';

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-500">{label}</Label>
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
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-3 py-3 transition-colors ${zoneClass}`}
      >
        {value ? (
          <>
            <img src={value} alt="" className={previewClass} />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-gray-700">{uploading ? '업로드 중…' : '업로드됨'}</p>
              <p className="text-xs text-gray-400">클릭하거나 드래그하여 변경</p>
            </div>
            {!uploading && (
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                onClick={e => {
                  e.stopPropagation();
                  onChange(null);
                  setError(null);
                }}
              >
                제거
              </button>
            )}
          </>
        ) : (
          <>
            <div
              className={`flex shrink-0 items-center justify-center bg-gray-50 text-gray-300 ${
                previewShape === 'circle' ? 'h-14 w-14 rounded-full' : 'h-16 w-16 rounded-xl'
              }`}
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500">
                {uploading ? '업로드 중…' : dragging ? '여기에 놓으세요' : emptyLabel}
              </p>
              <p className="text-xs text-gray-300">PNG, JPG, WebP · 드래그 앤 드롭 지원</p>
            </div>
          </>
        )}
      </div>
      {error ? <p className="text-[11px] text-red-500">{error}</p> : null}
      {hint ? <p className="text-[11px] leading-5 text-gray-400">{hint}</p> : null}
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
