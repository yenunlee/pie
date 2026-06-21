'use client';

import { useMemo } from 'react';
import { DesignSettings, MessageBlock, InterviewCardPage } from '@/app/lib/types';
import { paginateInterviewMessages } from '@/app/lib/interview-pagination';

export function usePagination(
  messages: MessageBlock[],
  design: DesignSettings,
  pageBreaksAfter: string[] = [],
): InterviewCardPage[] {
  return useMemo(
    () => paginateInterviewMessages(messages, design, pageBreaksAfter),
    [messages, design, pageBreaksAfter],
  );
}
