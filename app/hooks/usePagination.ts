'use client';

import { useMemo } from 'react';
import { DesignSettings, MessageBlock, InterviewCardPage } from '@/app/lib/types';
import { CARD_HEIGHT, CARD_WIDTH, INTERVIEW_CARD_FOOTER_RESERVE_PX, mergeDesignSettings } from '@/app/lib/constants';

function estimateBubbleHeight(
  msg: MessageBlock,
  textSize: number,
  bubblePaddingY: number,
  bubbleTextWidth: number,
): number {
  const lineHeightPx = textSize * 1.75;
  const charUnit = Math.max(8, textSize * 0.55);
  const charsPerLine = Math.max(
    msg.role === 'interviewer' ? 14 : 13,
    Math.floor(bubbleTextWidth / charUnit),
  );
  const lineCount = Math.ceil(msg.content.length / charsPerLine) || 1;
  return lineCount * lineHeightPx + 2 * bubblePaddingY;
}

export function usePagination(messages: MessageBlock[], design: DesignSettings): InterviewCardPage[] {
  return useMemo(() => {
    const d = mergeDesignSettings(design);

    if (messages.length === 0) return [];

    const cardContentHeight =
      CARD_HEIGHT
      - d.interviewContentPaddingTop
      - d.interviewContentPaddingBottom
      - INTERVIEW_CARD_FOOTER_RESERVE_PX;

    const contentInnerWidth = CARD_WIDTH - 2 * d.interviewContentPaddingX;
    const bubbleTextWidth = contentInnerWidth * 0.72 - 2 * d.interviewBubblePaddingX;

    const pages: InterviewCardPage[] = [];
    let currentMessages: MessageBlock[] = [];
    let currentHeight = 0;

    for (const msg of messages) {
      const msgHeight =
        estimateBubbleHeight(msg, d.interviewTextSize, d.interviewBubblePaddingY, bubbleTextWidth)
        + d.interviewBubbleGap;

      if (currentHeight + msgHeight > cardContentHeight && currentMessages.length > 0) {
        pages.push({ messages: currentMessages, pageIndex: pages.length });
        currentMessages = [msg];
        currentHeight = msgHeight;
      } else {
        currentMessages.push(msg);
        currentHeight += msgHeight;
      }
    }

    if (currentMessages.length > 0) {
      pages.push({ messages: currentMessages, pageIndex: pages.length });
    }

    return pages;
  }, [messages, design]);
}
