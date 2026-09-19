CREATE OR REPLACE FUNCTION get_total_reader_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT count(DISTINCT reader_id)::integer
  FROM recommendations
  WHERE status = 'approved' AND reader_id IS NOT NULL;
$$;
