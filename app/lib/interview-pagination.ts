import type { DesignSettings, InterviewCardPage, MessageBlock } from '@/app/lib/types';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  INTERVIEW_CARD_FOOTER_RESERVE_PX,
  mergeDesignSettings,
} from '@/app/lib/constants';

/** Clearance so the last bubble doesn't sit against the page bottom / dot strip. */
export const INTERVIEW_PAGE_BOTTOM_SAFE_PX = 32;

function stripMarkers(text: string): string {
  return text.replace(/\*\*/g, '').replace(/==/g, '');
}

function estimateLineCount(content: string, charsPerLine: number): number {
  const stripped = stripMarkers(content);
  if (!stripped.trim()) return 1;

  return (
    stripped.split('\n').reduce((total, paragraph) => {
      if (paragraph.length === 0) return total + 1;
      return total + Math.ceil(paragraph.length / charsPerLine);
    }, 0) || 1
  );
}

function estimateBubbleTextHeight(
  content: string,
  textSize: number,
  bubblePaddingY: number,
  bubbleTextWidth: number,
): number {
  const lineHeightPx = textSize * 1.75;
  const charUnit = textSize * 0.9;
  const charsPerLine = Math.max(6, Math.floor(bubbleTextWidth / charUnit));
  const lineCount = estimateLineCount(content, charsPerLine);
  return lineCount * lineHeightPx + 2 * bubblePaddingY;
}

/** Row height for one message block, matching InterviewCard layout. */
export function estimateMessageRowHeight(
  msg: MessageBlock,
  prev: MessageBlock | null,
  design: DesignSettings,
  bubbleTextWidth: number,
): number {
  const bubbleHeight = estimateBubbleTextHeight(
    msg.content,
    design.interviewTextSize,
    design.interviewBubblePaddingY,
    bubbleTextWidth,
  );

  const isContinuation = msg.role === 'interviewee' && prev?.role === 'interviewee';
  const showAvatar = msg.role === 'interviewee' && !isContinuation;

  if (showAvatar) {
    return Math.max(bubbleHeight, design.avatarSize + 6);
  }

  return bubbleHeight;
}

function gapBeforeMessage(msg: MessageBlock, prevOnPage: MessageBlock | null, gap: number): number {
  if (!prevOnPage) return 0;
  const isContinuation = msg.role === 'interviewee' && prevOnPage.role === 'interviewee';
  return isContinuation ? gap - Math.round(gap * 0.35) : gap;
}

export function getInterviewPageContentHeight(design: DesignSettings): number {
  const d = mergeDesignSettings(design);
  const footerReserve = d.showPageIndicators ? INTERVIEW_CARD_FOOTER_RESERVE_PX : 16;
  return (
    CARD_HEIGHT
    - d.interviewContentPaddingTop
    - d.interviewContentPaddingBottom
    - footerReserve
    - INTERVIEW_PAGE_BOTTOM_SAFE_PX
  );
}

export function paginateInterviewMessages(
  messages: MessageBlock[],
  design: DesignSettings,
  pageBreaksAfter: string[] = [],
): InterviewCardPage[] {
  const d = mergeDesignSettings(design);
  const breakSet = new Set(pageBreaksAfter);

  if (messages.length === 0) return [];

  const maxContentHeight = getInterviewPageContentHeight(d);
  const contentInnerWidth = CARD_WIDTH - 2 * d.interviewContentPaddingX;
  const bubbleTextWidth = contentInnerWidth * 0.72 - 2 * d.interviewBubblePaddingX;

  const pages: InterviewCardPage[] = [];
  let currentMessages: MessageBlock[] = [];
  let currentHeight = 0;

  const pushPage = () => {
    if (currentMessages.length === 0) return;
    pages.push({ messages: currentMessages, pageIndex: pages.length });
    currentMessages = [];
    currentHeight = 0;
  };

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    const prev = i > 0 ? messages[i - 1] : null;
    const rowHeight = estimateMessageRowHeight(msg, prev, d, bubbleTextWidth);

    if (currentMessages.length > 0) {
      const prevOnPage = currentMessages[currentMessages.length - 1];
      const gap = gapBeforeMessage(msg, prevOnPage, d.interviewBubbleGap);
      const lastId = prevOnPage.id;
      const forcedBreak = breakSet.has(lastId);
      const wouldOverflow = currentHeight + gap + rowHeight > maxContentHeight;

      if (forcedBreak || wouldOverflow) {
        pushPage();
      }
    }

    if (currentMessages.length > 0) {
      const prevOnPage = currentMessages[currentMessages.length - 1];
      const gap = gapBeforeMessage(msg, prevOnPage, d.interviewBubbleGap);
      currentHeight += gap + rowHeight;
    } else {
      currentHeight = rowHeight;
    }

    currentMessages.push(msg);
  }

  pushPage();

  return pages;
}
