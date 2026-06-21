import type { GlobalSettings } from '@/app/lib/types';

const MAX = 5 * 1024 * 1024;

export async function remoteUrlToDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return url;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX) return url;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return url;
  }
}

export async function embedGlobalImages(settings: GlobalSettings): Promise<GlobalSettings> {
  const [coverPhotoUrl, photoUrl] = await Promise.all([
    remoteUrlToDataUrl(settings.coverPhotoUrl),
    remoteUrlToDataUrl(settings.photoUrl),
  ]);

  return {
    ...settings,
    coverPhotoUrl,
    photoUrl,
  };
}
