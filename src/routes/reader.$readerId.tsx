import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchReaderProfile, getVotedIds, toggleVoteHelpful } from "@/lib/community";
import { RecommendationCard } from "@/components/RecommendationCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reader/$readerId")({
  component: ReaderProfile,
});

function ReaderProfile() {
  const { readerId } = Route.useParams();
  const [voted, setVoted] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => setVoted(getVotedIds()), []);

  const profileQuery = useQuery({
    queryKey: ["reader-profile", readerId],
    queryFn: () => fetchReaderProfile(readerId),
  });

  const { readerName, recommendations = [] } = profileQuery.data ?? {};

  // Update page title dynamically
  useEffect(() => {
    if (readerName) {
      document.title = `Recommendations by ${readerName} | Readers' Suggestion Library`;
    }
  }, [readerName]);

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
      queryClient.setQueriesData({ queryKey: ["reader-profile", readerId] }, (oldData: any) => {
        if (!oldData || !oldData.recommendations) return oldData;
        return {
          ...oldData,
          recommendations: oldData.recommendations.map((item: any) =>
            item.id === id ? { ...item, helpful_count: newCount } : item
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
      <div className="mb-8">
        <Link to="/leaderboard" className="text-sm text-primary hover:underline mb-4 inline-block">
          &larr; Back to Top Readers
        </Link>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl flex items-center gap-2 flex-wrap">
          {profileQuery.isLoading ? "Loading..." : `Recommendations by ${readerName}`}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Novels suggested and reviewed by this reader.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {profileQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading recommendations…</p>
        ) : profileQuery.isError ? (
          <p className="text-sm text-destructive">Could not load reader profile.</p>
        ) : recommendations.length > 0 ? (
          <div className="grid gap-4">
            {recommendations.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                voted={voted.includes(item.id)}
                onVote={handleVote}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <p className="font-serif text-lg">This reader hasn't made any public recommendations yet.</p>
            <Link
              to="/browse"
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Browse other novels
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
