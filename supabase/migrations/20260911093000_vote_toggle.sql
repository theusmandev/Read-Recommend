GRANT DELETE ON public.recommendation_votes TO anon, authenticated;

CREATE POLICY "Anyone can remove their vote" ON public.recommendation_votes FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.sync_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec_id := OLD.recommendation_id;
  ELSE
    rec_id := NEW.recommendation_id;
  END IF;

  UPDATE public.recommendations
  SET helpful_count = (SELECT count(*) FROM public.recommendation_votes v WHERE v.recommendation_id = rec_id)
  WHERE id = rec_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS recommendation_votes_sync ON public.recommendation_votes;
CREATE TRIGGER recommendation_votes_sync
AFTER INSERT OR DELETE ON public.recommendation_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_helpful_count();
