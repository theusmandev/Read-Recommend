import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PenLine, Sparkles, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchFeed, fetchLeaderboard, getVotedIds } from "@/lib/community";
import { RecommendationCard } from "@/components/RecommendationCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Urdu Novel Bank — Readers Recommend Urdu Novels" },
      {
        name: "description",
        content:
          "Discover the novels that stayed with people, see why they loved them, and share your own favourite.",
      },
      { property: "og:title", content: "Urdu Novel Bank — Readers Recommend Urdu Novels" },
      {
        property: "og:description",
        content: "Discover the novels that stayed with people, see why they loved them, and share your own favourite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [voted, setVoted] = useState<string[]>([]);
  
  useEffect(() => setVoted(getVotedIds()), []);

  const top = useQuery({
    queryKey: ["feed", "helpful", "All", 3],
    queryFn: () => fetchFeed({ sort: "helpful", genre: "All", limit: 3 }),
  });
  const leaders = useQuery({
    queryKey: ["leaderboard", "all", "home"],
    queryFn: () => fetchLeaderboard("all"),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-4">
      <section className="paper mt-6 rounded-3xl border border-border px-6 py-12 text-center sm:py-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> A reading circle built by readers
        </p>
        <h1 className="mt-5 font-serif text-4xl leading-tight font-bold text-foreground sm:text-5xl">
          Read what readers actually loved.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Discover the novels that stayed with people, see why they loved them, and share your own favourite.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PenLine className="h-4 w-4" /> Recommend a Novel
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Browse recommendations
          </Link>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold">Most helpful right now</h2>
          <Link to="/browse" className="text-sm text-muted-foreground underline underline-offset-4">
            See all
          </Link>
        </div>
        <div className="mt-4 grid gap-4">
          {top.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading recommendations…</p>
          ) : top.data && top.data.length > 0 ? (
            top.data.map((item) => <RecommendationCard key={item.id} item={item} voted={voted.includes(item.id)} />)
          ) : (
            <EmptyShelf />
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Trophy className="h-5 w-5 text-gold" /> Readers' Choice
          </h2>
          <Link
            to="/leaderboard"
            className="text-sm text-muted-foreground underline underline-offset-4"
          >
            Full chart
          </Link>
        </div>
        <ol className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {(leaders.data ?? []).slice(0, 5).map((row, index) => (
            <li key={row.novel_id} className="flex items-center gap-4 px-5 py-3">
              <span className="w-6 shrink-0 text-center font-serif text-lg font-bold text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium truncate">{row.title}</span>
                <span className="block text-sm text-muted-foreground truncate">{row.author_name}</span>
              </span>
              <span className="shrink-0 text-sm text-muted-foreground">{row.helpful_total} 👍</span>
            </li>
          ))}
          {(leaders.data ?? []).length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">
              The chart fills up as readers start recommending.
            </li>
          ) : null}
        </ol>
      </section>
    </div>
  );
}

function EmptyShelf() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <p className="font-serif text-lg">No recommendations yet — be the first!</p>
      <Link
        to="/submit"
        className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Recommend a Novel
      </Link>
    </div>
  );
}
