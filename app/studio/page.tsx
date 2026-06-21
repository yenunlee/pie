'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppState, MessageRole } from '@/app/lib/types';
import { generateId } from '@/app/lib/utils';
import { usePagination } from '@/app/hooks/usePagination';
import { useExport, type ExportProgress } from '@/app/hooks/useExport';
import GlobalSettingsEditor from '@/app/components/editor/GlobalSettings';
import FloatingStylePanel from '@/app/components/editor/FloatingStylePanel';
import EditionLibraryPanel from '@/app/components/editor/EditionLibraryPanel';
import ParserFormatDialog from '@/app/components/editor/ParserFormatDialog';
import EditablePreviewPanel from '@/app/components/preview/EditablePreviewPanel';
import ExportContainer from '@/app/components/preview/ExportContainer';
import ExportProgressPanel from '@/app/components/preview/ExportProgressPanel';
import DocumentImportPanel from '@/app/components/editor/DocumentImportPanel';
import ImageUploadField from '@/app/components/editor/ImageUploadField';
import StepNav, { type StudioStep } from '@/app/components/editor/StepNav';
import StudioFooter from '@/app/components/StudioFooter';
import { DEFAULT_DESIGN_SETTINGS, mergeDesignSettings } from '@/app/lib/constants';
import { DEFAULT_EXPORT_SCALE } from '@/app/lib/export/capture-card-dom';
import { applyParseResult, parsePieDocument } from '@/app/lib/parse-pie-document';
import { clearStudioDraft, loadStudioDraft, saveStudioDraft } from '@/app/lib/studio-draft';
import type { EditionIdentity, SavedEdition } from '@/app/lib/edition-api';
import { Button } from '@/components/ui/button';
import { LiquidGlassButton } from '@/components/ui/liquid-glass-button';
import '@/app/styles/a2g-fonts.css';

function createDefaultState(): AppState {
  return {
    global: {
      volume: '63',
      issueDate: '2026년 5월호',
      intervieweeName: '유용재',
      intervieweeAffiliation: '서울대학교 산업공학과 교수',
      unitLabel: 'Unit:ie',
      coverPhotoUrl: null,
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
      pageBreaksAfter: [],
    },
  };
}

const INITIAL_STEP_STATUS: Record<StudioStep, 'idle' | 'loading' | 'done' | 'error'> = {
  1: 'idle',
  2: 'idle',
  3: 'idle',
};

function insertMessageAfter(
  messages: AppState['interview']['messages'],
  afterId: string | null,
  role: MessageRole,
) {
  const next = [...messages];
  const index = afterId ? next.findIndex(m => m.id === afterId) : -1;
  const insertAt = index >= 0 ? index + 1 : next.length;
  next.splice(insertAt, 0, { id: generateId(), role, content: '' });
  return next;
}

export default function Home() {
  const [state, setState] = useState<AppState>(createDefaultState);
  const [isExporting, setIsExporting] = useState(false);
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const [libraryPanelOpen, setLibraryPanelOpen] = useState(false);
  const [metadataPanelOpen, setMetadataPanelOpen] = useState(false);
  const [formatGuideOpen, setFormatGuideOpen] = useState(false);
  const [cloudSaveConfigured, setCloudSaveConfigured] = useState(false);
  const [currentEdition, setCurrentEdition] = useState<EditionIdentity | null>(null);

  const [importText, setImportText] = useState('');
  const [importHtml, setImportHtml] = useState<string | undefined>();
  const [viewedStep, setViewedStep] = useState<StudioStep>(1);
  const [currentStep, setCurrentStep] = useState<StudioStep>(1);
  const [stepStatus, setStepStatus] = useState(INITIAL_STEP_STATUS);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [parseSummary, setParseSummary] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  useEffect(() => {
    fetch('/api/pie-save-status')
      .then(r => r.json())
      .then((j: { enabled?: boolean }) => setCloudSaveConfigured(Boolean(j.enabled)))
      .catch(() => setCloudSaveConfigured(false));
  }, []);

  useEffect(() => {
    const draft = loadStudioDraft();
    if (!draft) return;
    setState(draft);
    setViewedStep(2);
    setCurrentStep(2);
    setStepStatus({ ...INITIAL_STEP_STATUS, 1: 'done', 2: 'done' });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => saveStudioDraft(state), 500);
    return () => window.clearTimeout(timer);
  }, [state]);

  const design = useMemo(() => mergeDesignSettings(state.design), [state.design]);
  const pageBreaksAfter = state.interview.pageBreaksAfter ?? [];
  const interviewPages = usePagination(state.interview.messages, design, pageBreaksAfter);
  const { exportCards } = useExport();

  const updateGlobal = useCallback((global: AppState['global']) => {
    setState(s => ({ ...s, global }));
  }, []);

  const updateDesign = useCallback((next: AppState['design']) => {
    setState(s => ({ ...s, design: mergeDesignSettings({ ...s.design, ...next }) }));
  }, []);

  const updateAbstract = useCallback((text: string) => {
    setState(s => ({ ...s, abstract: { text } }));
  }, []);

  const updateMessageContent = useCallback((id: string, content: string) => {
    setState(s => ({
      ...s,
      interview: {
        ...s.interview,
        messages: s.interview.messages.map(m => (m.id === id ? { ...m, content } : m)),
      },
    }));
  }, []);

  const splitMessageIntoParts = useCallback((id: string, parts: string[]): string => {
    const ids = parts.map((_, index) => (index === 0 ? id : generateId()));
    const focusId = ids[ids.length - 1];

    setState(s => {
      const index = s.interview.messages.findIndex(m => m.id === id);
      if (index === -1) return s;

      const role = s.interview.messages[index].role;
      const splitMessages = parts.map((part, partIndex) => ({
        id: ids[partIndex],
        role,
        content: part,
      }));

      return {
        ...s,
        interview: {
          ...s.interview,
          messages: [
            ...s.interview.messages.slice(0, index),
            ...splitMessages,
            ...s.interview.messages.slice(index + 1),
          ],
        },
      };
    });

    return focusId;
  }, []);

  const breakMessageParagraph = useCallback((id: string, before: string, after: string): string => {
    const newId = generateId();
    setState(s => {
      const index = s.interview.messages.findIndex(m => m.id === id);
      if (index === -1) return s;

      const role = s.interview.messages[index].role;
      const messages = [...s.interview.messages];
      messages[index] = { ...messages[index], content: before };
      messages.splice(index + 1, 0, { id: newId, role, content: after });

      return {
        ...s,
        interview: {
          ...s.interview,
          messages,
        },
      };
    });
    return newId;
  }, []);

  const addMessage = useCallback((afterId: string | null, role: MessageRole) => {
    setState(s => ({
      ...s,
      interview: {
        ...s.interview,
        messages: insertMessageAfter(s.interview.messages, afterId, role),
      },
    }));
  }, []);

  const removeMessage = useCallback((id: string) => {
    setState(s => ({
      ...s,
      interview: {
        messages: s.interview.messages.filter(m => m.id !== id),
        pageBreaksAfter: (s.interview.pageBreaksAfter ?? []).filter(bid => bid !== id),
      },
    }));
  }, []);

  const togglePageBreak = useCallback((afterMessageId: string) => {
    setState(s => {
      const existing = s.interview.pageBreaksAfter ?? [];
      const next = existing.includes(afterMessageId)
        ? existing.filter(id => id !== afterMessageId)
        : [...existing, afterMessageId];
      return {
        ...s,
        interview: {
          ...s.interview,
          pageBreaksAfter: next,
        },
      };
    });
  }, []);

  const addInterviewPage = useCallback(() => {
    setState(s => {
      const messages = s.interview.messages;
      const breaks = [...(s.interview.pageBreaksAfter ?? [])];
      const last = messages[messages.length - 1];

      if (last && !breaks.includes(last.id)) breaks.push(last.id);

      const nextMessages =
        messages.length === 0
          ? [{ id: generateId(), role: 'interviewee' as const, content: '' }]
          : [...messages, { id: generateId(), role: 'interviewee' as const, content: '' }];

      return {
        ...s,
        interview: { messages: nextMessages, pageBreaksAfter: breaks },
      };
    });
  }, []);

  const goToEditMode = useCallback(() => {
    setViewedStep(2);
    setCurrentStep(prev => (prev < 2 ? 2 : prev));
    setStepStatus(s => ({ ...s, 2: s[2] === 'done' ? 'done' : 'idle' }));
  }, []);

  const handleLibraryLoad = useCallback((edition: SavedEdition) => {
    setState(edition.state);
    setCurrentEdition({
      id: edition.id,
      title: edition.title,
      updated_at: edition.updated_at,
    });
    setImportText('');
    setImportHtml(undefined);
    setParseError(null);
    setParseWarning(null);
    setParseSummary(null);
    setExportError(null);
    setStylePanelOpen(false);
    setMetadataPanelOpen(false);
    setStepStatus({ ...INITIAL_STEP_STATUS, 1: 'done', 2: 'done' });
    setCurrentStep(2);
    setViewedStep(2);
  }, []);

  const handleNewProject = useCallback(() => {
    clearStudioDraft();
    setState(createDefaultState());
    setCurrentEdition(null);
    setImportText('');
    setImportHtml(undefined);
    setParseError(null);
    setParseWarning(null);
    setParseSummary(null);
    setExportError(null);
    setStylePanelOpen(false);
    setMetadataPanelOpen(false);
    setStepStatus({ ...INITIAL_STEP_STATUS });
    setCurrentStep(1);
    setViewedStep(1);
  }, []);

  const handleParse = () => {
    setParseError(null);
    setParseWarning(null);
    setParseSummary(null);
    setStepStatus(s => ({ ...s, 1: 'loading' }));

    try {
      const result = parsePieDocument({ text: importText, html: importHtml });
      const hasContent = Boolean(result.abstract.trim() || result.messages.length);

      if (!hasContent) {
        setStepStatus(s => ({ ...s, 1: 'error' }));
        setParseError('초록 또는 인터뷰 Q/A를 찾지 못했습니다. 상단 ⓘ 버튼에서 형식 가이드를 확인하세요.');
        return;
      }

      setState(prev => applyParseResult(prev, result));
      setCurrentEdition(null);
      setStepStatus(s => ({ ...s, 1: 'done', 2: 'idle' }));
      setCurrentStep(2);
      setParseSummary(
        `초록 ${result.abstract.trim() ? '1' : '0'} · Q/A ${result.messages.length}개` +
          (Object.keys(result.global).length ? ` · 메타 ${Object.keys(result.global).length}개` : '')
      );
      setParseWarning(result.warnings.length ? result.warnings.join(' ') : null);
    } catch (err) {
      setStepStatus(s => ({ ...s, 1: 'error' }));
      setParseError(err instanceof Error ? err.message : 'Parse failed');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress({
      phase: 'preparing',
      current: 0,
      total: interviewPages.length + 2,
      percent: 0,
      message: 'Starting high-resolution export',
    });
    setStepStatus(s => ({ ...s, 3: 'loading' }));
    try {
      await exportCards(
        { ...state, design },
        interviewPages,
        {
          scale: DEFAULT_EXPORT_SCALE,
          onProgress: setExportProgress,
        },
      );
      setStepStatus(s => ({ ...s, 3: 'done' }));
      setCurrentStep(3);
      setViewedStep(3);
      window.setTimeout(() => setExportProgress(null), 900);
    } catch (err) {
      setStepStatus(s => ({ ...s, 3: 'error' }));
      setExportError(err instanceof Error ? err.message : 'Export failed');
      setExportProgress(null);
    } finally {
      setIsExporting(false);
    }
  };

  const importDone = stepStatus[1] === 'done';
  const isEditView = viewedStep >= 2;
  const exportProgressPercent = Math.min(100, Math.max(0, exportProgress?.percent ?? 0));

  return (
    <div className="a2g-ui flex h-screen flex-col overflow-hidden bg-white">
      <header className="shrink-0 border-b border-gray-100 px-6 py-4 sm:px-9 lg:px-14 xl:px-16">
        <div className="mx-auto max-w-[1920px] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">파이 카뉴 공장</h1>
              <p className="mt-1 text-xs text-gray-400">
                {currentEdition ? `Saved: ${currentEdition.title}` : 'Unsaved draft'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isEditView && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMetadataPanelOpen(true)}
                  className="h-9 rounded-lg border-gray-200 px-4 text-xs font-medium text-gray-700"
                >
                  메타데이터
                </Button>
              )}
              {isEditView && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStylePanelOpen(open => !open)}
                    className={`h-9 rounded-lg px-4 text-xs font-medium ${
                      stylePanelOpen
                        ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    스타일
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLibraryPanelOpen(true)}
                    className="h-9 rounded-lg border-gray-200 px-4 text-xs font-medium text-gray-700"
                  >
                    라이브러리
                  </Button>
                  <LiquidGlassButton size="sm" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? 'Exporting…' : 'Export'}
                  </LiquidGlassButton>
                </>
              )}
            </div>
          </div>
          <StepNav
            currentStep={currentStep}
            viewedStep={viewedStep}
            stepStatus={stepStatus}
            onStepClick={setViewedStep}
          />
        </div>
      </header>

      {!isEditView ? (
        <main className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50/60 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                    홍소팀의 노가다를 줄여줍니다
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    Word(.docx) 파일을 직접 올리거나, 원고 전체를 붙여넣으세요. 하이라이트, 질문/답변, 초록을
                    파서가 읽고 다음 단계에서 바로 편집할 수 있는 말풍선 카드로 바꿉니다.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormatGuideOpen(true)}
                  className="h-9 w-fit rounded-full border-blue-100 bg-blue-50 px-4 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  형식 가이드 보기
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="space-y-4">
              <DocumentImportPanel
                value={importText}
                onChange={text => {
                  setImportText(text);
                  setImportHtml(undefined);
                  if (stepStatus[1] === 'done') setStepStatus(s => ({ ...s, 1: 'idle' }));
                }}
                onPasteHtml={html => setImportHtml(html)}
                onImportDocument={({ text, html }) => {
                  setImportText(text);
                  setImportHtml(html);
                  if (stepStatus[1] === 'done') setStepStatus(s => ({ ...s, 1: 'idle' }));
                }}
                rows={18}
                textareaClassName="min-h-[420px] text-sm leading-7"
              />

                <div className="space-y-2 rounded-3xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                <Button
                  type="button"
                  onClick={handleParse}
                  disabled={importText.trim().length <= 20 || stepStatus[1] === 'loading'}
                    className="h-11 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  {stepStatus[1] === 'loading' ? 'Parsing…' : 'Parse document'}
                </Button>

                {parseError && (
                  <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{parseError}</p>
                )}
                {parseWarning && (
                  <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">{parseWarning}</p>
                )}
                {parseSummary && (
                  <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    Parsed: {parseSummary}
                  </p>
                )}
              </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Library</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    저장해둔 카드뉴스 파일을 바로 열어 이어서 작업합니다.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLibraryPanelOpen(true)}
                    className="mt-3 h-9 w-full rounded-2xl border-gray-200 text-xs font-medium text-gray-700"
                  >
                    Browse saved files
                  </Button>
                  <p className="mt-2 text-[10px] text-gray-300">
                    {cloudSaveConfigured ? 'Cloud library ready' : 'Supabase 연결 시 활성화됩니다'}
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Quick metadata</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    표지와 초록 제목에 들어갈 기본 정보를 미리 채웁니다.
                  </p>
                  <div className="mt-3 space-y-2">
                  <input
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 focus:border-gray-300 focus:outline-none"
                    value={state.global.intervieweeName}
                    onChange={e => updateGlobal({ ...state.global, intervieweeName: e.target.value })}
                    placeholder="이름"
                  />
                  <input
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 focus:border-gray-300 focus:outline-none"
                    value={state.global.intervieweeAffiliation}
                    onChange={e => updateGlobal({ ...state.global, intervieweeAffiliation: e.target.value })}
                    placeholder="소속/직함"
                  />
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Images</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    표지 히어로와 인터뷰 아바타를 미리 올려두세요.
                  </p>
                  <div className="mt-3 space-y-3">
                    <ImageUploadField
                      label="표지 사진"
                      value={state.global.coverPhotoUrl}
                      onChange={url => updateGlobal({ ...state.global, coverPhotoUrl: url })}
                      cloudUploadEnabled={cloudSaveConfigured}
                      previewShape="square"
                      storageFolder="covers"
                      emptyLabel="표지 사진 업로드"
                    />
                    <ImageUploadField
                      label="프로필 사진"
                      value={state.global.photoUrl}
                      onChange={url => updateGlobal({ ...state.global, photoUrl: url })}
                      cloudUploadEnabled={cloudSaveConfigured}
                      previewShape="circle"
                      storageFolder="profiles"
                      emptyLabel="프로필 사진 업로드"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Fun fact</p>
                  <p className="mt-2 text-xs leading-5 text-blue-900/70">
                    미리캔버스에서 작업하다가 너무 킹받아서 만들게 됐습니다.
                  </p>
                </div>
              </aside>
            </div>
            <StudioFooter />
          </div>
        </main>
      ) : (
        <div className="mx-auto grid min-h-0 w-full max-w-[1920px] flex-1 grid-cols-1 grid-rows-[minmax(360px,1fr)] overflow-y-auto md:overflow-hidden">
          <section
            id="preview-section"
            className={`col-start-1 row-start-1 flex h-full min-h-0 min-w-0 flex-col bg-gradient-to-br from-slate-100 to-blue-50/50 transition-[margin] duration-200 ${
              stylePanelOpen ? 'md:mr-[min(400px,100%)]' : ''
            }`}
          >
          {isEditView && stylePanelOpen && (
            <div className="flex shrink-0 items-center border-b border-gray-100/80 bg-white/70 px-5 py-2 backdrop-blur-sm">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                스타일 실시간 반영
              </span>
            </div>
          )}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
              <EditablePreviewPanel
                  state={{ ...state, design }}
                  interviewPages={interviewPages}
                  onAbstractChange={updateAbstract}
                  onMessageChange={updateMessageContent}
                  onMessageParagraphBreak={breakMessageParagraph}
                  onMessageSplitParts={splitMessageIntoParts}
                  onAddMessage={addMessage}
                  onRemoveMessage={removeMessage}
                  onTogglePageBreak={togglePageBreak}
                  onAddInterviewPage={addInterviewPage}
                />
              <StudioFooter />
            </div>
          </section>
        </div>
      )}

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
        currentEdition={currentEdition}
        onSaved={setCurrentEdition}
        onLoad={handleLibraryLoad}
        onNewProject={handleNewProject}
      />
      <ParserFormatDialog open={formatGuideOpen} onClose={() => setFormatGuideOpen(false)} />

      {!isEditView && importDone && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-gray-900 px-5 py-3 text-white shadow-2xl">
          <button
            type="button"
            onClick={goToEditMode}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-700"
          >
            다음: 편집하기
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}

      {metadataPanelOpen && (
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-end p-3 pt-[88px] sm:p-6 sm:pt-[96px]">
          <button
            type="button"
            aria-label="닫기"
            className="pointer-events-auto absolute inset-0 bg-gray-950/20 backdrop-blur-[1px]"
            onClick={() => setMetadataPanelOpen(false)}
          />
          <aside className="pointer-events-auto relative z-10 flex max-h-[min(720px,calc(100vh-7rem))] w-[min(100%,400px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">메타데이터</p>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMetadataPanelOpen(false)}>
                <span className="sr-only">닫기</span>
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <GlobalSettingsEditor
                settings={state.global}
                onChange={updateGlobal}
                cloudUploadEnabled={cloudSaveConfigured}
              />
            </div>
          </aside>
        </div>
      )}

      {exportProgress && (
        <ExportProgressPanel progress={exportProgress} percent={exportProgressPercent} />
      )}

      <ExportContainer state={{ ...state, design }} interviewPages={interviewPages} />

      {exportError && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 max-w-md -translate-x-1/2 px-4">
          <div className="pointer-events-auto rounded-2xl border border-red-100 bg-white/95 px-4 py-3 text-sm text-red-700 shadow-lg ring-1 ring-red-100 backdrop-blur-sm">
            <p className="font-semibold text-red-800">내보내기 실패</p>
            <p className="mt-1 text-xs leading-relaxed text-red-600">{exportError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
