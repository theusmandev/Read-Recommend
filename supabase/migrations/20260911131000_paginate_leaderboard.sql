CREATE OR REPLACE FUNCTION public.leaderboard(period TEXT DEFAULT 'all', p_limit INT DEFAULT 30, p_offset INT DEFAULT 0)
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
  LIMIT p_limit OFFSET p_offset;
$$;
