import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase/server-client';

export function GET() {
  const enabled = getSupabaseAdmin() !== null;
  return NextResponse.json({ enabled });
}
