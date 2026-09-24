import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchGenres, type Genre } from "@/lib/community";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderation | Readers' Suggestion Library" },
      { name: "description", content: "Private moderation page for the Readers' Suggestion Library admin." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Moderation | Readers' Suggestion Library" },
      { property: "og:description", content: "Private moderation page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "genres">("pending");

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
    staleTime: 0,
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
    staleTime: 0,
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "approved" | "rejected"; reason?: string }) => {
      const { error } = await supabase
        .from("recommendations")
        .update({ status: action, rejection_reason: reason || null })
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Administration</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "pending" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("genres")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "genres" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              Genres
            </button>
          </div>
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
      </div>

      <div className="mt-6">
        {activeTab === "pending" ? (
          <div className="space-y-4">
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
              {rejectingId === item.id ? (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <label htmlFor={`reject-reason-${item.id}`} className="text-sm font-semibold text-foreground">
                    Reason (optional, shown to the reader)
                  </label>
                  <textarea
                    id={`reject-reason-${item.id}`}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="min-h-[80px] w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. This novel doesn't meet our criteria..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      disabled={moderateMutation.isPending}
                      className="rounded-full px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        moderateMutation.mutate({ id: item.id, action: "rejected", reason: rejectReason });
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      disabled={moderateMutation.isPending}
                      className="rounded-full bg-red-500/10 text-red-600 border border-red-500/30 px-4 py-2 text-sm font-medium hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => moderateMutation.mutate({ id: item.id, action: "approved" })}
                    disabled={moderateMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 sm:py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(item.id);
                      setRejectReason("");
                    }}
                    disabled={moderateMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-3 sm:py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center text-muted-foreground">
            Nothing waiting for review right now.
          </p>
        )}
          </div>
        ) : (
          <ManageGenres />
        )}
      </div>
    </div>
  );
}

function ManageGenres() {
  const queryClient = useQueryClient();
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreOrder, setNewGenreOrder] = useState("");

  const genresQuery = useQuery({
    queryKey: ["admin-genres"],
    queryFn: fetchGenres,
  });

  const addMutation = useMutation({
    mutationFn: async ({ name, display_order }: { name: string; display_order: number }) => {
      const { error } = await supabase.rpc("add_genre", { p_name: name, p_display_order: display_order });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Genre added");
      setNewGenreName("");
      setNewGenreOrder("");
      queryClient.invalidateQueries({ queryKey: ["admin-genres"] });
      queryClient.invalidateQueries({ queryKey: ["genres"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to add genre"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, display_order }: { id: string; name: string; display_order: number }) => {
      const { error } = await supabase.rpc("update_genre", { p_id: id, p_name: name, p_display_order: display_order });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Genre updated");
      setEditingGenre(null);
      queryClient.invalidateQueries({ queryKey: ["admin-genres"] });
      queryClient.invalidateQueries({ queryKey: ["genres"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to update genre"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_genre", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Genre deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-genres"] });
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete genre"),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-serif text-lg font-semibold">Add New Genre</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newGenreName && newGenreOrder) {
              addMutation.mutate({ name: newGenreName, display_order: parseInt(newGenreOrder, 10) });
            }
          }}
          className="mt-4 flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Genre Name"
            value={newGenreName}
            onChange={(e) => setNewGenreName(e.target.value)}
            required
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Order (e.g. 50)"
            value={newGenreOrder}
            onChange={(e) => setNewGenreOrder(e.target.value)}
            required
            className="w-32 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-secondary/30">
          <h2 className="font-serif text-lg font-semibold">Manage Genres</h2>
        </div>
        {genresQuery.isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading genres…</p>
        ) : (
          <ul className="divide-y divide-border">
            {genresQuery.data?.map((g) => (
              <li key={g.id} className="p-5 flex items-center justify-between gap-4">
                {editingGenre?.id === g.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate({
                        id: g.id,
                        name: editingGenre.name,
                        display_order: editingGenre.display_order,
                      });
                    }}
                    className="flex-1 flex flex-col sm:flex-row gap-3"
                  >
                    <input
                      type="text"
                      value={editingGenre.name}
                      onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                      className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                    <input
                      type="number"
                      value={editingGenre.display_order}
                      onChange={(e) => setEditingGenre({ ...editingGenre, display_order: parseInt(e.target.value, 10) })}
                      className="w-24 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingGenre(null)}
                        className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">Order: {g.display_order}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingGenre(g)}
                        className="text-sm font-medium hover:underline text-muted-foreground"
                      >
                        Edit
                      </button>
                      {g.name !== "Other" && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${g.name}"? All related recommendations will be reassigned to "Other".`)) {
                              deleteMutation.mutate(g.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
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
