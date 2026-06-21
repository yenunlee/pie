import type { DesignSettings } from '@/app/lib/types';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1440;
export const PREVIEW_SCALE = 0.5;
export const PREVIEW_WIDTH = CARD_WIDTH * PREVIEW_SCALE;
export const PREVIEW_HEIGHT = CARD_HEIGHT * PREVIEW_SCALE;

export const COLORS = {
  highlight: '#B8D8F8',
  interviewerBubble: '#DDEEFF',
  intervieweeBubble: '#F1F2F4',
  intervieweeBubbleBorder: '#E3E5E8',
  coverGradientEnd: '#D6E8F7',
  abstractGradientEnd: '#DBEAF6',
  textPrimary: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#888888',
};

export const FONTS = {
  base: "'Noto Sans KR', sans-serif",
};

export const CARD_PADDING = 64;
export const INTERVIEW_CARD_CONTENT_HEIGHT = CARD_HEIGHT - CARD_PADDING * 2;

export const ABSTRACT_CARD_BACKGROUND = `linear-gradient(180deg, #ffffff 0%, #f8fbfe 48%, ${COLORS.abstractGradientEnd} 100%)`;

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  coverTextSize: 100,
  abstractTextSize: 30,
  interviewTextSize: 26,
  interviewerBubbleColor: '#DDEEFF',
  intervieweeBubbleColor: '#F1F2F4',
  avatarSize: 56,
  interviewBubbleGap: 24,
  interviewContentPaddingTop: 72,
  interviewContentPaddingX: 56,
  interviewContentPaddingBottom: 32,
  interviewBubblePaddingY: 18,
  interviewBubblePaddingX: 22,
  abstractTitleFontSize: 33,
  abstractTitleFontWeight: 800,
  abstractTitleUnderline: true,
  abstractBodyFontWeight: 400,
  abstractBoldFontWeight: 800,
  abstractBodyLineHeight: 1.85,
  abstractHighlightColor: COLORS.highlight,
  abstractTitleMarginBottom: 40,
  abstractCardPaddingTop: 72,
  abstractCardPaddingX: 64,
  abstractFooterLabelFontSize: 20,
  showPageIndicators: false,
};

/** Reserve for pagination / page split (dots strip + margins). Mirrors card layout approximation. */
export const INTERVIEW_CARD_FOOTER_RESERVE_PX = 64;

/** Merge partial / legacy payloads so inputs always get defined values (avoids uncontrolled→controlled warnings). */
export function mergeDesignSettings(design: Partial<DesignSettings> | DesignSettings): DesignSettings {
  return { ...DEFAULT_DESIGN_SETTINGS, ...design };
}

export const DESIGN_PRESETS: Array<{ name: string; settings: Partial<DesignSettings> }> = [
  {
    name: 'Soft',
    settings: mergeDesignSettings({}),
  },
  {
    name: 'Clean',
    settings: {
      coverTextSize: 98,
      abstractTextSize: 30,
      interviewTextSize: 25,
      interviewerBubbleColor: '#EAF4FF',
      intervieweeBubbleColor: '#F3F4F6',
      avatarSize: 54,
    },
  },
  {
    name: 'Bold',
    settings: {
      coverTextSize: 108,
      abstractTextSize: 30,
      interviewTextSize: 28,
      interviewerBubbleColor: '#D7EAFF',
      intervieweeBubbleColor: '#ECEFF3',
      avatarSize: 62,
    },
  },
];
