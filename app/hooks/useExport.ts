'use client';

import { useCallback } from 'react';
import type { AppState, InterviewCardPage } from '@/app/lib/types';
import { CARD_HEIGHT, CARD_WIDTH } from '@/app/lib/constants';
import {
  captureCardElement,
  DEFAULT_EXPORT_SCALE,
  waitForExportLayout,
} from '@/app/lib/export/capture-card-dom';
import {
  EXPORT_ABSTRACT_ID,
  EXPORT_COVER_ID,
  exportInterviewSlotId,
} from '@/app/lib/export/export-slot-ids';

type CardPayload =
  | { type: 'cover'; settings: AppState['global']; design: AppState['design']; scale?: number }
  | { type: 'abstract'; settings: AppState['global']; text: string; design: AppState['design']; scale?: number }
  | {
      type: 'interview';
      messages: AppState['interview']['messages'];
      pageIndex: number;
      totalPages: number;
      photoUrl: string | null;
      volume: string;
      design: AppState['design'];
      scale?: number;
    };

interface ExportTarget {
  slotId: string;
  filename: string;
  payload: CardPayload;
}

export type ExportProgressPhase = 'preparing' | 'rendering' | 'zipping' | 'done';

export interface ExportProgress {
  phase: ExportProgressPhase;
  current: number;
  total: number;
  percent: number;
  filename?: string;
  message: string;
}

interface ExportOptions {
  scale?: number;
  onProgress?: (progress: ExportProgress) => void;
}

async function fetchCardPng(payload: CardPayload): Promise<Blob> {
  const res = await fetch('/api/export-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Export failed (${res.status})`);
  }

  return res.blob();
}

async function captureCardBlob(target: ExportTarget, scale: number): Promise<Blob> {
  const node = document.getElementById(target.slotId);
  if (node) {
    try {
      return await captureCardElement(node, scale);
    } catch (domError) {
      console.warn(`[export] DOM capture failed for ${target.filename}, falling back to server`, domError);
    }
  }

  return fetchCardPng(target.payload);
}

export function useExport() {
  const exportCards = useCallback(async (
    state: AppState,
    interviewPages: InterviewCardPage[],
    options: ExportOptions = {},
  ) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder('PIE_cards')!;

    const vol = state.global.volume || '00';
    const design = state.design;
    const scale = Math.max(1, options.scale ?? DEFAULT_EXPORT_SCALE);

    const targets: ExportTarget[] = [
      {
        slotId: EXPORT_COVER_ID,
        filename: `PIE_vol${vol}_cover.png`,
        payload: { type: 'cover', settings: state.global, design, scale },
      },
      {
        slotId: EXPORT_ABSTRACT_ID,
        filename: `PIE_vol${vol}_abstract.png`,
        payload: { type: 'abstract', settings: state.global, text: state.abstract.text, design, scale },
      },
      ...interviewPages.map((page, i) => ({
        slotId: exportInterviewSlotId(i),
        filename: `PIE_vol${vol}_interview_${String(i + 1).padStart(2, '0')}.png`,
        payload: {
          type: 'interview' as const,
          messages: page.messages,
          pageIndex: page.pageIndex,
          totalPages: interviewPages.length,
          photoUrl: state.global.photoUrl,
          volume: state.global.volume,
          design,
          scale,
        },
      })),
    ];

    options.onProgress?.({
      phase: 'preparing',
      current: 0,
      total: targets.length,
      percent: 2,
      message: `Preparing ${scale}x export (${CARD_WIDTH * scale}×${CARD_HEIGHT * scale})`,
    });
    await waitForExportLayout();
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    for (const [index, target] of targets.entries()) {
      options.onProgress?.({
        phase: 'rendering',
        current: index + 1,
        total: targets.length,
        percent: Math.round(((index + 1) / targets.length) * 88),
        filename: target.filename,
        message: `Rendering ${target.filename}`,
      });
      const blob = await captureCardBlob(target, scale);
      folder.file(target.filename, blob);
    }

    options.onProgress?.({
      phase: 'zipping',
      current: targets.length,
      total: targets.length,
      percent: 92,
      message: 'Compressing PNG files into ZIP',
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' }, metadata => {
      options.onProgress?.({
        phase: 'zipping',
        current: targets.length,
        total: targets.length,
        percent: 92 + Math.round(metadata.percent * 0.08),
        message: `Compressing ZIP ${Math.round(metadata.percent)}%`,
      });
    });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PIE_cards.zip';
    a.click();
    URL.revokeObjectURL(url);

    options.onProgress?.({
      phase: 'done',
      current: targets.length,
      total: targets.length,
      percent: 100,
      message: 'Export complete',
    });
  }, []);

  return { exportCards };
}
