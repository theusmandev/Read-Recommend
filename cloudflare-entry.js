import server from './dist/server/server.js';

export default {
  // Pass through normal HTTP requests to the TanStack Start server
  fetch: server.fetch,
  
  // Handle Cloudflare Cron Triggers
  async scheduled(event, env, ctx) {
    console.log("Cron trigger invoked: Keeping Supabase alive");
    
    // Cloudflare binds environment variables to the `env` object
    const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const endpoint = `${supabaseUrl}/rest/v1/novels?select=id&limit=1`;
      
      const req = new Request(endpoint, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      // Use ctx.waitUntil so the worker doesn't terminate before the fetch completes
      ctx.waitUntil(
        fetch(req)
          .then(res => {
            if (!res.ok) {
              console.error("Supabase keep-alive failed with status:", res.status);
            } else {
              console.log("Supabase keep-alive successful");
            }
          })
          .catch(err => {
            console.error("Supabase keep-alive error:", err);
          })
      );
    } else {
      console.warn("Supabase credentials not found in env vars for cron keep-alive");
    }
  }
};
