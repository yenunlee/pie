import React from 'react';
import { DesignSettings, GlobalSettings } from '@/app/lib/types';
import { COLORS, DEFAULT_DESIGN_SETTINGS, ABSTRACT_CARD_BACKGROUND } from '@/app/lib/constants';
import HighlightedText from '@/app/lib/HighlightedText';
import InlineMarkupEditor from '@/app/components/editor/InlineMarkupEditor';

interface AbstractCardProps {
  settings: GlobalSettings;
  text: string;
  design?: DesignSettings;
  editable?: boolean;
  isSelected?: boolean;
  onBodySelect?: () => void;
  onClearSelection?: () => void;
  onEditChange?: (text: string) => void;
}

export default function AbstractCard({
  settings,
  text,
  design = DEFAULT_DESIGN_SETTINGS,
  editable = false,
  isSelected = false,
  onBodySelect,
  onClearSelection,
  onEditChange,
}: AbstractCardProps) {
  const { intervieweeName, intervieweeAffiliation } = settings;
  const titleText = `${intervieweeAffiliation || '소속'} ${intervieweeName || '이름'} 인터뷰`;
  const d = { ...DEFAULT_DESIGN_SETTINGS, ...design };

  const bodyText = text.trim() ? text : '인터뷰 소개 텍스트를 입력하세요.';

  return (
    <div
      className="card-news-font"
      onClick={editable ? onClearSelection : undefined}
      style={{
      width: '100%',
      height: '100%',
      background: ABSTRACT_CARD_BACKGROUND,
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

      <div
        onClick={editable ? e => { e.stopPropagation(); onBodySelect?.(); } : undefined}
        style={{
        flex: 1,
        overflow: isSelected ? 'auto' : 'hidden',
        display: 'block',
        fontSize: d.abstractTextSize,
        fontWeight: d.abstractBodyFontWeight,
        lineHeight: d.abstractBodyLineHeight,
        letterSpacing: '-0.02em',
        color: '#222222',
        whiteSpace: 'pre-wrap',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        cursor: editable ? 'text' : undefined,
        boxShadow: isSelected ? `0 0 0 2px ${d.abstractHighlightColor}` : undefined,
        borderRadius: isSelected ? 8 : undefined,
        transition: 'box-shadow 0.15s ease',
      }}>
        {isSelected ? (
          <InlineMarkupEditor
            value={text}
            onChange={v => onEditChange?.(v)}
            placeholder="인터뷰 소개 텍스트를 입력하세요."
            highlightColor={d.abstractHighlightColor}
            autoFocus
            style={{
              fontSize: d.abstractTextSize,
              fontWeight: d.abstractBodyFontWeight,
              lineHeight: d.abstractBodyLineHeight,
              letterSpacing: '-0.02em',
              color: '#222222',
              minHeight: 280,
            }}
          />
        ) : (
          <HighlightedText
            text={bodyText}
            highlightColor={d.abstractHighlightColor}
            boldFontWeight={d.abstractBoldFontWeight}
          />
        )}
      </div>
    </div>
  );
}
