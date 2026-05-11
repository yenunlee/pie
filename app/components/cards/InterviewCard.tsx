import React from 'react';
import { DesignSettings, MessageBlock } from '@/app/lib/types';
import { COLORS, DEFAULT_DESIGN_SETTINGS } from '@/app/lib/constants';
import HighlightedText from '@/app/lib/HighlightedText';

interface InterviewCardProps {
  messages: MessageBlock[];
  pageIndex: number;
  totalPages: number;
  photoUrl: string | null;
  volume: string;
  design?: DesignSettings;
}

export default function InterviewCard({ messages, pageIndex, totalPages, photoUrl, volume, design = DEFAULT_DESIGN_SETTINGS }: InterviewCardProps) {
  void volume;
  const effectiveDesign = { ...DEFAULT_DESIGN_SETTINGS, ...design };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        padding: `${effectiveDesign.interviewContentPaddingTop}px ${effectiveDesign.interviewContentPaddingX}px ${effectiveDesign.interviewContentPaddingBottom}px ${effectiveDesign.interviewContentPaddingX}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: effectiveDesign.interviewBubbleGap,
        overflow: 'hidden',
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'interviewer' ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            {/* Avatar for interviewee */}
            {msg.role === 'interviewee' && (
              <div style={{
                width: effectiveDesign.avatarSize,
                height: effectiveDesign.avatarSize,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                marginTop: 6,
                backgroundColor: '#ccc',
                display: 'flex',
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#b0c8e0' }} />
                )}
              </div>
            )}

            {/* Bubble */}
            <div style={{
              display: 'block',
              maxWidth: '72%',
              alignSelf: msg.role === 'interviewer' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'interviewer' ? effectiveDesign.interviewerBubbleColor : effectiveDesign.intervieweeBubbleColor,
              border: msg.role === 'interviewee' ? `1px solid ${COLORS.intervieweeBubbleBorder}` : 'none',
              borderRadius: msg.role === 'interviewer' ? '22px 5px 22px 22px' : '5px 22px 22px 22px',
              padding: `${effectiveDesign.interviewBubblePaddingY}px ${effectiveDesign.interviewBubblePaddingX}px`,
              fontSize: effectiveDesign.interviewTextSize,
              fontWeight: 600,
              lineHeight: 1.75,
              letterSpacing: '-0.02em',
              color: COLORS.textPrimary,
              whiteSpace: 'pre-wrap',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}>
              <HighlightedText text={msg.content} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer dot indicator */}
      {totalPages > 1 && (
        <div style={{
          padding: '16px 0 24px 0',
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
        }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i === pageIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === pageIndex ? effectiveDesign.interviewerBubbleColor : '#c8d8e8',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
