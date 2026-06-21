'use client';

import React from 'react';
import { GlobalSettings as GlobalSettingsType } from '@/app/lib/types';
import { Label } from '@/components/ui/label';
import ImageUploadField from '@/app/components/editor/ImageUploadField';

interface GlobalSettingsProps {
  settings: GlobalSettingsType;
  onChange: (settings: GlobalSettingsType) => void;
  /** Supabase Storage upload when true; falls back to data URL locally. */
  cloudUploadEnabled?: boolean;
}

export default function GlobalSettingsEditor({ settings, onChange, cloudUploadEnabled }: GlobalSettingsProps) {
  const update = (key: keyof GlobalSettingsType, value: string | null) => {
    onChange({ ...settings, [key]: value });
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

      <ImageUploadField
        label="표지 사진"
        value={settings.coverPhotoUrl}
        onChange={url => update('coverPhotoUrl', url)}
        cloudUploadEnabled={cloudUploadEnabled}
        previewShape="square"
        storageFolder="covers"
        emptyLabel="클릭하여 표지 사진 업로드"
        hint="첫 카드의 정사각형 히어로 이미지입니다."
      />

      <ImageUploadField
        label="프로필 사진"
        value={settings.photoUrl}
        onChange={url => update('photoUrl', url)}
        cloudUploadEnabled={cloudUploadEnabled}
        previewShape="circle"
        storageFolder="profiles"
        emptyLabel="클릭하여 프로필 사진 업로드"
        hint={
          cloudUploadEnabled
            ? 'Supabase가 켜져 있으면 스토리지에 올리고 URL로 저장합니다. 실패 시 로컬(data URL)로 미리보기합니다.'
            : '인터뷰 말풍선 옆 원형 아바타입니다.'
        }
      />
    </div>
  );
}
