'use client';

import React from 'react';
import { AppState, InterviewCardPage } from '@/app/lib/types';
import { CARD_WIDTH, CARD_HEIGHT } from '@/app/lib/constants';
import CoverCard from '@/app/components/cards/CoverCard';
import AbstractCard from '@/app/components/cards/AbstractCard';
import InterviewCard from '@/app/components/cards/InterviewCard';

interface ExportContainerProps {
  state: AppState;
  interviewPages: InterviewCardPage[];
}

function ExportSlot({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        fontFamily: "'Noto Sans KR', sans-serif",
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        backgroundColor: '#ffffff',
      }}
    >
      {children}
    </div>
  );
}

export default function ExportContainer({ state, interviewPages }: ExportContainerProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        pointerEvents: 'none',
        opacity: 0,
      }}
    >
      <div style={{ position: 'relative', width: CARD_WIDTH, height: CARD_HEIGHT }}>
        <ExportSlot id="export-cover">
          <CoverCard settings={state.global} />
        </ExportSlot>
      </div>
      <div style={{ position: 'relative', width: CARD_WIDTH, height: CARD_HEIGHT }}>
        <ExportSlot id="export-abstract">
          <AbstractCard settings={state.global} text={state.abstract.text} />
        </ExportSlot>
      </div>
      {interviewPages.map((page, i) => (
        <div key={i} style={{ position: 'relative', width: CARD_WIDTH, height: CARD_HEIGHT }}>
          <ExportSlot id={`export-interview-${String(i + 1).padStart(2, '0')}`}>
            <InterviewCard
              messages={page.messages}
              pageIndex={page.pageIndex}
              totalPages={interviewPages.length}
              photoUrl={state.global.photoUrl}
              volume={state.global.volume}
            />
          </ExportSlot>
        </div>
      ))}
    </div>
  );
}
