'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { AppState } from '@/app/lib/types';
import { coerceLoadedAppState } from '@/app/lib/edition-model';
import { Button } from '@/components/ui/button';

type Row = { id: string; title: string; created_at: string; updated_at: string };

interface EditionLibraryPanelProps {
  open: boolean;
  onClose: () => void;
  /** Current editor state (include merged `design` from page). */
  snapshot: AppState;
  onLoad: (state: AppState) => void;
}

export default function EditionLibraryPanel({
  open,
  onClose,
  snapshot,
  onLoad,
}: EditionLibraryPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setMessage(null);
    try {
      const res = await fetch('/api/pie-editions');
      const j = (await res.json()) as {
        enabled?: boolean;
        items?: Row[];
        error?: string;
      };
      setEnabled(Boolean(j.enabled));
      setItems(Array.isArray(j.items) ? j.items : []);
      if (j.error) setMessage(j.error);
    } catch {
      setEnabled(false);
      setItems([]);
      setMessage('목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void refresh();
    setTitle(snapshot.global.volume ? `PIE vol.${snapshot.global.volume}` : '');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, refresh, snapshot.global.volume]);

  const saveCurrent = async () => {
    if (!enabled || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/pie-editions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          state: snapshot,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      setMessage('저장되었습니다.');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  const loadOne = async (id: string) => {
    if (busy || !confirm('현재 에디터 내용을 이 에디션으로 바꿀까요? 저장하지 않은 변경은 없어집니다.')) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/pie-editions/${id}`);
      const j = (await res.json()) as {
        edition?: { state?: unknown };
        error?: string;
      };
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      const next = coerceLoadedAppState(j.edition?.state);
      if (!next) throw new Error('잘못된 저장 데이터입니다.');
      onLoad(next);
      setMessage('불러왔습니다.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '불러오기 실패');
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (id: string) => {
    if (busy || !confirm('이 에디션을 삭제할까요?')) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/pie-editions/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      await refresh();
      setMessage('삭제했습니다.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusy(false);
    }
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

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex justify-end p-3 pt-[88px] sm:p-6 sm:pt-[96px]">
      <button
        type="button"
        aria-label="라이브러리 닫기"
        className="pointer-events-auto absolute inset-0 bg-gray-950/20 backdrop-blur-[1px] sm:bg-gray-950/10"
        onClick={onClose}
      />
      <aside
        className="pointer-events-auto relative z-10 flex max-h-[min(720px,calc(100vh-7rem))] w-[min(100%,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-950/15 ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edition-library-title"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50/90 px-3 py-2 pr-2">
          <span id="edition-library-title" className="min-w-0 flex-1 pl-1 text-sm font-bold text-gray-900">
            저장된 PIE 에디션
          </span>
          <Button type="button" variant="ghost" size="icon-sm" className="shrink-0 text-gray-500" onClick={onClose}>
            <span className="sr-only">닫기</span>
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {!enabled && (
            <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
              다음 중 하나를 넣은 뒤 서버를 다시 시작하세요:{' '}
              <code className="rounded bg-white/80 px-1">SUPABASE_URL</code>, 그리고{' '}
              <code className="rounded bg-white/80 px-1">SUPABASE_SECRET_KEY</code>{' '}
              (권장, <code className="px-0.5">sb_secret_…</code>) 또는{' '}
              <code className="rounded bg-white/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
              (레거시 <code className="px-0.5">eyJ…</code>).
            </div>
          )}

          {enabled && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500" htmlFor="edition-title">
                  저장 제목
                </label>
                <input
                  id="edition-title"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="예: PIE vol.63 — 5월호"
                />
              </div>
              <Button
                type="button"
                className="w-full rounded-xl bg-gray-950 text-white hover:bg-gray-800"
                size="sm"
                disabled={busy}
                onClick={() => void saveCurrent()}
              >
                {busy ? '처리 중…' : '현재 에디션 저장'}
              </Button>
              <p className="text-[11px] leading-relaxed text-gray-400">
                초록·인터뷰·스타일·메타데이터·페이지 나누기가 함께 저장됩니다. 사진은 data URL이면 자동으로 Storage에 올리고 공개 URL로 바꿉니다.
              </p>
            </div>
          )}

          {message ? (
            <p className="mt-4 rounded-lg bg-gray-100 px-2 py-1.5 text-xs text-gray-700">{message}</p>
          ) : null}

          <div className="mt-5">
            <div className="mb-2 text-xs font-bold text-gray-800">브라우징</div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400">저장된 에디션이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map(row => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{row.title}</p>
                      <p className="text-[11px] text-gray-400">수정 {fmt(row.updated_at)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs font-bold"
                        disabled={busy}
                        onClick={() => void loadOne(row.id)}
                      >
                        불러오기
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
                        disabled={busy}
                        onClick={() => void removeOne(row.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
