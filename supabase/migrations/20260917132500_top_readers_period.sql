CREATE OR REPLACE FUNCTION get_top_readers(p_period text default 'all', p_limit integer default 20)
RETURNS TABLE (
  reader_id uuid,
  reader_name text,
  approved_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.reader_id,
    rd.name as reader_name,
    COUNT(*) as approved_count
  FROM public.recommendations r
  JOIN public.readers rd ON r.reader_id = rd.id
  WHERE r.status = 'approved'
    AND r.created_at >= CASE
      WHEN p_period = 'week' THEN now() - interval '7 days'
      WHEN p_period = 'month' THEN now() - interval '30 days'
      ELSE '-infinity'::timestamptz
    END
  GROUP BY r.reader_id, rd.name
  HAVING COUNT(*) > 0
  ORDER BY approved_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
