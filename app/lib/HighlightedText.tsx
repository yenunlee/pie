import React from 'react';
import { parseFormattedText, balanceFormattingMarkers } from '@/app/lib/utils';
import { COLORS } from '@/app/lib/constants';

export interface HighlightedTextProps {
  text: string;
  /** Defaults to COLORS.highlight (카드 디자인의 초록 하이라이트 등). */
  highlightColor?: string;
  /** `**마커**` 구간만 적용·부모 블록이 기본 굵기 설정. 기본값 800. */
  boldFontWeight?: number;
}

export default function HighlightedText({ text, highlightColor, boldFontWeight = 800 }: HighlightedTextProps) {
  const parts = parseFormattedText(balanceFormattingMarkers(text));
  const hl = highlightColor ?? COLORS.highlight;

  const highlightCss = {
    backgroundColor: hl,
    borderRadius: 3,
    padding: '0 2px',
    boxDecorationBreak: 'clone' as const,
    WebkitBoxDecorationBreak: 'clone' as const,
  };

  return (
    <>
      {parts.map((part, partIndex) => {
        const lines = part.text.split('\n');

        return lines.map((line, lineIndex) => (
          <React.Fragment key={`${partIndex}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            <span
              style={{
                ...(part.highlight ? highlightCss : {}),
                ...(part.bold ? { fontWeight: boldFontWeight } : {}),
              }}
            >
              {line}
            </span>
          </React.Fragment>
        ));
      })}
    </>
  );
}
