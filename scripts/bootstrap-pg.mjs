#!/usr/bin/env node
/**
 * Applies scripts/supabase-pie-card-news-bootstrap.sql using Postgres (DATABASE_URL).
 * Use when Cursor Supabase MCP is linked to a different project than .env.local.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, 'supabase-pie-card-news-bootstrap.sql');

function loadDotEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const raw of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"'))
      || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function main() {
  const root = path.join(__dirname, '..');
  const env = loadDotEnv(path.join(root, '.env.local'));
  const conn = env.DATABASE_URL || env.DIRECT_URL;
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;

  if (!conn) {
    const ref = supabaseUrl ? /^https:\/\/([^.]+)\.supabase\.co/i.exec(supabaseUrl)?.[1] : null;
    console.error('\n[bootstrap-pg] DATABASE_URL (또는 DIRECT_URL)이 .env.local에 없습니다.');
    console.error('  Supabase → Project Settings → Database → Connection string → URI');
    console.error('  (postgres 사용자 비밀번호가 포함된 문자열) 를 복사해 넣은 뒤 다시 실행하세요.\n');
    if (ref) {
      console.error(`[bootstrap-pg] 현재 SUPABASE_URL 프로젝트 ref: ${ref}`);
      console.error('  Cursor의 Supabase MCP가 이 ref와 다르면, MCP로 적용한 DDL은 다른 DB에만 생깁니다.\n');
    }
    process.exit(1);
  }

  const sqlRaw = fs.readFileSync(sqlPath, 'utf8');
  const client = new pg.Client({ connectionString: conn });
  await client.connect();
  try {
    await client.query(sqlRaw);
  } finally {
    await client.end();
  }
  console.log('[bootstrap-pg] OK — pie_card_news_editions + storage bucket applied.');
}

await main();
