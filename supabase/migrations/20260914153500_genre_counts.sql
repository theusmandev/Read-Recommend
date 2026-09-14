CREATE OR REPLACE FUNCTION get_genre_counts()
RETURNS TABLE (genre text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT genre, count(*)
  FROM recommendations
  WHERE status = 'approved'
  GROUP BY genre;
$$;
