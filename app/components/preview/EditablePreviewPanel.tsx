'use client';

import React, { useMemo, useState } from 'react';
import { AppState, InterviewCardPage, MessageRole } from '@/app/lib/types';
import { PREVIEW_SCALE, CARD_WIDTH, CARD_HEIGHT, mergeDesignSettings } from '@/app/lib/constants';
import CoverCard from '@/app/components/cards/CoverCard';
import AbstractCard from '@/app/components/cards/AbstractCard';
import InterviewCard from '@/app/components/cards/InterviewCard';
import FloatingActionBar, { type FloatingActionBarAction } from '@/app/components/editor/FloatingActionBar';
import { FilePlus, MessageCircle, MessageSquare, Trash2 } from 'lucide-react';

type Selection =
  | { kind: 'message'; id: string }
  | { kind: 'abstract' }
  | null;

interface EditablePreviewPanelProps {
  state: AppState;
  interviewPages: InterviewCardPage[];
  onAbstractChange: (text: string) => void;
  onMessageChange: (id: string, content: string) => void;
  onMessageParagraphBreak: (id: string, before: string, after: string) => string;
  onMessageSplitParts: (id: string, parts: string[]) => string;
  onAddMessage: (afterMessageId: string | null, role: MessageRole) => void;
  onRemoveMessage: (id: string) => void;
  onTogglePageBreak: (afterMessageId: string) => void;
  onAddInterviewPage: () => void;
}

type CardDescriptor =
  | { type: 'cover' }
  | { type: 'abstract' }
  | { type: 'interview'; page: InterviewCardPage };

export default function EditablePreviewPanel({
  state,
  interviewPages,
  onAbstractChange,
  onMessageChange,
  onMessageParagraphBreak,
  onMessageSplitParts,
  onAddMessage,
  onRemoveMessage,
  onTogglePageBreak,
  onAddInterviewPage,
}: EditablePreviewPanelProps) {
  const [selection, setSelection] = useState<Selection>(null);

  const cards: CardDescriptor[] = [
    { type: 'cover' },
    { type: 'abstract' },
    ...interviewPages.map(p => ({ type: 'interview' as const, page: p })),
  ];

  const total = cards.length;
  const pageBreakSet = new Set(state.interview.pageBreaksAfter ?? []);
  const design = mergeDesignSettings(state.design);

  const selectedMessage = useMemo(() => {
    if (selection?.kind !== 'message') return null;
    return state.interview.messages.find(m => m.id === selection.id) ?? null;
  }, [selection, state.interview.messages]);

  const cardLabel = (c: CardDescriptor): string | null => {
    if (c.type === 'cover') return 'Cover';
    if (c.type === 'abstract') return 'Abstract';
    return null;
  };

  const afterId = selection?.kind === 'message' ? selection.id : null;

  const actionBar = useMemo((): { label: string; actions: FloatingActionBarAction[]; onClear?: () => void } => {
    const appendActions: FloatingActionBarAction[] = [
      {
        id: 'add-q',
        label: '질문 추가',
        icon: <MessageCircle className="h-3.5 w-3.5" />,
        onClick: () => {
          const last = state.interview.messages[state.interview.messages.length - 1];
          onAddMessage(afterId ?? last?.id ?? null, 'interviewer');
        },
      },
      {
        id: 'add-a',
        label: '답변 추가',
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        onClick: () => {
          const last = state.interview.messages[state.interview.messages.length - 1];
          onAddMessage(afterId ?? last?.id ?? null, 'interviewee');
        },
      },
      {
        id: 'add-page',
        label: '페이지 추가',
        icon: <FilePlus className="h-3.5 w-3.5" />,
        onClick: onAddInterviewPage,
      },
    ];

    if (selection?.kind === 'message' && selectedMessage) {
      const hasBreak = pageBreakSet.has(selectedMessage.id);
      return {
        label: selectedMessage.role === 'interviewer' ? '질문 선택됨' : '답변 선택됨',
        actions: [
          ...appendActions,
          {
            id: 'page-break',
            label: hasBreak ? '페이지 나누기 취소' : '페이지 나누기',
            icon: <FilePlus className="h-3.5 w-3.5" />,
            onClick: () => onTogglePageBreak(selectedMessage.id),
            variant: hasBreak ? 'warning' : 'default',
          },
          {
            id: 'delete',
            label: '삭제',
            icon: <Trash2 className="h-3.5 w-3.5" />,
            variant: 'danger',
            onClick: () => {
              onRemoveMessage(selectedMessage.id);
              setSelection(null);
            },
          },
        ],
        onClear: () => setSelection(null),
      };
    }

    if (selection?.kind === 'abstract') {
      return {
        label: '초록 선택됨',
        actions: appendActions.filter(a => a.id !== 'add-page'),
        onClear: () => setSelection(null),
      };
    }

    return {
      label: '말풍선을 클릭하여 편집',
      actions: appendActions,
    };
  }, [
    afterId,
    onAddInterviewPage,
    onAddMessage,
    onTogglePageBreak,
    onRemoveMessage,
    pageBreakSet,
    selectedMessage,
    selection,
    state.interview.messages,
  ]);

  return (
    <>
      <div
        className="flex flex-col items-center gap-8 px-4 py-8 pb-28 sm:px-6"
        onClick={() => setSelection(null)}
      >
        {cards.map((c, i) => (
          <div key={i} className="flex w-full max-w-[620px] flex-col items-center gap-3">
            <div
              className="flex items-center justify-between px-1"
              style={{ width: CARD_WIDTH * PREVIEW_SCALE }}
            >
              <span className="text-xs font-semibold text-gray-500">{cardLabel(c) ?? ''}</span>
              {design.showPageIndicators && (
                <span className="text-xs text-gray-400">{i + 1} / {total}</span>
              )}
            </div>

            <div
              className="relative overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/5"
              style={{ width: CARD_WIDTH * PREVIEW_SCALE, height: CARD_HEIGHT * PREVIEW_SCALE }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: 'top left',
                  width: CARD_WIDTH,
                  height: CARD_HEIGHT,
                }}
              >
                {c.type === 'cover' && <CoverCard settings={state.global} design={state.design} />}
                {c.type === 'abstract' && (
                  <AbstractCard
                    settings={state.global}
                    text={state.abstract.text}
                    design={state.design}
                    editable
                    isSelected={selection?.kind === 'abstract'}
                    onBodySelect={() => setSelection({ kind: 'abstract' })}
                    onClearSelection={() => setSelection(null)}
                    onEditChange={onAbstractChange}
                  />
                )}
                {c.type === 'interview' && (
                  <InterviewCard
                    messages={c.page.messages}
                    pageIndex={c.page.pageIndex}
                    totalPages={interviewPages.length}
                    photoUrl={state.global.photoUrl}
                    volume={state.global.volume}
                    design={state.design}
                    editable
                    selectedMessageId={selection?.kind === 'message' ? selection.id : null}
                    onMessageSelect={id => setSelection({ kind: 'message', id })}
                    onClearSelection={() => setSelection(null)}
                    onMessageChange={onMessageChange}
                    onMessageParagraphBreak={(id, before, after) => {
                      const newId = onMessageParagraphBreak(id, before, after);
                      setSelection({ kind: 'message', id: newId });
                    }}
                    onMessageSplitParts={(id, parts) => {
                      const newId = onMessageSplitParts(id, parts);
                      setSelection({ kind: 'message', id: newId });
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <FloatingActionBar
        label={actionBar.label}
        actions={actionBar.actions}
        onClear={actionBar.onClear}
        clearLabel="선택 해제"
      />
    </>
  );
}
