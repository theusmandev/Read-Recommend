CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE public.novels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  normalized_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX novels_normalized_unique ON public.novels (normalized_title);

CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  reader_name TEXT,
  reason TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT 'Other',
  status TEXT NOT NULL DEFAULT 'pending',
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recommendations_status_check CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT recommendations_genre_check CHECK (genre IN ('Romance','Social','Mystery','Historical','Fantasy','Other')),
  CONSTRAINT recommendations_reason_len CHECK (char_length(reason) BETWEEN 1 AND 300)
);
CREATE INDEX recommendations_status_created_idx ON public.recommendations (status, created_at DESC);

CREATE TABLE public.recommendation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (recommendation_id, voter_fingerprint)
);

GRANT SELECT, INSERT ON public.novels TO anon, authenticated;
GRANT ALL ON public.novels TO service_role;
GRANT SELECT, INSERT ON public.recommendations TO anon, authenticated;
GRANT ALL ON public.recommendations TO service_role;
GRANT INSERT ON public.recommendation_votes TO anon, authenticated;
GRANT ALL ON public.recommendation_votes TO service_role;

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read novels" ON public.novels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add a novel" ON public.novels FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can read approved recommendations" ON public.recommendations FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Anyone can submit a pending recommendation" ON public.recommendations FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND helpful_count = 0);

CREATE POLICY "Anyone can vote on approved recommendations" ON public.recommendation_votes FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.recommendations r WHERE r.id = recommendation_id AND r.status = 'approved'));

CREATE OR REPLACE FUNCTION public.sync_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.recommendations
  SET helpful_count = (SELECT count(*) FROM public.recommendation_votes v WHERE v.recommendation_id = NEW.recommendation_id)
  WHERE id = NEW.recommendation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER recommendation_votes_sync
AFTER INSERT ON public.recommendation_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_helpful_count();

CREATE OR REPLACE FUNCTION public.leaderboard(period TEXT DEFAULT 'all')
RETURNS TABLE (
  novel_id UUID,
  title TEXT,
  author_name TEXT,
  recommendation_count BIGINT,
  helpful_total BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.id, n.title, n.author_name, count(r.id), COALESCE(sum(r.helpful_count), 0)
  FROM public.novels n
  JOIN public.recommendations r ON r.novel_id = n.id AND r.status = 'approved'
  WHERE r.created_at >= CASE
    WHEN period = 'week' THEN now() - interval '7 days'
    WHEN period = 'month' THEN now() - interval '30 days'
    ELSE '-infinity'::timestamptz
  END
  GROUP BY n.id, n.title, n.author_name
  ORDER BY COALESCE(sum(r.helpful_count), 0) DESC, count(r.id) DESC, n.title ASC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard(TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_novels(q TEXT)
RETURNS TABLE (id UUID, title TEXT, author_name TEXT, score REAL)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT n.id, n.title, n.author_name, extensions.similarity(n.normalized_title, lower(trim(q)))
  FROM public.novels n
  WHERE extensions.similarity(n.normalized_title, lower(trim(q))) > 0.25
     OR n.normalized_title ILIKE '%' || lower(trim(q)) || '%'
  ORDER BY extensions.similarity(n.normalized_title, lower(trim(q))) DESC
  LIMIT 8;
$$;

GRANT EXECUTE ON FUNCTION public.search_novels(TEXT) TO anon, authenticated, service_role;