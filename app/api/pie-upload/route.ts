import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/app/lib/supabase/server-client';

const MAX = 5 * 1024 * 1024;

function extFromMime(mime: string): string | null {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return null;
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ error: 'missing_file' }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  }

  const ext = extFromMime(file.type);
  if (!ext) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const path = `covers/${randomUUID()}.${ext}`;
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const { error } = await supabase.storage.from('pie-card-news').upload(path, buf, {
    contentType,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from('pie-card-news').getPublicUrl(path);
  return NextResponse.json({ publicUrl: data.publicUrl });
}
