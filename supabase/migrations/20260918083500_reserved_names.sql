-- Update upsert_reader to prevent normal users from using reserved names like "admin"

CREATE OR REPLACE FUNCTION public.upsert_reader(p_name TEXT, p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reader_id UUID;
  v_clean_name TEXT;
  v_clean_email TEXT;
  v_is_admin BOOLEAN;
BEGIN
  v_clean_name := trim(p_name);
  v_clean_email := lower(trim(p_email));

  IF char_length(v_clean_name) = 0 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  IF v_clean_email !~ '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Check if the requested name is reserved
  IF lower(v_clean_name) IN ('admin', 'administrator', 'moderator') THEN
    -- Verify if the provided email matches an existing admin's email
    SELECT EXISTS (
      SELECT 1 FROM public.admins a
      JOIN auth.users u ON u.id = a.user_id
      WHERE lower(u.email) = v_clean_email
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'This name is reserved.';
    END IF;
  END IF;

  INSERT INTO public.readers (name, email)
  VALUES (v_clean_name, v_clean_email)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_reader_id;
  
  RETURN v_reader_id;
END;
$$;
