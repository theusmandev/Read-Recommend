import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function RecommendationCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_0_var(--color-border)]",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Novel title bar */}
          <Skeleton className="h-5 w-7/12 rounded-md" />
          {/* Author subtitle */}
          <Skeleton className="h-4 w-4/12 rounded-md" />
        </div>
        <div className="shrink-0">
          {/* Genre badge pill */}
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Reason lines (2-3 lines of text) */}
      <div className="mt-3.5 space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-11/12 rounded-md" />
        <Skeleton className="h-4 w-8/12 rounded-md" />
      </div>

      {/* Footer: reader name and vote button pill */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
    </article>
  );
}

export function RecommendationCardSkeletonGrid({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-4", className)}
      aria-busy="true"
      aria-label="Loading recommendations"
    >
      {Array.from({ length: count }).map((_, i) => (
        <RecommendationCardSkeleton key={i} />
      ))}
    </div>
  );
}
