# Readers' Suggestion Library

A community-driven platform where Urdu novel readers can share and discover books that actually stayed with them. Not reviews, not ratings — just honest recommendations from people who read them and wanted others to know.

The site lives at **[readers.urdunovelbanks.com](https://readers.urdunovelbanks.com/)** and is a sister project to [Urdu Novel Bank](https://www.urdunovelbanks.com/) and [Urdu Fiction Bank](https://urdufictionbank.com/).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR React framework) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Data fetching | TanStack Query (React Query v5) |
| Database & Auth | Supabase (Postgres + Supabase Auth) |
| Build tool | Vite 8 |
| Deployment | Cloudflare Workers (with static assets) |

Fonts in use: Lora (serif body), Mulish (sans-serif UI), Gulzar + Noto Naskh Arabic (Urdu text rendering).

---

## Features

### Public-facing

- **Recommendation feed** — The main browse page shows all approved recommendations, sortable by newest or most helpful, and filterable by genre (Social, Romance, Mystery, Historical, Islamic/Spiritual, and more). Each card shows the novel title, author, the reader's genre tag, and the personal reason they loved it.

- **Infinite scroll / pagination** — The feed loads 30 items at a time with a "Load more" button, keeping the initial load fast.

- **Helpful votes** — Readers can mark any recommendation as helpful. Votes are tracked per-browser (via a stable fingerprint stored in localStorage), and the toggle is backed by an atomic `SECURITY DEFINER` Postgres function (`toggle_helpful_vote`) to prevent race conditions — no double-votes, no negative counts.

- **Submit a recommendation** — A multi-step form where readers enter their name, email, the novel title, author, genre, and a personal reason. On submission, the form does a fuzzy title search against existing novels first, so the same novel doesn't get created twice under slightly different spellings. Reader identity is stored securely via an `upsert_reader` RPC — email addresses are never exposed to the client.

- **Readers' Choice leaderboard** — A ranked list of top novels by total helpful votes, filterable by time period (all time / this month / this week). Uses dense ranking so ties are handled gracefully. A separate "Top Readers" tab ranks contributors by their approved recommendation count.

- **My Recommendations** — Readers can look up their own submissions using their name and email. This shows all their recommendations across every status (pending review, approved, not approved), with the ability to delete any of their own entries.

- **Public reader profiles** — Each reader has a shareable profile page at `/reader/:id` listing their approved recommendations.

### Admin

- **Moderation panel** — A password-protected admin panel (Supabase Auth + an `admins` table) for reviewing pending submissions. Admins can approve or reject recommendations one by one. The panel is accessible only to authenticated users whose email is in the `admins` table.

### Infrastructure

- **Cloudflare Cron Trigger** — A scheduled Cloudflare Worker runs every day at 3 AM UTC, making a lightweight read against Supabase to prevent the free-tier database from auto-pausing due to inactivity (Supabase pauses free projects after 7 days without activity).

- **SEO** — Each page has its own `<title>`, meta description, Open Graph tags, and canonical URL. The browse page includes JSON-LD structured data (`ItemList` + `Book` schema). A `sitemap.xml` and `robots.txt` are included in `/public`.

---

## Local Development

You'll need Node.js (v18+) and npm. There's no Bun dependency in this project.

```sh
git clone <repository-url>
cd <repository-name>
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Environment Variables

Create a `.env` file at the project root with the following variables. Get the values from your Supabase project dashboard:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_URL=https://<project-ref>.supabase.co

VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>

VITE_SUPABASE_PROJECT_ID=<project-ref>
SUPABASE_PROJECT_ID=<project-ref>

# Server-only — never expose this to the client / never prefix with VITE_
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Note:** `VITE_`-prefixed variables are inlined into the client bundle at build time by Vite. Non-prefixed versions are available only server-side. Both are needed because this is an SSR app.

---

## Supabase Setup

Database migrations live in `supabase/migrations/`. They are plain SQL files and are applied **manually** via the Supabase SQL Editor — we don't use the Supabase CLI or any auto-migration pipeline.

To apply a migration: open your Supabase project dashboard → **SQL Editor** → paste the contents of the migration file → run it.

Migrations are numbered chronologically and should be applied in order if setting up from scratch.

Key RPCs defined in migrations:

| Function | Purpose |
|---|---|
| `upsert_reader` | Securely creates or retrieves a reader record by name + email |
| `toggle_helpful_vote` | Atomic vote toggle with race-condition protection |
| `leaderboard` | Paginated top novels by helpful votes, supports time periods |
| `get_top_readers` | Ranked readers by approved recommendation count |
| `search_novels` | Fuzzy title search used during submission |
| `get_genre_counts` | Efficient per-genre approved recommendation counts |
| `get_total_reader_count` | Count of distinct readers with at least one approved recommendation |
| `get_my_recommendations` | Reader's own submissions (all statuses) |
| `delete_my_recommendation` | Lets a reader delete their own submission |

All public-facing RPCs are `SECURITY DEFINER` and have explicit `GRANT EXECUTE` to `anon` / `authenticated` roles as appropriate.

---

## Deployment

The app is deployed as a **Cloudflare Worker** (not Pages). The build outputs to `dist/server/` (SSR) and `dist/client/` (static assets).

```sh
npm run build
```

Deployment is triggered automatically by pushing to `main` via Cloudflare's Git integration.

### Wrangler Configuration

[`wrangler.toml`](./wrangler.toml) configures the Worker. The entry point is [`cloudflare-entry.js`](./cloudflare-entry.js) — a thin wrapper around the TanStack Start server output that also exports a `scheduled` handler for the cron trigger.

```toml
name = "read-recommend"
main = "cloudflare-entry.js"
compatibility_date = "2026-09-11"
compatibility_flags = ["nodejs_compat"]

[triggers]
crons = ["0 3 * * *"]   # 3 AM UTC daily — keeps Supabase alive

[assets]
directory = "dist/client"
```

### Cron Trigger (Supabase Keep-Alive)

The `scheduled` export in `cloudflare-entry.js` fires daily and makes a cheap `GET /rest/v1/novels?select=id&limit=1` request to Supabase using the publishable key. This registers as activity and prevents the free-tier database from auto-pausing.

**Important:** Cloudflare's Git integration deploys Worker code but may not automatically register cron trigger metadata from `wrangler.toml` on the first push. If the cron doesn't appear in **Workers & Pages → your Worker → Settings → Triggers**, run this once from your local machine to sync it:

```sh
npx wrangler deploy
```

After that initial sync, subsequent Git pushes will keep the cron active.

### Environment Variables on Cloudflare

Set these in the Cloudflare dashboard under **Workers & Pages → your Worker → Settings → Variables and Secrets** (not in `wrangler.toml`):

- `VITE_SUPABASE_URL`
- `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_SERVICE_ROLE_KEY` *(mark as secret)*

---

## Project Structure

```
src/
  routes/           # TanStack Start file-based routes
    index.tsx       # Homepage hero + feed preview + leaderboard preview
    browse.tsx      # Full recommendation feed with filters
    submit.tsx      # Recommendation submission form
    leaderboard.tsx # Top novels + top readers
    my-recommendations.tsx
    reader.$readerId.tsx
    admin.tsx       # Moderation panel
    __root.tsx      # Root layout (header, footer, providers)
  components/       # Shared UI components
  lib/
    community.ts    # All Supabase data-fetching helpers
    utils.ts        # cn(), formatLargeNumber(), getLangAttr(), etc.
  hooks/            # Custom hooks (useCountUp, etc.)
  integrations/
    supabase/       # Supabase client setup
supabase/
  migrations/       # SQL migration files (applied manually via SQL Editor)
public/
  sitemap.xml
  robots.txt
  site.webmanifest
cloudflare-entry.js  # Cloudflare Worker entry + scheduled cron handler
wrangler.toml
```

---

*Kitaabein dost hoti hain — books are friends.*
