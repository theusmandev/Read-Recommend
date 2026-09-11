-- The previous migration created a new overloaded function with 3 parameters
-- but didn't grant execute permissions on it, so anon/authenticated users couldn't call it.
-- It also left the old 1-parameter function dangling.

-- 1. Grant execute on the new 3-parameter function
GRANT EXECUTE ON FUNCTION public.leaderboard(TEXT, INT, INT) TO anon, authenticated, service_role;

-- 2. Drop the old 1-parameter function to avoid ambiguity
DROP FUNCTION IF EXISTS public.leaderboard(TEXT);
