import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/server-client';
import { isPieStateJson } from '@/app/lib/edition-model';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
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
      state: data.state_json,
    },
  });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const { id } = await context.params;
  const { error } = await supabase.from('pie_card_news_editions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
