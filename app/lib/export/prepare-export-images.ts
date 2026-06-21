function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(blob);
  });
}

async function fetchRemoteImageAsDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) throw new Error('fetch_failed');
    return blobToDataUrl(await res.blob());
  } catch {
    const res = await fetch('/api/pie-image-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('proxy_failed');
    const body = (await res.json()) as { dataUrl?: string };
    if (!body.dataUrl) throw new Error('missing_data_url');
    return body.dataUrl;
  }
}

function waitForImageElement(img: HTMLImageElement): Promise<void> {
  img.loading = 'eager';
  img.decoding = 'sync';

  const src = img.currentSrc || img.getAttribute('src') || '';
  if (src && (!img.complete || img.naturalWidth === 0)) {
    img.src = src;
  }

  if (img.complete && img.naturalWidth > 0) {
    return img.decode?.().then(() => undefined).catch(() => undefined) ?? Promise.resolve();
  }

  return new Promise(resolve => {
    const finish = () => resolve();
    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });
    window.setTimeout(finish, 8000);
  });
}

/** Ensure `<img>` nodes inside an export slot are decoded and safe for html-to-image. */
export async function prepareImagesForCapture(root: HTMLElement): Promise<() => void> {
  const restores: Array<() => void> = [];
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map(async img => {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (!src) return;

      if (src.startsWith('data:')) {
        await waitForImageElement(img);
        return;
      }

      if (!/^https?:\/\//i.test(src)) return;

      img.crossOrigin = 'anonymous';
      try {
        const dataUrl = await fetchRemoteImageAsDataUrl(src);
        const previous = img.src;
        img.src = dataUrl;
        img.removeAttribute('srcset');
        restores.push(() => {
          img.src = previous;
        });
        await waitForImageElement(img);
      } catch (error) {
        console.warn('[export] Could not inline image for capture:', src, error);
        await waitForImageElement(img);
      }
    }),
  );

  return () => {
    for (const restore of restores) restore();
  };
}

export async function waitForExportImages(): Promise<void> {
  if (typeof document === 'undefined') return;

  const images = Array.from(document.querySelectorAll('[id^="export-"] img'));
  await Promise.all(images.map(img => waitForImageElement(img as HTMLImageElement)));
}
