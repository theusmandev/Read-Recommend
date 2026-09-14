-- Create RPC to fetch a reader's own recommendations regardless of status
CREATE OR REPLACE FUNCTION public.get_my_recommendations(p_reader_id UUID)
RETURNS SETOF public.recommendations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.recommendations
  WHERE reader_id = p_reader_id
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_recommendations(UUID) TO anon, authenticated, service_role;

-- Create RPC to allow a reader to delete their own recommendation
CREATE OR REPLACE FUNCTION public.delete_my_recommendation(p_recommendation_id UUID, p_reader_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.recommendations
  WHERE id = p_recommendation_id AND reader_id = p_reader_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_my_recommendation(UUID, UUID) TO anon, authenticated, service_role;
