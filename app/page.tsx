'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppState } from '@/app/lib/types';
import { generateId } from '@/app/lib/utils';
import { usePagination } from '@/app/hooks/usePagination';
import { useExport } from '@/app/hooks/useExport';
import GlobalSettingsEditor from '@/app/components/editor/GlobalSettings';
import FloatingStylePanel from '@/app/components/editor/FloatingStylePanel';
import EditionLibraryPanel from '@/app/components/editor/EditionLibraryPanel';
import AbstractEditor from '@/app/components/editor/AbstractEditor';
import InterviewEditor from '@/app/components/editor/InterviewEditor';
import PreviewPanel from '@/app/components/preview/PreviewPanel';
import { DEFAULT_DESIGN_SETTINGS, mergeDesignSettings } from '@/app/lib/constants';
import { Button } from '@/components/ui/button';

const DEFAULT_STATE: AppState = {
  global: {
    volume: '63',
    issueDate: '2026년 5월호',
    intervieweeName: '유용재',
    intervieweeAffiliation: '서울대학교 산업공학과 교수',
    unitLabel: 'Unit:ie',
    photoUrl: null,
  },
  design: DEFAULT_DESIGN_SETTINGS,
  abstract: {
    text: '서울대학교 산업공학과 ==유용재 교수님==을 만났습니다.\n\n교수님은 생산 시스템, 스마트 제조, 그리고 ==인공지능==을 활용한 산업공학 연구에 매진하고 계십니다.\n\n이번 인터뷰에서는 교수님의 연구 여정과 산업공학의 미래에 대해 이야기를 나눠보았습니다.',
  },
  interview: {
    messages: [
      { id: generateId(), role: 'interviewer', content: '교수님, 안녕하세요! 간단한 자기소개 부탁드립니다.' },
      { id: generateId(), role: 'interviewee', content: '안녕하세요. 저는 서울대학교 산업공학과에서 ==스마트 제조==와 생산 시스템을 연구하고 있는 유용재입니다.' },
      { id: generateId(), role: 'interviewer', content: '산업공학을 선택하시게 된 계기가 무엇인가요?' },
      { id: generateId(), role: 'interviewee', content: '학부 때 수학과 공학을 모두 좋아했는데, 산업공학이 두 분야를 잘 융합하고 있다는 점에서 매력을 느꼈습니다. 특히 ==실제 문제를 해결==하는 데 있어 강력한 도구를 제공한다는 점이 좋았습니다.' },
    ],
  },
};

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'abstract' | 'interview'>('global');
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const [libraryPanelOpen, setLibraryPanelOpen] = useState(false);
  const [cloudSaveConfigured, setCloudSaveConfigured] = useState(false);

  useEffect(() => {
    fetch('/api/pie-save-status')
      .then(r => r.json())
      .then((j: { enabled?: boolean }) => setCloudSaveConfigured(Boolean(j.enabled)))
      .catch(() => setCloudSaveConfigured(false));
  }, []);

  const design = useMemo(() => mergeDesignSettings(state.design), [state.design]);

  const interviewPages = usePagination(state.interview.messages, design);
  const { exportCards } = useExport();

  const updateGlobal = useCallback((global: AppState['global']) => {
    setState(s => ({ ...s, global }));
  }, []);

  const updateDesign = useCallback((next: AppState['design']) => {
    setState(s => ({ ...s, design: mergeDesignSettings(next) }));
  }, []);

  const updateAbstract = useCallback((text: string) => {
    setState(s => ({ ...s, abstract: { text } }));
  }, []);

  const updateInterview = useCallback((messages: AppState['interview']['messages']) => {
    setState(s => ({ ...s, interview: { messages } }));
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCards({ ...state, design }, interviewPages);
    } finally {
      setIsExporting(false);
    }
  };

  const editorTabs = [
    { id: 'global' as const, label: 'Settings' },
    { id: 'abstract' as const, label: 'Abstract' },
    { id: 'interview' as const, label: 'Interview' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* Top Nav */}
      <header className="h-[72px] shrink-0 border-b border-gray-200 bg-white/95 px-5 shadow-sm backdrop-blur">
        <div className="flex h-full items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-950 text-lg font-black tracking-tight text-white shadow-sm">
              PIE
            </div>
            <span className="flex flex-col">
              <span className="text-base font-black tracking-tight text-gray-950">Card News Studio</span>
              <span className="text-xs font-medium text-gray-400">People in IE · Instagram carousel builder</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLibraryPanelOpen(true)}
              className="h-10 rounded-xl border-gray-200 text-xs font-bold text-gray-700"
            >
              라이브러리
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold px-5 h-10 gap-2 rounded-xl shadow-sm"
              size="sm"
            >
              {isExporting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Exporting
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export ZIP
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main two-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Editor Panel */}
        <div className="w-[440px] shrink-0 bg-white border-r border-gray-200 flex min-h-0 flex-col">
          <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900">Editor</div>
                <div className="text-xs text-gray-400">Content and card settings</div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStylePanelOpen(true)}
                className="shrink-0 gap-1.5 rounded-xl border-gray-200 text-xs font-bold text-gray-700"
              >
                <svg className="size-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                스타일
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 p-1">
              {editorTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-xl px-3 py-2 text-center text-xs font-bold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="p-5 pb-10">
              {activeTab === 'global' && (
                <GlobalSettingsEditor settings={state.global} onChange={updateGlobal} cloudUploadEnabled={cloudSaveConfigured} />
              )}
              {activeTab === 'abstract' && (
                <AbstractEditor text={state.abstract.text} onChange={updateAbstract} />
              )}
              {activeTab === 'interview' && (
                <InterviewEditor messages={state.interview.messages} onChange={updateInterview} />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview Panel */}
        <div id="preview-section" className="flex-1 overflow-auto bg-gradient-to-br from-slate-100 to-blue-50 scroll-mt-4">
          <PreviewPanel state={{ ...state, design }} interviewPages={interviewPages} />
        </div>
      </div>

      <FloatingStylePanel
        open={stylePanelOpen}
        onClose={() => setStylePanelOpen(false)}
        design={design}
        onDesignChange={updateDesign}
      />
      <EditionLibraryPanel
        open={libraryPanelOpen}
        onClose={() => setLibraryPanelOpen(false)}
        snapshot={{ ...state, design }}
        onLoad={next => setState(next)}
      />
    </div>
  );
}
