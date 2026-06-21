import type { AppState } from '@/app/lib/types';
import { mergeDesignSettings } from '@/app/lib/constants';
import { generateId } from '@/app/lib/utils';

export function isPieStateJson(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const global = v.global;
  const design = v.design;
  const abstractPart = v.abstract;
  const interviewPart = v.interview;
  if (!global || typeof global !== 'object') return false;
  if (!design || typeof design !== 'object') return false;
  if (!abstractPart || typeof abstractPart !== 'object') return false;
  if (!(interviewPart && typeof interviewPart === 'object' && Array.isArray((interviewPart as { messages?: unknown }).messages))) {
    return false;
  }
  return typeof (abstractPart as { text?: unknown }).text === 'string';
}

/** Safe merge after loading from DB (fixes partial design, message ids). */
export function coerceLoadedAppState(raw: unknown): AppState | null {
  if (!isPieStateJson(raw)) return null;
  const s = raw as AppState;
  return {
    global: {
      volume: typeof s.global.volume === 'string' ? s.global.volume : '',
      issueDate: typeof s.global.issueDate === 'string' ? s.global.issueDate : '',
      intervieweeName: typeof s.global.intervieweeName === 'string' ? s.global.intervieweeName : '',
      intervieweeAffiliation: typeof s.global.intervieweeAffiliation === 'string'
        ? s.global.intervieweeAffiliation : '',
      unitLabel: typeof s.global.unitLabel === 'string' ? s.global.unitLabel : '',
      coverPhotoUrl:
        s.global.coverPhotoUrl === null || s.global.coverPhotoUrl === undefined
          ? null
          : typeof s.global.coverPhotoUrl === 'string'
            ? s.global.coverPhotoUrl
            : null,
      photoUrl:
        s.global.photoUrl === null || s.global.photoUrl === undefined
          ? null
          : typeof s.global.photoUrl === 'string'
            ? s.global.photoUrl
            : null,
    },
    design: mergeDesignSettings(s.design),
    abstract: {
      text: typeof s.abstract.text === 'string' ? s.abstract.text : '',
    },
    interview: {
      messages: s.interview.messages.map((m) => ({
        id: typeof m?.id === 'string' && m.id ? m.id : generateId(),
        role: m?.role === 'interviewee' ? 'interviewee' : 'interviewer',
        content: typeof m?.content === 'string' ? m.content : '',
      })),
      pageBreaksAfter: Array.isArray(s.interview.pageBreaksAfter)
        ? s.interview.pageBreaksAfter.filter((id): id is string => typeof id === 'string')
        : [],
    },
  };
}
