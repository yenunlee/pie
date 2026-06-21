'use client';

import React from 'react';
import { Check, Download, ImageIcon, Loader2, Package } from 'lucide-react';
import type { ExportProgress } from '@/app/hooks/useExport';
import { CARD_HEIGHT, CARD_WIDTH } from '@/app/lib/constants';
import { DEFAULT_EXPORT_SCALE } from '@/app/lib/export/capture-card-dom';

interface ExportProgressPanelProps {
  progress: ExportProgress;
  percent: number;
}

const PHASES = [
  { id: 'preparing' as const, label: '준비', icon: Loader2 },
  { id: 'rendering' as const, label: '렌더링', icon: ImageIcon },
  { id: 'zipping' as const, label: 'ZIP', icon: Package },
  { id: 'done' as const, label: '완료', icon: Check },
];

function phaseIndex(phase: ExportProgress['phase']): number {
  return PHASES.findIndex(p => p.id === phase);
}

function statusLine(progress: ExportProgress): string {
  if (progress.phase === 'rendering') {
    return `${progress.current} / ${progress.total}장`;
  }
  if (progress.phase === 'zipping') return 'ZIP 패키징 중';
  if (progress.phase === 'done') return '다운로드 준비됨';
  return '내보내기 준비 중';
}

export default function ExportProgressPanel({ progress, percent }: ExportProgressPanelProps) {
  const activeIndex = phaseIndex(progress.phase);
  const isDone = progress.phase === 'done';
  const exportW = CARD_WIDTH * DEFAULT_EXPORT_SCALE;
  const exportH = CARD_HEIGHT * DEFAULT_EXPORT_SCALE;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-gray-950/10 backdrop-blur-[2px]"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-progress-title"
        aria-live="polite"
        className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-gray-950/10 ring-1 ring-black/5 backdrop-blur-md"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-slate-50 via-white to-blue-50/80" aria-hidden />

        <div className="relative px-6 pb-6 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Export
              </p>
              <h2 id="export-progress-title" className="mt-1.5 text-xl font-semibold tracking-tight text-gray-950">
                {isDone ? '카드 내보내기 완료' : '고해상도 카드 생성 중'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isDone ? 'ZIP 파일이 저장되었습니다.' : '미리보기와 동일한 디자인으로 PNG를 만듭니다.'}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                isDone
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  : 'border-gray-100 bg-white text-gray-700'
              }`}
            >
              {isDone ? (
                <Check className="h-5 w-5" strokeWidth={2.25} aria-hidden />
              ) : (
                <Download className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl border border-gray-100 bg-gray-50/90 p-1">
            {PHASES.map((phase, index) => {
              const done = index < activeIndex || isDone;
              const active = index === activeIndex && !isDone;
              const Icon = phase.icon;

              return (
                <div
                  key={phase.id}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center transition-colors ${
                    active
                      ? 'border border-gray-100 bg-white text-gray-900 shadow-sm'
                      : done
                        ? 'text-emerald-700'
                        : 'text-gray-400'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${active && phase.id === 'preparing' ? 'animate-spin' : ''}`}
                    aria-hidden
                  />
                  <span className="text-[10px] font-semibold">{phase.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3 text-xs font-medium">
              <span className="text-gray-600">{statusLine(progress)}</span>
              <span className="tabular-nums text-gray-900">{percent}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                  isDone ? 'bg-emerald-500' : 'bg-gray-900'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3.5">
            <p className="text-sm font-medium text-gray-900">{progress.message}</p>
            {progress.filename ? (
              <p className="mt-1 truncate font-mono text-[11px] text-gray-500">{progress.filename}</p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
              {DEFAULT_EXPORT_SCALE}× · {exportW.toLocaleString()}×{exportH.toLocaleString()}px
            </span>
            <span className="rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-[11px] font-medium text-blue-700">
              {progress.total} cards
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
