import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Trophy } from "lucide-react";
import { fetchLeaderboard, fetchTopReaders } from "@/lib/community";
import { cn, getLangAttr } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Top Urdu Novels — Most Recommended by Readers | Readers' Suggestion Library" },
      {
        name: "description",
        content:
          "See the most-recommended Urdu novels ranked by the readers' community. Explore all-time favourites, trending picks this month, and this week's top Urdu fiction choices.",
      },
      { property: "og:title", content: "Top Urdu Novels — Most Recommended by Readers" },
      {
        property: "og:description",
        content: "The most-recommended Urdu novels ranked by readers. Discover all-time favourites and trending Urdu fiction picks.",
      },
      { property: "og:url", content: "https://readers.urdunovelbanks.com/leaderboard" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Top Urdu Novels — Most Recommended by Readers" },
      { name: "twitter:description", content: "The most-recommended Urdu novels ranked by the community. Discover all-time favourites and trending picks." },
    ],
    links: [
      { rel: "canonical", href: "https://readers.urdunovelbanks.com/leaderboard" },
    ],
  }),
  component: Leaderboard,
});

const periods = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "week", label: "This week" },
] as const;

const views = [
  { key: "novels", label: "Top Novels" },
  { key: "readers", label: "Top 20 Readers" },
] as const;

const medals = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const [view, setView] = useState<"novels" | "readers">("novels");
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");
  const chart = useInfiniteQuery({
    queryKey: ["leaderboard", period],
    queryFn: ({ pageParam }) => fetchLeaderboard(period, 30, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === 30 ? allPages.length * 30 : undefined,
    placeholderData: keepPreviousData,
    enabled: view === "novels",
  });

  const readersQuery = useQuery({
    queryKey: ["top-readers", period],
    queryFn: () => fetchTopReaders(period, 20),
    enabled: view === "readers",
  });

  const allItems = chart.data?.pages.flat() ?? [];

  const rankedReaders = useMemo(() => {
    let currentRank = 0;
    let currentScore = -1;
    return (readersQuery.data ?? []).map((reader) => {
      if (reader.approved_count !== currentScore) {
        currentRank += 1;
        currentScore = reader.approved_count;
      }
      return { ...reader, rank: currentRank };
    });
  }, [readersQuery.data]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="paper rounded-3xl border border-border px-6 py-10 text-center">
        <Trophy className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
        <h1 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">Readers' Choice</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {view === "novels"
            ? "Novels ranked by how many readers found their recommendations helpful."
            : "The most active readers who have contributed approved recommendations."}
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {views.map((option) => (
              <button
                key={option.key}
                onClick={() => setView(option.key)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  view === option.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {periods.map((option) => (
              <button
                key={option.key}
                onClick={() => setPeriod(option.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs transition-colors",
                  period === option.key
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 className="sr-only">Top novel rankings</h2>

      <div className="mt-8 space-y-3">
        {view === "novels" ? (
          chart.isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Counting votes…</p>
          ) : allItems.length > 0 ? (
            <>
              <div className={cn("space-y-3 transition-opacity duration-300", chart.isPlaceholderData && "opacity-50 pointer-events-none")}>
                {allItems.map((row, index) => (
                  <div
                    key={row.novel_id}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border bg-card px-5 py-4",
                      index < 3 ? "border-gold/60 shadow-sm" : "border-border",
                    )}
                  >
                    <span className="w-9 text-center text-xl">
                      {medals[index] ?? (
                        <span className="font-serif text-base text-muted-foreground">{index + 1}</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-serif text-lg leading-snug font-semibold break-words"
                        dir="auto"
                        lang={getLangAttr(row.title)}
                      >
                        {row.title}
                      </h3>
                      {row.author_name ? (
                        <p
                          className="text-sm text-muted-foreground break-words"
                          dir="auto"
                          lang={getLangAttr(row.author_name)}
                        >
                          by {row.author_name}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{row.helpful_total} 👍</p>
                      <p className="text-muted-foreground">
                        {row.recommendation_count}{" "}
                        {row.recommendation_count === 1 ? "recommendation" : "recommendations"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {chart.hasNextPage && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => chart.fetchNextPage()}
                    disabled={chart.isFetchingNextPage}
                    className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
                  >
                    {chart.isFetchingNextPage ? "Loading more..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
              <p className="font-serif text-lg">No novels on the chart for this period yet.</p>
              <Link
                to="/submit"
                className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Recommend a Novel
              </Link>
            </div>
          )
        ) : (
          readersQuery.isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading top readers…</p>
          ) : rankedReaders.length > 0 ? (
            <div className="space-y-3">
              {rankedReaders.map((reader) => {
                const rankIndex = reader.rank - 1;
                return (
                  <div
                    key={reader.reader_id}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border bg-card px-5 py-4",
                      rankIndex < 3 ? "border-gold/60 shadow-sm" : "border-border",
                    )}
                  >
                    <span className="w-9 text-center text-xl">
                      {medals[rankIndex] ?? (
                        <span className="font-serif text-base text-muted-foreground">{reader.rank}</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                    <Link
                      to="/reader/$readerId"
                      params={{ readerId: reader.reader_id }}
                      className="font-serif text-lg leading-snug font-semibold break-words hover:underline hover:text-primary transition-colors"
                    >
                      {reader.reader_name}
                    </Link>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold text-primary">
                      {reader.approved_count}{" "}
                      {reader.approved_count === 1 ? "Recommendation" : "Recommendations"}
                    </p>
                  </div>
                </div>
              );
            })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
              <p className="font-serif text-lg">No active readers found yet.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
