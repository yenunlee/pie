'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/app/components/editor/RichTextEditor';

interface AbstractEditorProps {
  text: string;
  onChange: (text: string) => void;
}

export default function AbstractEditor({ text, onChange }: AbstractEditorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">초록 본문</Label>
        <RichTextEditor
          value={text}
          onChange={onChange}
          minHeight={280}
          placeholder="인터뷰이 소개 및 연구 내용을 입력하세요."
        />
      </div>
      <p className="text-xs text-gray-400">텍스트를 선택하고 B/H 버튼 또는 Cmd/Ctrl+B, Cmd/Ctrl+H를 사용하세요. Cmd/Ctrl+Z로 실행 취소할 수 있습니다.</p>
    </div>
  );
}
