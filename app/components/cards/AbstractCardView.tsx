import React from 'react';
import { DesignSettings, GlobalSettings } from '@/app/lib/types';
import { COLORS, DEFAULT_DESIGN_SETTINGS, ABSTRACT_CARD_BACKGROUND } from '@/app/lib/constants';

function plainExportText(value: string): string {
  return value.replace(/\*\*|==/g, '');
}

export interface AbstractCardViewProps {
  settings: GlobalSettings;
  text: string;
  design?: DesignSettings;
}

/** Server-side (Satori) abstract card. */
export default function AbstractCardView({
  settings,
  text,
  design = DEFAULT_DESIGN_SETTINGS,
}: AbstractCardViewProps) {
  const { intervieweeName, intervieweeAffiliation } = settings;
  const titleText = `${intervieweeAffiliation || '소속'} ${intervieweeName || '이름'} 인터뷰`;
  const d = { ...DEFAULT_DESIGN_SETTINGS, ...design };
  const bodyText = (text ?? '').trim() || '인터뷰 소개 텍스트를 입력하세요.';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: ABSTRACT_CARD_BACKGROUND,
        padding: `${d.abstractCardPaddingTop}px ${d.abstractCardPaddingX}px`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: d.abstractTitleFontSize,
          fontWeight: d.abstractTitleFontWeight,
          color: COLORS.textPrimary,
          lineHeight: 1.6,
          textDecoration: d.abstractTitleUnderline ? 'underline' : 'none',
          textUnderlineOffset: 5,
          marginBottom: d.abstractTitleMarginBottom,
          letterSpacing: '-0.01em',
        }}
      >
        {titleText}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          fontSize: d.abstractTextSize,
          fontWeight: d.abstractBodyFontWeight,
          lineHeight: d.abstractBodyLineHeight,
          letterSpacing: '-0.02em',
          color: '#222222',
          whiteSpace: 'pre-wrap',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
      >
        {plainExportText(bodyText)}
      </div>
    </div>
  );
}
