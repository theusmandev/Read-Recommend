import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PenLine, Sparkles, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchFeed, fetchLeaderboard, fetchAllGenreCounts, getVotedIds, fetchTotalReaderCount } from "@/lib/community";
import { formatLargeNumber, getLangAttr } from "@/lib/utils";
import { RecommendationCard } from "@/components/RecommendationCard";
import { useCountUp } from "@/hooks/use-count-up";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Best Urdu Novel Recommendations by Readers | Readers' Suggestion Library" },
      {
        name: "description",
        content:
          "Discover the best Urdu novels recommended by real readers. Browse community-driven Urdu fiction suggestions, share your favourites, and find your next great read.",
      },
      { property: "og:title", content: "Best Urdu Novel Recommendations by Readers | Readers' Suggestion Library" },
      {
        property: "og:description",
        content: "Discover the best Urdu novels recommended by real readers. Browse community-driven Urdu fiction suggestions and find your next great read.",
      },
      { property: "og:url", content: "https://readers.urdunovelbanks.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Best Urdu Novel Recommendations by Readers" },
      { name: "twitter:description", content: "A readers' community for discovering and recommending the best Urdu fiction." },
    ],
    links: [
      { rel: "canonical", href: "https://readers.urdunovelbanks.com/" },
    ],
  }),
  component: Home,
});

function Home() {
  const [voted, setVoted] = useState<string[]>([]);
  
  useEffect(() => {
    setVoted(getVotedIds());
  }, []);

  const top = useQuery({
    queryKey: ["feed", "helpful", "All", 3],
    queryFn: () => fetchFeed({ sort: "helpful", genre: "All", limit: 3 }),
  });
  const leaders = useQuery({
    queryKey: ["leaderboard", "all", "home"],
    queryFn: () => fetchLeaderboard("all"),
  });
  const countsQuery = useQuery({
    queryKey: ["feed-counts"],
    queryFn: fetchAllGenreCounts,
  });
  const totalCount = countsQuery.data?.["All"] ?? 0;
  const animatedTotalCount = useCountUp(totalCount, 1500);

  const readersQuery = useQuery({
    queryKey: ["total-readers"],
    queryFn: fetchTotalReaderCount,
  });
  const totalReaders = readersQuery.data ?? 0;
  const animatedReadersCount = useCountUp(totalReaders, 1500);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-4">
      <section className="paper mt-6 rounded-3xl border border-border px-6 py-8 text-center sm:py-12">
        {totalCount > 0 ? (
          <div className="mx-auto mb-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative inline-flex items-start">
                <span className="font-serif text-5xl font-bold leading-none tracking-tight text-primary sm:text-6xl">
                  {formatLargeNumber(animatedTotalCount)}+
                </span>
                <Sparkles className="absolute -right-6 -top-2 h-5 w-5 text-primary/50 sm:-right-8 sm:-top-3 sm:h-6 sm:w-6" aria-hidden="true" />
              </div>
              <span className="mt-3 font-serif text-sm font-medium tracking-wide text-muted-foreground sm:text-base">
                Novels recommended
              </span>
            </div>
            
            <div className="hidden h-16 w-px bg-border sm:block" />
            <div className="h-px w-16 bg-border sm:hidden" />
            
            <div className="flex flex-col items-center justify-center">
              <div className="relative inline-flex items-start">
                <span className="font-serif text-5xl font-bold leading-none tracking-tight text-primary sm:text-6xl">
                  {formatLargeNumber(animatedReadersCount)}+
                </span>
              </div>
              <span className="mt-3 font-serif text-sm font-medium tracking-wide text-muted-foreground sm:text-base">
                Contributing readers
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto mb-5 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary/60" aria-hidden="true" />
            <span className="font-serif text-base text-muted-foreground">
              A reading circle built by readers
            </span>
          </div>
        )}
        <h1 className="font-serif text-4xl leading-tight font-bold text-foreground sm:text-5xl">
          Read what readers actually loved.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
          Discover the novels that stayed with people, see why they loved them, and share your own favourite.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PenLine className="h-4 w-4" aria-hidden="true" /> Recommend a Novel
          </Link>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            See Recommendations
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
            <Trophy className="h-5 w-5 text-gold" aria-hidden="true" /> Readers' Choice
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
                <span
                  className="block font-medium break-words"
                  dir="auto"
                  lang={getLangAttr(row.title)}
                >
                  {row.title}
                </span>
                <span
                  className="block text-sm text-muted-foreground break-words"
                  dir="auto"
                  lang={getLangAttr(row.author_name)}
                >
                  {row.author_name}
                </span>
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
