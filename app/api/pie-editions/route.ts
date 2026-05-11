import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/server-client';
import {
  normalizeStateForPersist,
  remotePhotoUrl,
} from '@/app/lib/edition-helpers';
import { isPieStateJson } from '@/app/lib/edition-model';

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ enabled: false, items: [] as const });
  }

  const { data, error } = await supabase
    .from('pie_card_news_editions')
    .select('id,title,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ enabled: true, error: error.message, items: [] }, { status: 500 });
  }

  return NextResponse.json({ enabled: true, items: data ?? [] });
}

export async function POST(req: Request) {
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

  let state = normalizeStateForPersist(b.state);
  try {
    const uploaded = await remotePhotoUrl(supabase, state.global.photoUrl);
    state = {
      ...state,
      global: { ...state.global, photoUrl: uploaded },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'photo_upload_failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const titleRaw = typeof b.title === 'string' ? b.title.trim().slice(0, 240) : '';
  const title =
    titleRaw !== ''
      ? titleRaw
      : `PIE vol.${state.global.volume || '?'}`.trim();

  const { data, error } = await supabase
    .from('pie_card_news_editions')
    .insert({
      title,
      state_json: state,
    })
    .select('id,title,created_at,updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ edition: data });
}
