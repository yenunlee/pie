'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState } from '@/app/lib/types';
import {
  createEdition,
  defaultEditionTitle,
  deleteEdition,
  editionIdentityFromSummary,
  listEditions,
  loadEdition,
  updateEdition,
  type EditionIdentity,
  type EditionSummary,
  type SavedEdition,
} from '@/app/lib/edition-api';
import { Button } from '@/components/ui/button';

interface EditionLibraryPanelProps {
  open: boolean;
  onClose: () => void;
  /** Current editor state (include merged `design` from page). */
  snapshot: AppState;
  currentEdition: EditionIdentity | null;
  onSaved: (edition: EditionIdentity) => void;
  onLoad: (edition: SavedEdition) => void;
  onNewProject: () => void;
}

export default function EditionLibraryPanel({
  open,
  onClose,
  snapshot,
  currentEdition,
  onSaved,
  onLoad,
  onNewProject,
}: EditionLibraryPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [items, setItems] = useState<EditionSummary[]>([]);
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setMessage(null);
    try {
      const result = await listEditions();
      setEnabled(result.enabled);
      setItems(result.items);
    } catch (e) {
      setEnabled(false);
      setItems([]);
      setMessage(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
    setTitle(currentEdition?.title ?? defaultEditionTitle(snapshot));
    setQuery('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentEdition?.title, onClose, open, refresh, snapshot.global.volume]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(row => {
      const haystack = [row.title, row.volume, row.issueDate, row.intervieweeName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const saveCurrent = async (mode: 'update' | 'create') => {
    if (!enabled || busy) return;
    if (mode === 'update' && !currentEdition) return;
    setBusy(true);
    setMessage(null);
    try {
      const saved =
        mode === 'update' && currentEdition
          ? await updateEdition(currentEdition.id, title.trim(), snapshot)
          : await createEdition(title.trim(), snapshot);
      onSaved(editionIdentityFromSummary(saved));
      setTitle(saved.title);
      setMessage(mode === 'update' ? '저장했습니다.' : '새 파일로 저장했습니다.');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  const loadOne = async (id: string) => {
    if (busy || !confirm('현재 에디터 내용을 이 파일로 바꿀까요? 저장하지 않은 변경은 없어집니다.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const edition = await loadEdition(id);
      onLoad(edition);
      onClose();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (id: string) => {
    if (busy || !confirm('이 파일을 삭제할까요?')) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteEdition(id);
      if (currentEdition?.id === id) {
        setMessage('삭제했습니다. 현재 열린 파일은 더 이상 저장되어 있지 않습니다.');
      } else {
        setMessage('삭제했습니다.');
      }
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusy(false);
    }
  };

  const startNewProject = () => {
    if (busy || !confirm('새 프로젝트를 시작할까요? 현재 편집 중인 내용은 자동 임시저장만 남습니다.')) return;
    onNewProject();
    onClose();
  };

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ko-KR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const rowMeta = (row: EditionSummary) =>
    [row.volume ? `vol.${row.volume}` : null, row.intervieweeName, row.issueDate].filter(Boolean).join(' · ');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10">
      <button
        type="button"
        aria-label="라이브러리 닫기"
        className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-library-title"
        className="relative z-10 flex h-[min(92vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-gray-950/20 ring-1 ring-black/5"
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-gray-50/90 to-white px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p id="edition-library-title" className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-[1.75rem]">
                라이브러리
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                {currentEdition ? (
                  <>
                    현재 작업 중:{' '}
                    <span className="font-medium text-gray-800">{currentEdition.title}</span>
                  </>
                ) : (
                  '저장되지 않은 임시 프로젝트입니다. 아래에서 저장하거나 기존 파일을 열 수 있습니다.'
                )}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 rounded-full text-gray-500 hover:bg-gray-100"
              onClick={onClose}
            >
              <span className="sr-only">닫기</span>
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </header>

        {!enabled ? (
          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <div className="max-w-xl rounded-3xl border border-amber-100 bg-amber-50/80 px-6 py-5 text-center text-sm leading-7 text-amber-950">
              Supabase가 아직 연결되지 않았습니다.
              <br />
              <code className="rounded bg-white/80 px-1.5 py-0.5">.env.local</code>에{' '}
              <code className="rounded bg-white/80 px-1.5 py-0.5">SUPABASE_URL</code>과{' '}
              <code className="rounded bg-white/80 px-1.5 py-0.5">SUPABASE_SECRET_KEY</code>를 넣은 뒤 서버를 다시
              시작하세요.
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <section className="border-b border-gray-100 bg-gray-50/40 px-6 py-6 sm:px-8 lg:border-b-0 lg:border-r">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Save</p>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Current</p>
                  <p className="mt-2 text-base font-semibold leading-snug text-gray-900">
                    {currentEdition?.title ?? 'Unsaved draft'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {snapshot.global.intervieweeName || '이름 미입력'}
                    {snapshot.global.volume ? ` · vol.${snapshot.global.volume}` : ''}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="edition-title">
                    파일 이름
                  </label>
                  <input
                    id="edition-title"
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="예: PIE vol.63 — 5월호"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                  <Button
                    type="button"
                    className="h-11 rounded-2xl bg-gray-950 text-sm font-semibold text-white hover:bg-gray-800"
                    disabled={busy || !currentEdition}
                    onClick={() => void saveCurrent('update')}
                  >
                    {busy ? '처리 중…' : '저장'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-gray-200 bg-white text-sm font-semibold"
                    disabled={busy}
                    onClick={() => void saveCurrent('create')}
                  >
                    새 파일로 저장
                  </Button>
                </div>

                <p className="text-xs leading-6 text-gray-400">
                  초록, 인터뷰, 스타일, 메타데이터, 페이지 나누기가 함께 저장됩니다.
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full rounded-2xl text-sm font-medium text-gray-500 hover:bg-white/80"
                  disabled={busy}
                  onClick={startNewProject}
                >
                  새 프로젝트
                </Button>

                {message ? (
                  <p className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-gray-700 ring-1 ring-gray-200">
                    {message}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="flex min-h-0 min-w-0 flex-col">
              <div className="shrink-0 border-b border-gray-100 px-6 py-5 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Browse</p>
                    <p className="mt-2 text-sm text-gray-500">
                      {items.length > 0 ? `${filteredItems.length} / ${items.length} files` : '저장된 파일 없음'}
                    </p>
                  </div>
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="이름, vol, 인터뷰이 검색"
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8 sm:py-6">
                {items.length === 0 ? (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-[1.75rem] border border-dashed border-gray-200 bg-gray-50/70 px-8 text-center">
                    <div className="max-w-sm">
                      <p className="text-lg font-medium text-gray-700">아직 저장된 파일이 없습니다</p>
                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        왼쪽에서 현재 작업을 저장하면 여기에 표시됩니다.
                      </p>
                    </div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex min-h-[240px] items-center justify-center rounded-[1.75rem] border border-dashed border-gray-200 px-6 text-center text-sm text-gray-400">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {filteredItems.map(row => {
                      const isActive = currentEdition?.id === row.id;
                      return (
                        <li
                          key={row.id}
                          className={`flex min-h-[132px] flex-col justify-between rounded-[1.35rem] border p-5 transition-all ${
                            isActive
                              ? 'border-blue-200 bg-blue-50/80 shadow-sm shadow-blue-100/60'
                              : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-start gap-2">
                              <p className="line-clamp-2 text-base font-semibold leading-snug text-gray-900">
                                {row.title}
                              </p>
                              {isActive ? (
                                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                                  열림
                                </span>
                              ) : null}
                            </div>
                            {rowMeta(row) ? (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-500">{rowMeta(row)}</p>
                            ) : null}
                            <p className="mt-3 text-xs text-gray-400">수정 {fmt(row.updated_at)}</p>
                          </div>

                          <div className="mt-4 flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 flex-1 rounded-xl text-sm font-semibold"
                              disabled={busy}
                              onClick={() => void loadOne(row.id)}
                            >
                              열기
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-10 rounded-xl px-4 text-sm font-medium text-red-600 hover:bg-red-50"
                              disabled={busy}
                              onClick={() => void removeOne(row.id)}
                            >
                              삭제
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
