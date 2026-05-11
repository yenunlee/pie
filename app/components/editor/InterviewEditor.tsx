'use client';

import React from 'react';
import { MessageBlock, MessageRole } from '@/app/lib/types';
import { generateId } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/app/components/editor/RichTextEditor';

interface InterviewEditorProps {
  messages: MessageBlock[];
  onChange: (messages: MessageBlock[]) => void;
}

function MessageRow({
  msg,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  msg: MessageBlock;
  index: number;
  total: number;
  onUpdate: (msg: MessageBlock) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const isInterviewer = msg.role === 'interviewer';

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${isInterviewer ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`}>
      {/* Role toggle + controls row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-md overflow-hidden border border-gray-200">
          <button
            className={`px-3 py-1 text-xs font-medium transition-colors ${isInterviewer ? 'bg-blue-400 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => onUpdate({ ...msg, role: 'interviewer' })}
          >
            Q (인터뷰어)
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium transition-colors ${!isInterviewer ? 'bg-gray-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => onUpdate({ ...msg, role: 'interviewee' })}
          >
            A (인터뷰이)
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
            title="위로"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
            title="아래로"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-400"
            title="삭제"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Text area */}
      <RichTextEditor
        value={msg.content}
        onChange={content => onUpdate({ ...msg, content })}
        placeholder={isInterviewer ? '질문을 입력하세요...' : '답변을 입력하세요...'}
        minHeight={86}
      />
    </div>
  );
}

export default function InterviewEditor({ messages, onChange }: InterviewEditorProps) {
  const addMessage = (role: MessageRole) => {
    onChange([...messages, { id: generateId(), role, content: '' }]);
  };

  const updateMessage = (index: number, msg: MessageBlock) => {
    const next = [...messages];
    next[index] = msg;
    onChange(next);
  };

  const removeMessage = (index: number) => {
    onChange(messages.filter((_, i) => i !== index));
  };

  const moveMessage = (index: number, dir: -1 | 1) => {
    const next = [...messages];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
        <p className="text-xs font-medium text-gray-500">
          Select text, then use B/H buttons or Cmd/Ctrl+B, Cmd/Ctrl+H. Cmd/Ctrl+Z will undo edits.
        </p>
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          아래 버튼으로 Q/A 블록을 추가하세요
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {messages.map((msg, i) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            index={i}
            total={messages.length}
            onUpdate={updated => updateMessage(i, updated)}
            onRemove={() => removeMessage(i)}
            onMove={dir => moveMessage(i, dir)}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addMessage('interviewer')}
          className="flex-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          + Q 추가 (인터뷰어)
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => addMessage('interviewee')}
          className="flex-1 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          + A 추가 (인터뷰이)
        </Button>
      </div>
    </div>
  );
}
