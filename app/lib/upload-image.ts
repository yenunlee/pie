const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

export type ImageStorageFolder = 'covers' | 'profiles';

export function imageExtFromFile(file: File): string | null {
  if (file.type) {
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') return 'jpg';
    if (file.type === 'image/png') return 'png';
    if (file.type === 'image/webp') return 'webp';
    if (file.type === 'image/gif') return 'gif';
  }
  const match = file.name.match(/\.(jpe?g|png|webp|gif)$/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

export function normalizeImageFile(file: File): File {
  const ext = imageExtFromFile(file);
  if (!ext || file.type) return file;
  const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return new File([file], file.name, { type, lastModified: file.lastModified });
}
export function isAcceptedImageFile(file: File): boolean {
  return imageExtFromFile(file) !== null;
}

export function pickImageFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const files = dataTransfer.files;
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isAcceptedImageFile(file)) return file;
    }
    return null;
  }

  for (const item of Array.from(dataTransfer.items)) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file && isAcceptedImageFile(file)) return file;
  }

  return null;
}

export async function uploadImageFile(
  file: File,
  options: { cloudUploadEnabled?: boolean; folder?: ImageStorageFolder } = {},
): Promise<string> {
  if (!isAcceptedImageFile(file)) {
    throw new Error('unsupported_type');
  }

  const { cloudUploadEnabled = false, folder = 'covers' } = options;
  const normalized = normalizeImageFile(file);

  if (cloudUploadEnabled) {
    try {
      const fd = new FormData();
      fd.append('file', normalized);
      fd.append('folder', folder);
      const res = await fetch('/api/pie-upload', { method: 'POST', body: fd });
      if (res.ok) {
        const j = (await res.json()) as { publicUrl?: string };
        if (j.publicUrl) return j.publicUrl;
      }
    } catch {
      // fall through to local preview
    }
  }

  return readFileAsDataUrl(normalized);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(ev.target?.result as string);
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

export { ACCEPT as IMAGE_UPLOAD_ACCEPT };
