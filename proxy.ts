import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { STUDIO_AUTH_COOKIE, isValidSessionToken } from '@/app/lib/studio-auth-shared';

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/studio')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(STUDIO_AUTH_COOKIE)?.value;
  if (await isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/', request.url);
  loginUrl.searchParams.set('from', 'studio');
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/studio/:path*'],
};
