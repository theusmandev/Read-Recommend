CREATE TABLE public.readers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT readers_name_check CHECK (char_length(trim(name)) > 0),
  CONSTRAINT readers_email_check CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

ALTER TABLE public.readers ENABLE ROW LEVEL SECURITY;

-- Allow insert/update but NOT select, to keep emails private.
CREATE POLICY "Anyone can insert reader" 
  ON public.readers 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Anyone can update reader" 
  ON public.readers 
  FOR UPDATE 
  TO anon, authenticated 
  USING (true);

-- Add the column to recommendations
ALTER TABLE public.recommendations ADD COLUMN reader_id UUID REFERENCES public.readers(id);

-- Create secure RPC for upserting and returning ID safely
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
BEGIN
  v_clean_name := trim(p_name);
  v_clean_email := lower(trim(p_email));

  IF char_length(v_clean_name) = 0 THEN
    RAISE EXCEPTION 'Name cannot be empty';
  END IF;

  IF v_clean_email !~ '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  INSERT INTO public.readers (name, email)
  VALUES (v_clean_name, v_clean_email)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_reader_id;
  
  RETURN v_reader_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_reader(TEXT, TEXT) TO anon, authenticated;
