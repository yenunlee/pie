'use client';

import React from 'react';
import { AppState, InterviewCardPage } from '@/app/lib/types';
import { CARD_WIDTH, CARD_HEIGHT } from '@/app/lib/constants';
import CoverCard from '@/app/components/cards/CoverCard';
import AbstractCard from '@/app/components/cards/AbstractCard';
import InterviewCard from '@/app/components/cards/InterviewCard';
import {
  EXPORT_ABSTRACT_ID,
  EXPORT_COVER_ID,
  exportInterviewSlotId,
} from '@/app/lib/export/export-slot-ids';

interface ExportContainerProps {
  state: AppState;
  interviewPages: InterviewCardPage[];
}

function ExportSlot({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className="card-news-font"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        userSelect: 'none',
        WebkitUserSelect: 'none',
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
        top: -100000,
        left: -100000,
        pointerEvents: 'none',
        opacity: 1,
        zIndex: -1,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <ExportSlot id={EXPORT_COVER_ID}>
        <CoverCard settings={state.global} design={state.design} />
      </ExportSlot>

      <ExportSlot id={EXPORT_ABSTRACT_ID}>
        <AbstractCard
          settings={state.global}
          text={state.abstract.text}
          design={state.design}
          editable={false}
        />
      </ExportSlot>

      {interviewPages.map((page, i) => (
        <ExportSlot key={page.pageIndex} id={exportInterviewSlotId(i)}>
          <InterviewCard
            messages={page.messages}
            pageIndex={page.pageIndex}
            totalPages={interviewPages.length}
            photoUrl={state.global.photoUrl}
            volume={state.global.volume}
            design={state.design}
            editable={false}
          />
        </ExportSlot>
      ))}
    </div>
  );
}
