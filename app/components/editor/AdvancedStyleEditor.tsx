'use client';

import React from 'react';
import type { DesignSettings } from '@/app/lib/types';
import { DESIGN_PRESETS, mergeDesignSettings } from '@/app/lib/constants';
import { Label } from '@/components/ui/label';

interface AdvancedStyleEditorProps {
  design: DesignSettings;
  onDesignChange: (design: DesignSettings) => void;
}

export default function AdvancedStyleEditor({ design, onDesignChange }: AdvancedStyleEditorProps) {
  const d = mergeDesignSettings(design);

  const updateDesign = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    onDesignChange({ ...d, [key]: value });
  };

  const applyPreset = (settings: Partial<DesignSettings>) => {
    onDesignChange({ ...d, ...settings });
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-400">
        프리셋·Cover·초록(Abstract)·인터뷰 말풍선을 조정합니다. 변경 사항은 브라우저에 자동 저장되며, 라이브러리에서 클라우드 저장할 수 있습니다.
      </p>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="mb-2">
          <div className="text-xs font-bold text-gray-700">표시</div>
          <div className="text-[11px] text-gray-400">카드 하단 페이지 표시</div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="size-4 rounded border-gray-300"
            checked={d.showPageIndicators}
            onChange={e => updateDesign('showPageIndicators', e.target.checked)}
          />
          페이지 번호 · 캐러셀 점 표시
        </label>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
        <div className="mb-2">
          <div className="text-xs font-bold text-gray-700">프리셋</div>
          <div className="text-[11px] text-gray-400">자주 쓰는 디자인 조합</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DESIGN_PRESETS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.settings)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Cover 글자 크기</Label>
            <input
              type="number"
              min={80}
              max={130}
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={d.coverTextSize}
              onChange={e => updateDesign('coverTextSize', Number(e.target.value) || 100)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Interview 본문</Label>
            <input
              type="number"
              min={20}
              max={34}
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={d.interviewTextSize}
              onChange={e => updateDesign('interviewTextSize', Number(e.target.value) || 26)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">프로필 이미지 (원형)</Label>
            <input
              type="number"
              min={40}
              max={80}
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={d.avatarSize}
              onChange={e => updateDesign('avatarSize', Number(e.target.value) || 56)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-3">
          <div className="mb-2 text-xs font-bold text-gray-800">초록 (Abstract)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">제목 글자 크기</Label>
              <input
                type="number"
                min={16}
                max={40}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractTitleFontSize}
                onChange={e => updateDesign('abstractTitleFontSize', Number(e.target.value) || 33)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">제목 굵기 (수치)</Label>
              <input
                type="number"
                min={400}
                max={900}
                step={100}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractTitleFontWeight}
                onChange={e => updateDesign('abstractTitleFontWeight', Number(e.target.value) || 800)}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 py-1">
              <input
                id="abstract-title-ul"
                type="checkbox"
                checked={d.abstractTitleUnderline}
                onChange={e => updateDesign('abstractTitleUnderline', e.target.checked)}
                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200"
              />
              <Label htmlFor="abstract-title-ul" className="text-xs font-medium text-gray-600">
                제목 밑줄
              </Label>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">본문 글자 크기</Label>
              <input
                type="number"
                min={16}
                max={40}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractTextSize}
                onChange={e => updateDesign('abstractTextSize', Number(e.target.value) || 30)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">본문 기본 굵기</Label>
              <input
                type="number"
                min={300}
                max={800}
                step={100}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractBodyFontWeight}
                onChange={e => updateDesign('abstractBodyFontWeight', Number(e.target.value) || 400)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">강조 볼드 (B) 굵기</Label>
              <input
                type="number"
                min={600}
                max={900}
                step={100}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractBoldFontWeight}
                onChange={e => updateDesign('abstractBoldFontWeight', Number(e.target.value) || 800)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">본문 줄 간격</Label>
              <input
                type="number"
                min={1.25}
                max={2.4}
                step={0.05}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractBodyLineHeight}
                onChange={e => updateDesign('abstractBodyLineHeight', Number.parseFloat(e.target.value) || 1.85)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-gray-500">하이라이트(H) 색</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 rounded border border-gray-200 bg-white"
                  value={d.abstractHighlightColor}
                  onChange={e => updateDesign('abstractHighlightColor', e.target.value)}
                />
                <input
                  className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={d.abstractHighlightColor}
                  onChange={e => updateDesign('abstractHighlightColor', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">제목·본문 간격</Label>
              <input
                type="number"
                min={16}
                max={80}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractTitleMarginBottom}
                onChange={e => updateDesign('abstractTitleMarginBottom', Number(e.target.value) || 40)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">카드 위 패딩</Label>
              <input
                type="number"
                min={48}
                max={120}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractCardPaddingTop}
                onChange={e => updateDesign('abstractCardPaddingTop', Number(e.target.value) || 72)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">카드 좌우 패딩</Label>
              <input
                type="number"
                min={40}
                max={100}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.abstractCardPaddingX}
                onChange={e => updateDesign('abstractCardPaddingX', Number(e.target.value) || 64)}
              />
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
            에디터의 B/H는 초록 카드에서는 위 굵기·색이 적용됩니다. 에디터 미리보기 색은 공통 블루일 수 있습니다.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-3">
          <div className="mb-2 text-xs font-bold text-gray-800">인터뷰 말풍선 간격·여백 (px)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">말풍선 사이 간격</Label>
              <input
                type="number"
                min={8}
                max={48}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewBubbleGap}
                onChange={e => updateDesign('interviewBubbleGap', Number(e.target.value) || 24)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">말풍선 안쪽 (상하)</Label>
              <input
                type="number"
                min={8}
                max={36}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewBubblePaddingY}
                onChange={e => updateDesign('interviewBubblePaddingY', Number(e.target.value) || 18)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">말풍선 안쪽 (좌우)</Label>
              <input
                type="number"
                min={12}
                max={40}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewBubblePaddingX}
                onChange={e => updateDesign('interviewBubblePaddingX', Number(e.target.value) || 22)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">카드 위쪽 여백</Label>
              <input
                type="number"
                min={48}
                max={120}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewContentPaddingTop}
                onChange={e => updateDesign('interviewContentPaddingTop', Number(e.target.value) || 72)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">카드 좌우 여백</Label>
              <input
                type="number"
                min={40}
                max={100}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewContentPaddingX}
                onChange={e => updateDesign('interviewContentPaddingX', Number(e.target.value) || 56)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">카드 아래 여백</Label>
              <input
                type="number"
                min={16}
                max={80}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewContentPaddingBottom}
                onChange={e => updateDesign('interviewContentPaddingBottom', Number(e.target.value) || 32)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">인터뷰어 말풍선</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-10 rounded border border-gray-200 bg-white"
                value={d.interviewerBubbleColor}
                onChange={e => updateDesign('interviewerBubbleColor', e.target.value)}
              />
              <input
                className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.interviewerBubbleColor}
                onChange={e => updateDesign('interviewerBubbleColor', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">인터뷰이 말풍선</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-10 rounded border border-gray-200 bg-white"
                value={d.intervieweeBubbleColor}
                onChange={e => updateDesign('intervieweeBubbleColor', e.target.value)}
              />
              <input
                className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={d.intervieweeBubbleColor}
                onChange={e => updateDesign('intervieweeBubbleColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
