import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/server-client';
import {
  normalizeEditionTitle,
  prepareEditionStateForPersist,
} from '@/app/lib/edition-helpers';
import { isPieStateJson } from '@/app/lib/edition-model';
import { isValidStudioRequest } from '@/app/lib/studio-auth-shared';
import type { AppState } from '@/app/lib/types';
import type { EditionSummary } from '@/app/lib/edition-api';

type EditionRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  state_json?: unknown;
};

function summaryFromRow(row: EditionRow): EditionSummary {
  const state = isPieStateJson(row.state_json) ? (row.state_json as AppState) : null;
  return {
    id: row.id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    volume: state?.global.volume,
    issueDate: state?.global.issueDate,
    intervieweeName: state?.global.intervieweeName,
  };
}

async function unauthorizedIfNeeded(req: Request) {
  if (await isValidStudioRequest(req)) return null;
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function GET(req: Request) {
  const authError = await unauthorizedIfNeeded(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ enabled: false, items: [] as const });
  }

  const { data, error } = await supabase
    .from('pie_card_news_editions')
    .select('id,title,created_at,updated_at,state_json')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ enabled: true, error: error.message, items: [] }, { status: 500 });
  }

  return NextResponse.json({ enabled: true, items: (data ?? []).map(summaryFromRow) });
}

export async function POST(req: Request) {
  const authError = await unauthorizedIfNeeded(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const b = body as { title?: unknown; state?: unknown };
  if (!b?.state || !isPieStateJson(b.state)) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 });
  }

  let state: AppState;
  try {
    state = await prepareEditionStateForPersist(supabase, b.state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'photo_upload_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const title = normalizeEditionTitle(b.title, state);

  const { data, error } = await supabase
    .from('pie_card_news_editions')
    .insert({
      title,
      state_json: state,
    })
    .select('id,title,created_at,updated_at,state_json')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ edition: summaryFromRow(data) });
}
