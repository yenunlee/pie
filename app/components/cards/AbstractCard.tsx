import React from 'react';
import { DesignSettings, GlobalSettings } from '@/app/lib/types';
import { COLORS, DEFAULT_DESIGN_SETTINGS } from '@/app/lib/constants';
import HighlightedText from '@/app/lib/HighlightedText';

interface AbstractCardProps {
  settings: GlobalSettings;
  text: string;
  design?: DesignSettings;
}

export default function AbstractCard({ settings, text, design = DEFAULT_DESIGN_SETTINGS }: AbstractCardProps) {
  const { intervieweeName, intervieweeAffiliation } = settings;
  const titleText = `${intervieweeAffiliation || '소속'} ${intervieweeName || '이름'} 인터뷰`;
  const d = { ...DEFAULT_DESIGN_SETTINGS, ...design };

  const bodyText = text.trim() ? text : '인터뷰 소개 텍스트를 입력하세요.';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      padding: `${d.abstractCardPaddingTop}px ${d.abstractCardPaddingX}px`,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: d.abstractTitleFontSize,
        fontWeight: d.abstractTitleFontWeight,
        color: COLORS.textPrimary,
        lineHeight: 1.6,
        textDecoration: d.abstractTitleUnderline ? 'underline' : 'none',
        textUnderlineOffset: 5,
        marginBottom: d.abstractTitleMarginBottom,
        letterSpacing: '-0.01em',
      }}>
        {titleText}
      </div>

      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'block',
        fontSize: d.abstractTextSize,
        fontWeight: d.abstractBodyFontWeight,
        lineHeight: d.abstractBodyLineHeight,
        letterSpacing: '-0.02em',
        color: '#222222',
        whiteSpace: 'pre-wrap',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
      }}>
        <HighlightedText
          text={bodyText}
          highlightColor={d.abstractHighlightColor}
          boldFontWeight={d.abstractBoldFontWeight}
        />
      </div>

      <div style={{
        marginTop: 40,
        borderTop: `3px solid ${d.abstractHighlightColor}`,
        paddingTop: 20,
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <span style={{
          fontSize: d.abstractFooterLabelFontSize,
          fontWeight: 700,
          color: COLORS.textSecondary,
          letterSpacing: '0.05em',
        }}>
          People in IE
        </span>
      </div>
    </div>
  );
}
