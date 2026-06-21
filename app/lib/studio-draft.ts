import type { AppState } from '@/app/lib/types';
import { coerceLoadedAppState } from '@/app/lib/edition-model';

const DRAFT_KEY = 'pie-card-news-draft';

export function loadStudioDraft(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return coerceLoadedAppState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveStudioDraft(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors (e.g. large inline images).
  }
}

export function clearStudioDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
