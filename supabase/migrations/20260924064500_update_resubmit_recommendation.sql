CREATE OR REPLACE FUNCTION public.update_and_resubmit_recommendation(p_recommendation_id UUID, p_reader_id UUID, p_reason TEXT, p_genre TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM public.recommendations
  WHERE id = p_recommendation_id AND reader_id = p_reader_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recommendation not found or you do not have permission to edit it';
  END IF;

  IF v_status != 'rejected' THEN
    RAISE EXCEPTION 'Only rejected recommendations can be edited and resubmitted';
  END IF;

  UPDATE public.recommendations
  SET 
    reason = p_reason,
    genre = p_genre,
    status = 'pending',
    rejection_reason = NULL
  WHERE id = p_recommendation_id AND reader_id = p_reader_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_and_resubmit_recommendation(UUID, UUID, TEXT, TEXT) TO anon, authenticated, service_role;
