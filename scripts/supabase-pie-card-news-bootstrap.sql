-- PIE Card News Studio — run once per Supabase **project**
-- Dashboard → SQL Editor → New query → paste → Run
-- Must match SUPABASE_URL in .env.local (same project Cursor MCP ≠ your Next app unless URLs match).

-- Saved editions (server uses service_role / secret key; table has RLS on, no permissive policies)
CREATE TABLE IF NOT EXISTS public.pie_card_news_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled edition',
  state_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pie_card_news_editions_updated
  ON public.pie_card_news_editions (updated_at DESC);

ALTER TABLE public.pie_card_news_editions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.pie_card_news_editions IS 'Saved editor state for pie-card-news (PIE Card News Studio).';

CREATE OR REPLACE FUNCTION public.pie_card_news_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pie_card_news_editions_updated ON public.pie_card_news_editions;
CREATE TRIGGER pie_card_news_editions_updated
  BEFORE UPDATE ON public.pie_card_news_editions
  FOR EACH ROW
  EXECUTE FUNCTION public.pie_card_news_set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pie-card-news',
  'pie-card-news',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = true;

DROP POLICY IF EXISTS "pie_card_news_public_read" ON storage.objects;
CREATE POLICY "pie_card_news_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'pie-card-news');

-- Hint PostgREST to refresh schema (helps if API still claims table is missing right after DDL)
NOTIFY pgrst, 'reload schema';
