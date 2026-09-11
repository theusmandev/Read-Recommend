import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderation | Urdu Novel Bank" },
      { name: "description", content: "Private moderation page for the Urdu Novel Bank admin." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Moderation | Urdu Novel Bank" },
      { property: "og:description", content: "Private moderation page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();

  // Check authentication & admin status
  const status = useQuery({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { unlocked: false };

      // Verify they are actually an admin
      const { data: adminRow, error } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error || !adminRow) {
        await supabase.auth.signOut();
        toast.error("This account does not have admin access.");
        return { unlocked: false };
      }

      return { unlocked: true };
    },
  });

  const unlocked = status.data?.unlocked === true;

  const pending = useQuery({
    queryKey: ["admin-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("id, reader_name, reason, genre, created_at, novels(title, author_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;

      return (data ?? []).map((row) => {
        const novel = row.novels as unknown as { title: string; author_name: string } | null;
        return {
          id: row.id,
          reader_name: row.reader_name,
          reason: row.reason,
          genre: row.genre,
          created_at: row.created_at,
          novel_title: novel?.title ?? "Unknown novel",
          novel_author: novel?.author_name ?? "",
        };
      });
    },
    enabled: unlocked,
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("recommendations")
        .update({ status: action })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      toast.success(action === "approved" ? "Approved and published." : "Rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: () => {
      toast.error("Action failed. Check your connection or permissions.");
    },
  });

  if (status.isLoading) {
    return <p className="px-4 py-16 text-center text-sm text-muted-foreground">Checking access…</p>;
  }

  if (!unlocked) {
    return <AdminLogin onUnlocked={() => queryClient.invalidateQueries({ queryKey: ["admin-status"] })} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">Pending recommendations</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            await queryClient.invalidateQueries();
          }}
          className="rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:bg-secondary"
        >
          Logout
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {pending.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading queue…</p>
        ) : pending.data && pending.data.length > 0 ? (
          pending.data.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-lg leading-snug font-semibold break-words" dir="auto">{item.novel_title}</h2>
                  {item.novel_author ? (
                    <p className="mt-0.5 text-sm text-muted-foreground break-words" dir="auto">by {item.novel_author}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                  {item.genre}
                </span>
              </div>
              <p className="mt-3 leading-relaxed break-words" dir="auto">{item.reason}</p>
              <p className="mt-2 text-sm text-muted-foreground break-words" dir="auto">
                — {item.reader_name?.trim() ? item.reader_name : "A reader"}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => moderateMutation.mutate({ id: item.id, action: "approved" })}
                  disabled={moderateMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 sm:py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  onClick={() => moderateMutation.mutate({ id: item.id, action: "rejected" })}
                  disabled={moderateMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-3 sm:py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center text-muted-foreground">
            Nothing waiting for review right now.
          </p>
        )}
      </div>
    </div>
  );
}

function AdminLogin({ onUnlocked }: { onUnlocked: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        // We defer the admin role check to the query in the Admin component.
        // Once unlocked, the main component will fetch status and verify admin.
        onUnlocked();
      }
    } catch {
      toast.error("Could not complete login.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-serif text-xl font-bold">Moderation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your admin account to review recommendations.
        </p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="mt-5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
          placeholder="Email address"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
          placeholder="Password"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
