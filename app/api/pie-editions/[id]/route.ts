import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/server-client';
import { isPieStateJson } from '@/app/lib/edition-model';
import {
  normalizeEditionTitle,
  prepareEditionStateForPersist,
} from '@/app/lib/edition-helpers';
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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authError = await unauthorizedIfNeeded(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const { id } = await context.params;
  const { data, error } = await supabase
    .from('pie_card_news_editions')
    .select('id,title,created_at,updated_at,state_json')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (!isPieStateJson(data.state_json)) {
    return NextResponse.json({ error: 'bad_payload' }, { status: 500 });
  }

  return NextResponse.json({
    edition: {
      id: data.id,
      title: data.title,
      created_at: data.created_at,
      updated_at: data.updated_at,
      volume: data.state_json.global.volume,
      issueDate: data.state_json.global.issueDate,
      intervieweeName: data.state_json.global.intervieweeName,
      state: data.state_json,
    },
  });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  const title = normalizeEditionTitle(b.title, state);
  const { data, error } = await supabase
    .from('pie_card_news_editions')
    .update({
      title,
      state_json: state,
    })
    .eq('id', id)
    .select('id,title,created_at,updated_at,state_json')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ edition: summaryFromRow(data) });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authError = await unauthorizedIfNeeded(req);
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from('pie_card_news_editions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
