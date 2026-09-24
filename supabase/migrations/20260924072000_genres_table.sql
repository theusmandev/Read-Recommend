-- 1. Create table
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Genres are viewable by everyone" ON public.genres
  FOR SELECT USING (true);
-- Mutations will be handled via SECURITY DEFINER RPCs

-- 3. Insert initial data
INSERT INTO public.genres (name, display_order) VALUES
('Romance', 10),
('Social', 20),
('Mystery', 30),
('Historical', 40),
('Fantasy', 50),
('Islamic/Spiritual', 60),
('Family Drama', 70),
('Crime/Thriller', 80),
('Tragedy', 90),
('Comedy/Humor', 100),
('Adventure', 110),
('Classic', 120),
('Self Help', 130),
('War/Military', 140),
('Sci-Fi', 150),
('Horror/Supernatural', 160),
('Jasoosi/Detective', 170),
('Other', 999);

-- 4. Alter recommendations table
ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_genre_check;

ALTER TABLE public.recommendations ADD COLUMN genre_id UUID REFERENCES public.genres(id);

-- 5. Migrate data
UPDATE public.recommendations r
SET genre_id = g.id
FROM public.genres g
WHERE r.genre = g.name;

UPDATE public.recommendations r
SET genre_id = (SELECT id FROM public.genres WHERE name = 'Other')
WHERE genre_id IS NULL;

-- 6. RPCs for Admin
CREATE OR REPLACE FUNCTION public.add_genre(p_name TEXT, p_display_order INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_id UUID;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.genres (name, display_order)
  VALUES (p_name, p_display_order)
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_genre(p_id UUID, p_name TEXT, p_display_order INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.genres
  SET name = p_name, display_order = p_display_order
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_genre(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_other_id UUID;
  v_genre_name TEXT;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()) INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT name INTO v_genre_name FROM public.genres WHERE id = p_id;
  IF v_genre_name = 'Other' THEN
    RAISE EXCEPTION 'Cannot delete the "Other" genre';
  END IF;

  SELECT id INTO v_other_id FROM public.genres WHERE name = 'Other';

  UPDATE public.recommendations
  SET genre_id = v_other_id, genre = 'Other'
  WHERE genre_id = p_id;

  DELETE FROM public.genres WHERE id = p_id;
END;
$$;

-- 7. Grant RPCs
GRANT EXECUTE ON FUNCTION public.add_genre(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_genre(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_genre(UUID) TO authenticated;

-- 8. Fix existing RPCs to use genre_id instead of just genre
CREATE OR REPLACE FUNCTION public.get_genre_counts()
RETURNS TABLE (genre_id UUID, genre text, count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id as genre_id, g.name as genre, count(r.id)
  FROM public.genres g
  LEFT JOIN public.recommendations r ON r.genre_id = g.id AND r.status = 'approved'
  GROUP BY g.id, g.name
  ORDER BY g.display_order;
$$;

GRANT EXECUTE ON FUNCTION public.get_genre_counts() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.update_and_resubmit_recommendation(
  p_recommendation_id UUID, 
  p_reader_id UUID, 
  p_reason TEXT, 
  p_genre_id UUID,
  p_genre TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  -- Verify the recommendation exists and belongs to the reader
  SELECT status INTO v_status
  FROM public.recommendations
  WHERE id = p_recommendation_id AND reader_id = p_reader_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recommendation not found or you do not have permission to edit it';
  END IF;

  -- Ensure only rejected recommendations can be edited
  IF v_status != 'rejected' THEN
    RAISE EXCEPTION 'Only rejected recommendations can be edited and resubmitted';
  END IF;

  -- Update and reset status to pending
  UPDATE public.recommendations
  SET 
    reason = p_reason,
    genre_id = p_genre_id,
    genre = p_genre,
    status = 'pending',
    rejection_reason = NULL
  WHERE id = p_recommendation_id AND reader_id = p_reader_id;
END;
$$;
