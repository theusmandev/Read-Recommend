import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GENRES, fetchFeed, getVotedIds, toggleVoteHelpful, type SortKey } from "@/lib/community";
import { RecommendationCard } from "@/components/RecommendationCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Urdu Novel Recommendations | Urdu Novel Bank" },
      {
        name: "description",
        content:
          "Read every approved recommendation from the community — filter by genre, sort by newest or most helpful.",
      },
      { property: "og:title", content: "Browse Urdu Novel Recommendations" },
      {
        property: "og:description",
        content: "Filter Urdu novel recommendations by genre and find your next read.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Browse,
});

const genreOptions = ["All", ...GENRES] as const;

function Browse() {
  const [sort, setSort] = useState<SortKey>("newest");
  const [genre, setGenre] = useState<string>("All");
  const [voted, setVoted] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => setVoted(getVotedIds()), []);

  const feed = useInfiniteQuery({
    queryKey: ["feed", sort, genre],
    queryFn: ({ pageParam }) => fetchFeed({ sort, genre, limit: 30, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === 30 ? allPages.length * 30 : undefined,
    placeholderData: keepPreviousData,
  });

  const allItems = feed.data?.pages.flat() ?? [];

  async function handleVote(id: string) {
    try {
      const { isVoted, newCount } = await toggleVoteHelpful(id);
      
      // Update local React state for the immediate visual toggle
      if (isVoted) {
        setVoted((prev) => [...prev, id]);
        toast.success("Shukriya! Marked as helpful.");
      } else {
        setVoted((prev) => prev.filter((v) => v !== id));
        toast.success("Vote removed.");
      }

      // Update React Query cache directly with the exact server response
      queryClient.setQueriesData({ queryKey: ["feed"] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any[]) =>
            page.map((item: any) =>
              item.id === id ? { ...item, helpful_count: newCount } : item
            )
          ),
        };
      });

      // Background refresh to keep leaderboards synced
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    } catch {
      toast.error("Could not record your vote. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">All recommendations</h1>
      <p className="mt-2 text-muted-foreground">
        Every novel below was suggested by a reader in the community.
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["newest", "helpful"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                sort === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              {key === "newest" ? "Newest" : "Most helpful"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {genreOptions.map((option) => (
            <button
              key={option}
              onClick={() => setGenre(option)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                genre === option
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {feed.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading recommendations…</p>
        ) : feed.isError ? (
          <p className="text-sm text-destructive">Could not load recommendations right now.</p>
        ) : allItems.length > 0 ? (
          <>
            <div className={cn("grid gap-4 transition-opacity duration-300", feed.isPlaceholderData && "opacity-50 pointer-events-none")}>
              {allItems.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  voted={voted.includes(item.id)}
                  onVote={handleVote}
                />
              ))}
            </div>
            
            {feed.hasNextPage && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => feed.fetchNextPage()}
                  disabled={feed.isFetchingNextPage}
                  className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {feed.isFetchingNextPage ? "Loading more..." : "Load more"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <p className="font-serif text-lg">No recommendations here yet — be the first!</p>
            <Link
              to="/submit"
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Recommend a Novel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
