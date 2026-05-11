'use client';

import React, { useRef } from 'react';
import { GlobalSettings as GlobalSettingsType } from '@/app/lib/types';
import { Label } from '@/components/ui/label';

interface GlobalSettingsProps {
  settings: GlobalSettingsType;
  onChange: (settings: GlobalSettingsType) => void;
  /** Supabase Storage upload when true; falls back to data URL locally. */
  cloudUploadEnabled?: boolean;
}

export default function GlobalSettingsEditor({ settings, onChange, cloudUploadEnabled }: GlobalSettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof GlobalSettingsType, value: string | null) => {
    onChange({ ...settings, [key]: value });
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (cloudUploadEnabled && file.type.match(/^image\/(jpeg|png|webp|gif)$/i)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/pie-upload', { method: 'POST', body: fd });
        if (res.ok) {
          const j = (await res.json()) as { publicUrl?: string };
          if (j.publicUrl) {
            update('photoUrl', j.publicUrl);
            return;
          }
        }
      } catch {
        // fall through to local preview
      }
    }

    const reader = new FileReader();
    reader.onload = (ev) => update('photoUrl', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">볼륨 번호</Label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={settings.volume}
            onChange={e => update('volume', e.target.value)}
            placeholder="63"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">발행월</Label>
          <input
            className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={settings.issueDate}
            onChange={e => update('issueDate', e.target.value)}
            placeholder="2026년 5월호"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-500">인터뷰이 이름</Label>
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={settings.intervieweeName}
          onChange={e => update('intervieweeName', e.target.value)}
          placeholder="유용재"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-500">소속/직함</Label>
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={settings.intervieweeAffiliation}
          onChange={e => update('intervieweeAffiliation', e.target.value)}
          placeholder="서울대학교 산업공학과 교수"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-500">하단 레이블</Label>
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={settings.unitLabel}
          onChange={e => update('unitLabel', e.target.value)}
          placeholder="Unit:ie"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-gray-500">인터뷰이 사진</Label>
        <div
          onClick={() => fileRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
        >
          {settings.photoUrl ? (
            <div className="flex items-center gap-3">
              <img src={settings.photoUrl} alt="preview" className="h-12 w-12 rounded-full border border-gray-200 object-cover" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">사진 업로드됨</p>
                <p className="text-xs text-gray-400">클릭하여 변경</p>
              </div>
            </div>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-400">클릭하여 사진 업로드</p>
              <p className="mt-0.5 text-xs text-gray-300">PNG, JPG 권장</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhoto} />
        {cloudUploadEnabled ? (
          <p className="text-[11px] text-gray-400">
            Supabase가 켜져 있으면 사진을 스토리지에 올리고 URL로 저장합니다. 실패 시 이전처럼 로컬(data URL)로 미리보기합니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
