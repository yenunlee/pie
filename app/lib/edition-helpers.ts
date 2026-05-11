import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppState } from '@/app/lib/types';
import { mergeDesignSettings } from '@/app/lib/constants';

const DATA_URL =
  /^data:image\/(jpeg|jpg|png|gif|webp);base64,([\s\S]+)$/i;

export function normalizeStateForPersist(state: AppState): AppState {
  return {
    ...state,
    design: mergeDesignSettings(state.design),
  };
}

/** Upload legacy data-URL photos to Storage; returns https public URL or original if already remote/null. */
export async function remotePhotoUrl(
  supabase: SupabaseClient,
  photoUrl: string | null,
): Promise<string | null> {
  if (!photoUrl?.startsWith('data:')) return photoUrl;

  const trimmed = photoUrl.replace(/\s/g, '');
  const m = DATA_URL.exec(trimmed);
  if (!m) return photoUrl;

  let ext = m[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) {
    throw new Error('Photo exceeds 5 MB after decode');
  }

  const path = `covers/${randomUUID()}.${ext}`;
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const { error } = await supabase.storage.from('pie-card-news').upload(path, buf, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('pie-card-news').getPublicUrl(path);
  return data.publicUrl;
}
