import { NextResponse } from 'next/server';

const MAX = 5 * 1024 * 1024;

function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url.pathname)) return false;
    if (/\.supabase\.co$/i.test(url.hostname)) return true;
    if (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string') {
      const projectHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
      if (url.hostname === projectHost) return true;
    }
    if (typeof process.env.SUPABASE_URL === 'string') {
      const projectHost = new URL(process.env.SUPABASE_URL).hostname;
      if (url.hostname === projectHost) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const url = typeof (body as { url?: unknown }).url === 'string' ? (body as { url: string }).url : '';
  if (!url || !isAllowedImageUrl(url)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const dataUrl = `data:${contentType};base64,${buf.toString('base64')}`;
  return NextResponse.json({ dataUrl });
}
