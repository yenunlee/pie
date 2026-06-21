import { NextResponse } from 'next/server';
import {
  STUDIO_AUTH_COOKIE,
  createSessionToken,
  getExpectedStudioPassword,
  studioPasswordConfigured,
} from '@/app/lib/studio-auth-shared';

export async function GET() {
  return NextResponse.json({ configured: studioPasswordConfigured() });
}

export async function POST(request: Request) {
  const expected = getExpectedStudioPassword();
  if (!expected) {
    return NextResponse.json({ error: 'Studio password is not configured on the server.' }, { status: 503 });
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password?.trim() ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDIO_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
