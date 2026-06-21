'use client';

import React from 'react';
import { AppState, InterviewCardPage } from '@/app/lib/types';
import { PREVIEW_SCALE, CARD_WIDTH, CARD_HEIGHT, mergeDesignSettings } from '@/app/lib/constants';
import CoverCard from '@/app/components/cards/CoverCard';
import AbstractCard from '@/app/components/cards/AbstractCard';
import InterviewCard from '@/app/components/cards/InterviewCard';

interface PreviewPanelProps {
  state: AppState;
  interviewPages: InterviewCardPage[];
  showHeader?: boolean;
}

type CardDescriptor =
  | { type: 'cover' }
  | { type: 'abstract' }
  | { type: 'interview'; page: InterviewCardPage };

export default function PreviewPanel({ state, interviewPages, showHeader = true }: PreviewPanelProps) {
  const design = mergeDesignSettings(state.design);
  const cards: CardDescriptor[] = [
    { type: 'cover' },
    { type: 'abstract' },
    ...interviewPages.map(p => ({ type: 'interview' as const, page: p })),
  ];

  const total = cards.length;

  const cardLabel = (c: CardDescriptor) => {
    if (c.type === 'cover') return 'Cover';
    if (c.type === 'abstract') return 'Abstract';
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-8 sm:px-6">
      {showHeader && (
        <div className="flex w-full max-w-[620px] items-center justify-between px-2">
          <span className="text-sm font-semibold text-gray-700">Preview</span>
          <span className="text-xs text-gray-400">{total} cards · 3:4 portrait</span>
        </div>
      )}

      {cards.map((c, i) => (
        <div key={i} className="flex w-full max-w-[620px] flex-col items-center gap-3">
          <div
            className="flex items-center justify-between px-1"
            style={{ width: CARD_WIDTH * PREVIEW_SCALE }}
          >
            <span className="text-xs font-semibold text-gray-500">{cardLabel(c) ?? ''}</span>
            {design.showPageIndicators && (
              <span className="text-xs text-gray-400">{i + 1} / {total}</span>
            )}
          </div>

          <div
            className="relative overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/5"
            style={{ width: CARD_WIDTH * PREVIEW_SCALE, height: CARD_HEIGHT * PREVIEW_SCALE }}
          >
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left', width: CARD_WIDTH, height: CARD_HEIGHT }}>
              {c.type === 'cover' && <CoverCard settings={state.global} design={state.design} />}
              {c.type === 'abstract' && <AbstractCard settings={state.global} text={state.abstract.text} design={state.design} />}
              {c.type === 'interview' && (
                <InterviewCard
                  messages={(c as { type: 'interview'; page: InterviewCardPage }).page.messages}
                  pageIndex={(c as { type: 'interview'; page: InterviewCardPage }).page.pageIndex}
                  totalPages={interviewPages.length}
                  photoUrl={state.global.photoUrl}
                  volume={state.global.volume}
                  design={state.design}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
