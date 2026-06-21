import type { AppState } from '@/app/lib/types';
import { coerceLoadedAppState } from '@/app/lib/edition-model';

export interface EditionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  volume?: string;
  issueDate?: string;
  intervieweeName?: string;
}

export interface SavedEdition extends EditionSummary {
  state: AppState;
}

export type EditionIdentity = Pick<EditionSummary, 'id' | 'title' | 'updated_at'>;

interface ApiErrorBody {
  error?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) {
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return body;
}

export function defaultEditionTitle(state: AppState): string {
  return state.global.volume ? `PIE vol.${state.global.volume}` : 'Untitled PIE';
}

export function editionIdentityFromSummary(edition: EditionSummary): EditionIdentity {
  return {
    id: edition.id,
    title: edition.title,
    updated_at: edition.updated_at,
  };
}

export async function listEditions(): Promise<{ enabled: boolean; items: EditionSummary[] }> {
  const res = await fetch('/api/pie-editions', { credentials: 'same-origin' });
  const body = await parseJson<{ enabled?: boolean; items?: EditionSummary[] }>(res);
  return {
    enabled: Boolean(body.enabled),
    items: Array.isArray(body.items) ? body.items : [],
  };
}

export async function createEdition(title: string, state: AppState): Promise<EditionSummary> {
  const res = await fetch('/api/pie-editions', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, state }),
  });
  const body = await parseJson<{ edition?: EditionSummary }>(res);
  if (!body.edition) throw new Error('저장 결과가 비어 있습니다.');
  return body.edition;
}

export async function updateEdition(id: string, title: string, state: AppState): Promise<EditionSummary> {
  const res = await fetch(`/api/pie-editions/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, state }),
  });
  const body = await parseJson<{ edition?: EditionSummary }>(res);
  if (!body.edition) throw new Error('저장 결과가 비어 있습니다.');
  return body.edition;
}

export async function loadEdition(id: string): Promise<SavedEdition> {
  const res = await fetch(`/api/pie-editions/${id}`, { credentials: 'same-origin' });
  const body = await parseJson<{ edition?: Omit<SavedEdition, 'state'> & { state?: unknown } }>(res);
  const state = coerceLoadedAppState(body.edition?.state);
  if (!body.edition || !state) throw new Error('잘못된 저장 데이터입니다.');
  return {
    ...body.edition,
    state,
  };
}

export async function deleteEdition(id: string): Promise<void> {
  const res = await fetch(`/api/pie-editions/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  await parseJson<{ ok?: boolean }>(res);
}
