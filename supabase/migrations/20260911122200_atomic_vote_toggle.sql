-- 1. Drop old triggers and functions
DROP TRIGGER IF EXISTS recommendation_votes_sync ON public.recommendation_votes;
DROP FUNCTION IF EXISTS public.sync_helpful_count();

DROP TRIGGER IF EXISTS debug_delete_trigger ON public.recommendation_votes;
DROP FUNCTION IF EXISTS public.log_delete_attempt();
DROP TABLE IF EXISTS public.debug_delete_log;

DROP FUNCTION IF EXISTS public.debug_whoami();

-- 2. Create the new atomic toggle RPC
CREATE OR REPLACE FUNCTION public.toggle_helpful_vote(p_recommendation_id UUID, p_voter_fingerprint TEXT)
RETURNS TABLE(is_voted boolean, new_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_new_count integer;
BEGIN
  -- Check if the vote already exists
  SELECT EXISTS (
    SELECT 1 FROM public.recommendation_votes 
    WHERE recommendation_id = p_recommendation_id AND voter_fingerprint = p_voter_fingerprint
  ) INTO v_exists;

  IF v_exists THEN
    -- It exists, so delete it
    DELETE FROM public.recommendation_votes
    WHERE recommendation_id = p_recommendation_id AND voter_fingerprint = p_voter_fingerprint;
    
    -- Decrement the count
    UPDATE public.recommendations
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE id = p_recommendation_id
    RETURNING helpful_count INTO v_new_count;

    is_voted := false;
  ELSE
    -- It doesn't exist, so insert it
    INSERT INTO public.recommendation_votes (recommendation_id, voter_fingerprint)
    VALUES (p_recommendation_id, p_voter_fingerprint);
    
    -- Increment the count
    UPDATE public.recommendations
    SET helpful_count = helpful_count + 1
    WHERE id = p_recommendation_id
    RETURNING helpful_count INTO v_new_count;

    is_voted := true;
  END IF;

  new_count := v_new_count;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_helpful_vote(UUID, TEXT) TO anon, authenticated;
