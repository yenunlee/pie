export const STUDIO_AUTH_COOKIE = 'pie_studio_auth';
export const SESSION_LABEL = 'pie-studio-session-v1';

export function getAuthSecret(): string {
  const secret = process.env.PIE_STUDIO_AUTH_SECRET ?? process.env.PIE_STUDIO_PASSWORD;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'development') return 'pie-dev-secret';
  return '';
}

export function getExpectedStudioPassword(): string | null {
  if (process.env.PIE_STUDIO_PASSWORD) return process.env.PIE_STUDIO_PASSWORD;
  if (process.env.NODE_ENV === 'development') return 'pie';
  return null;
}

export function studioPasswordConfigured(): boolean {
  return getExpectedStudioPassword() !== null;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(): Promise<string> {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('Studio auth is not configured. Set PIE_STUDIO_PASSWORD.');
  }
  return hmacSha256Hex(secret, SESSION_LABEL);
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const expected = await createSessionToken();
    if (token.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < token.length; i += 1) {
      mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(prefix))
    ?.slice(prefix.length);
}

export async function isValidStudioRequest(request: Request): Promise<boolean> {
  const token = getCookieValue(request.headers.get('cookie'), STUDIO_AUTH_COOKIE);
  return isValidSessionToken(token);
}
