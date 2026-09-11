import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { fetchLeaderboard } from "@/lib/community";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Readers' Choice — Top Urdu Novels | Urdu Novel Bank" },
      {
        name: "description",
        content:
          "The most-recommended Urdu novels chosen by the community, ranked for all time, this month and this week.",
      },
      { property: "og:title", content: "Readers' Choice — Top Urdu Novels" },
      {
        property: "og:description",
        content: "See which Urdu novels the community recommends most.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Leaderboard,
});

const periods = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "week", label: "This week" },
] as const;

const medals = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");
  const chart = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => fetchLeaderboard(period),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="paper rounded-3xl border border-border px-6 py-10 text-center">
        <Trophy className="mx-auto h-8 w-8 text-gold" />
        <h1 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">Readers' Choice</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Novels ranked by how many readers found their recommendations helpful.
        </p>
        <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
          {periods.map((option) => (
            <button
              key={option.key}
              onClick={() => setPeriod(option.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                period === option.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {chart.isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Counting votes…</p>
        ) : chart.data && chart.data.length > 0 ? (
          chart.data.map((row, index) => (
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
                <p className="font-serif text-lg leading-snug font-semibold break-words" dir="auto">{row.title}</p>
                {row.author_name ? (
                  <p className="text-sm text-muted-foreground break-words" dir="auto">by {row.author_name}</p>
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
          ))
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
        )}
      </div>
    </div>
  );
}
