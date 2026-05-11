'use client';

import { useCallback } from 'react';
import type { AppState, InterviewCardPage } from '@/app/lib/types';

type CardPayload =
  | { type: 'cover'; settings: AppState['global']; design: AppState['design'] }
  | { type: 'abstract'; settings: AppState['global']; text: string; design: AppState['design'] }
  | { type: 'interview'; messages: AppState['interview']['messages']; pageIndex: number; totalPages: number; photoUrl: string | null; volume: string; design: AppState['design'] };

interface ExportCard {
  filename: string;
  payload: CardPayload;
}

export function useExport() {
  const exportCards = useCallback(async (state: AppState, interviewPages: InterviewCardPage[]) => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folder = zip.folder('PIE_cards')!;

    const vol = state.global.volume || '00';

    const cards: ExportCard[] = [
      {
        filename: `PIE_vol${vol}_cover.png`,
        payload: { type: 'cover', settings: state.global, design: state.design },
      },
      {
        filename: `PIE_vol${vol}_abstract.png`,
        payload: { type: 'abstract', settings: state.global, text: state.abstract.text, design: state.design },
      },
      ...interviewPages.map((page, i) => ({
        filename: `PIE_vol${vol}_interview_${String(i + 1).padStart(2, '0')}.png`,
        payload: {
          type: 'interview' as const,
          messages: page.messages,
          pageIndex: page.pageIndex,
          totalPages: interviewPages.length,
          photoUrl: state.global.photoUrl,
          volume: state.global.volume,
          design: state.design,
        },
      })),
    ];

    for (const card of cards) {
      const res = await fetch('/api/export-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card.payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Export failed for ${card.filename}: ${err}`);
      }

      const blob = await res.blob();
      folder.file(card.filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PIE_cards.zip';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportCards };
}
