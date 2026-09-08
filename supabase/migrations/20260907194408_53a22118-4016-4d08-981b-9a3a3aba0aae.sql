ALTER FUNCTION public.leaderboard(TEXT) SECURITY INVOKER;
ALTER FUNCTION public.search_novels(TEXT) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.sync_helpful_count() FROM PUBLIC, anon, authenticated;