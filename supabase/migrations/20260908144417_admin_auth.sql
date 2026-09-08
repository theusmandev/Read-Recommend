CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can only read their own row. No one can insert/update via API.
CREATE POLICY "Admins can view own record" 
  ON public.admins 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Give authenticated users permission to update ONLY the status column of recommendations
GRANT UPDATE (status) ON public.recommendations TO authenticated;

-- RLS Policy: Admins can update recommendations
CREATE POLICY "Admins can update recommendations" 
  ON public.recommendations 
  FOR UPDATE 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- RLS Policy: Admins can read all recommendations
CREATE POLICY "Admins can read all recommendations" 
  ON public.recommendations 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
