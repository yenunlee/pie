import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Strip quotes / whitespace from .env pasted values */
function normalizeUrl(raw: string): string | null {
  let u = raw.trim();
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u.replace(/\/+$/, '');
}

function normalizeKey(raw: string): string | null {
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim();
  }
  k = k.replace(/\s+/g, '');
  return k || null;
}

/**
 * Server-side admin client (elevated access, bypasses RLS).
 * Set **one** of:
 * - `SUPABASE_SECRET_KEY` — platform secret (`sb_secret_...`, recommended)
 * - `SUPABASE_SERVICE_ROLE_KEY` — legacy JWT (`eyJ...`), Dashboard "service_role" secret
 * Do **not** use `anon` / publishable keys here.
 *
 * Fresh client each call so `.env.local` fixes apply after save without a cached singleton.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const rawKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    '';
  const url = normalizeUrl(rawUrl);
  const key = normalizeKey(rawKey);
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
