import { ThumbsUp } from "lucide-react";
import type { FeedItem } from "@/lib/community";
import { cn } from "@/lib/utils";

export function RecommendationCard({
  item,
  voted,
  onVote,
}: {
  item: FeedItem;
  voted: boolean;
  onVote?: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_0_var(--color-border)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg leading-snug font-semibold text-foreground break-words" dir="auto">
            {item.novels?.title}
          </h3>
          {item.novels?.author_name ? (
            <p className="mt-0.5 text-sm text-muted-foreground break-words" dir="auto">by {item.novels.author_name}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {item.genre}
        </span>
      </div>

      <p className="mt-3 text-[0.975rem] leading-relaxed text-foreground/90">{item.reason}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">
          — {item.reader_name?.trim() ? item.reader_name : "A reader"}
        </span>
        <button
          type="button"
          disabled={!onVote}
          onClick={() => onVote?.(item.id)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
            voted
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border hover:border-primary/40 hover:bg-secondary",
            !onVote && "cursor-default",
          )}
          aria-label="Mark this recommendation as helpful"
        >
          <ThumbsUp className="h-4 w-4" />
          {item.helpful_count} found this helpful
        </button>
      </div>
    </article>
  );
}
