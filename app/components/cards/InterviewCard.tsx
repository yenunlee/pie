'use client';

import React from 'react';
import { DesignSettings, MessageBlock } from '@/app/lib/types';
import { COLORS, DEFAULT_DESIGN_SETTINGS } from '@/app/lib/constants';
import HighlightedText from '@/app/lib/HighlightedText';
import InlineMarkupEditor from '@/app/components/editor/InlineMarkupEditor';

interface InterviewCardProps {
  messages: MessageBlock[];
  pageIndex: number;
  totalPages: number;
  photoUrl: string | null;
  volume: string;
  design?: DesignSettings;
  editable?: boolean;
  selectedMessageId?: string | null;
  onMessageSelect?: (id: string) => void;
  onClearSelection?: () => void;
  onMessageChange?: (id: string, content: string) => void;
  onMessageParagraphBreak?: (id: string, before: string, after: string) => void;
  onMessageSplitParts?: (id: string, parts: string[]) => void;
}

export default function InterviewCard({
  messages,
  pageIndex,
  totalPages,
  photoUrl,
  volume,
  design = DEFAULT_DESIGN_SETTINGS,
  editable = false,
  selectedMessageId = null,
  onMessageSelect,
  onClearSelection,
  onMessageChange,
  onMessageParagraphBreak,
  onMessageSplitParts,
}: InterviewCardProps) {
  void volume;
  const effectiveDesign = { ...DEFAULT_DESIGN_SETTINGS, ...design };

  return (
    <div
      className="card-news-font"
      onClick={editable ? onClearSelection : undefined}
      style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      <div style={{
        flex: 1,
        padding: `${effectiveDesign.interviewContentPaddingTop}px ${effectiveDesign.interviewContentPaddingX}px ${effectiveDesign.interviewContentPaddingBottom}px ${effectiveDesign.interviewContentPaddingX}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: effectiveDesign.interviewBubbleGap,
        overflow: 'hidden',
      }}>
        {messages.map((msg, index) => {
          const prev = messages[index - 1];
          const isContinuation = msg.role === 'interviewee' && prev?.role === 'interviewee';
          const showAvatar = msg.role === 'interviewee' && !isContinuation;
          const isSelected = selectedMessageId === msg.id;
          const isInterviewer = msg.role === 'interviewer';

          return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: isInterviewer ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: 12,
              marginTop: isContinuation ? -Math.round(effectiveDesign.interviewBubbleGap * 0.35) : 0,
            }}
          >
            {msg.role === 'interviewee' && (
              showAvatar ? (
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
                    <img
                      src={photoUrl}
                      alt="avatar"
                      loading="eager"
                      decoding="sync"
                      {...(/^https?:\/\//i.test(photoUrl) ? { crossOrigin: 'anonymous' as const } : {})}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#b0c8e0' }} />
                  )}
                </div>
              ) : (
                <div style={{ width: effectiveDesign.avatarSize, flexShrink: 0 }} aria-hidden />
              )
            )}

            <div
              onClick={editable ? e => { e.stopPropagation(); onMessageSelect?.(msg.id); } : undefined}
              style={{
              display: 'block',
              maxWidth: '72%',
              alignSelf: isInterviewer ? 'flex-end' : 'flex-start',
              backgroundColor: isInterviewer ? effectiveDesign.interviewerBubbleColor : effectiveDesign.intervieweeBubbleColor,
              border: msg.role === 'interviewee' ? `1px solid ${COLORS.intervieweeBubbleBorder}` : 'none',
              borderRadius: isInterviewer ? '22px 5px 22px 22px' : '5px 22px 22px 22px',
              padding: `${effectiveDesign.interviewBubblePaddingY}px ${effectiveDesign.interviewBubblePaddingX}px`,
              fontSize: effectiveDesign.interviewTextSize,
              fontWeight: 600,
              lineHeight: 1.75,
              letterSpacing: '-0.02em',
              color: COLORS.textPrimary,
              whiteSpace: 'pre-wrap',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
              cursor: editable ? 'text' : undefined,
              boxShadow: isSelected ? '0 0 0 2px rgba(17,24,39,0.35)' : undefined,
              transition: 'box-shadow 0.15s ease',
            }}>
              {isSelected ? (
                <InlineMarkupEditor
                  value={msg.content}
                  onChange={content => onMessageChange?.(msg.id, content)}
                  onParagraphBreak={({ before, after }) =>
                    onMessageParagraphBreak?.(msg.id, before, after)
                  }
                  onSplitParagraphs={parts => onMessageSplitParts?.(msg.id, parts)}
                  placeholder={isInterviewer ? '질문을 입력하세요…' : '답변을 입력하세요…'}
                  autoFocus
                  style={{
                    fontSize: effectiveDesign.interviewTextSize,
                    fontWeight: 600,
                    lineHeight: 1.75,
                    letterSpacing: '-0.02em',
                    color: COLORS.textPrimary,
                    minHeight: '1.75em',
                  }}
                />
              ) : (
                <HighlightedText
                  text={msg.content.trim() || (editable ? (isInterviewer ? '클릭하여 질문 입력' : '클릭하여 답변 입력') : '')}
                />
              )}
            </div>
          </div>
          );
        })}
      </div>

      {effectiveDesign.showPageIndicators && totalPages > 1 && (
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
