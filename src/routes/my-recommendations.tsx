import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchMyRecommendations,
  deleteMyRecommendation,
  getReaderId,
  type FeedItem,
} from "@/lib/community";
import { RecommendationCard } from "@/components/RecommendationCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/my-recommendations")({
  head: () => ({
    meta: [
      { title: "My Recommendations | Readers' Suggestion Library" },
      { name: "description", content: "View and manage your recommended Urdu novels." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MyRecommendations,
});

function MyRecommendations() {
  const queryClient = useQueryClient();
  const [readerId, setReaderId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("reader_id");
  });
  
  // Identity state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FeedItem | null>(null);

  useEffect(() => {
    // Check localStorage for saved identity
    const name = localStorage.getItem("reader_name");
    const email = localStorage.getItem("reader_email");
    const id = localStorage.getItem("reader_id");
    
    // If we don't have the ID but have name/email, resolve it
    if (!id && name && email) {
      resolveIdentity(name, email);
    } else if (!id && (!name || !email)) {
      // If we don't have anything, show the modal
      setIsModalOpen(true);
    }
  }, []);

  async function resolveIdentity(name: string, email: string) {
    try {
      const id = await getReaderId(name, email);
      localStorage.setItem("reader_id", id);
      setReaderId(id);
    } catch (e) {
      toast.error("Failed to verify your identity.");
    }
  }

  async function onModalSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = modalName.trim();
    const email = modalEmail.trim().toLowerCase();

    if (!name || !email) {
      toast.error("Name and email are required.");
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSavingIdentity(true);
    try {
      const id = await getReaderId(name, email);
      localStorage.setItem("reader_name", name);
      localStorage.setItem("reader_email", email);
      localStorage.setItem("reader_id", id);
      setReaderId(id);
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Failed to verify your identity.");
    } finally {
      setSavingIdentity(false);
    }
  }

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["my-recommendations", readerId],
    queryFn: () => (readerId ? fetchMyRecommendations(readerId) : []),
    enabled: !!readerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      if (!readerId) throw new Error("Not identified");
      await deleteMyRecommendation(recommendationId, readerId);
    },
    onSuccess: () => {
      toast.success("Recommendation deleted");
      queryClient.invalidateQueries({ queryKey: ["my-recommendations", readerId] });
    },
    onError: () => {
      toast.error("Failed to delete recommendation");
    },
  });


  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">My Recommendations</h1>
      <p className="mt-2 text-muted-foreground">
        View and manage the novels you've recommended to the community.
      </p>

      {!readerId ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center mt-8">
          <p className="font-serif text-lg">Enter your details to view your recommendations.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Identify Yourself
          </button>
        </div>
      ) : (
        <section className="mt-8">
          <h2 className="sr-only">Your submitted recommendations</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your recommendations…</p>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="grid gap-4">
              {recommendations.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  voted={false}
                  onDelete={(id) => {
                    setItemToDelete(item);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center mt-6">
              <p className="font-serif text-lg">You haven't recommended a novel yet.</p>
              <Link
                to="/submit"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <PenLine className="h-4 w-4" /> Recommend a Novel
              </Link>
            </div>
          )}
        </section>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Who are you?</DialogTitle>
            <DialogDescription>
              Enter your Name and Email to view your recommendations. We'll link this to your submissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onModalSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium" htmlFor="modalName">
                Your name
              </label>
              <input
                id="modalName"
                value={modalName}
                onChange={(event) => setModalName(event.target.value)}
                placeholder="e.g. Ayesha"
                required
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
                dir="auto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="modalEmail">
                Email address
              </label>
              <input
                id="modalEmail"
                type="email"
                value={modalEmail}
                onChange={(event) => setModalEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={savingIdentity}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {savingIdentity ? "Verifying…" : "View My Recommendations"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Delete Recommendation</DialogTitle>
            <DialogDescription className="mt-2">
              Are you sure you want to delete your recommendation for <strong className="font-medium text-foreground">{itemToDelete?.novels?.title}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              onClick={() => setItemToDelete(null)}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (itemToDelete) {
                  deleteMutation.mutate(itemToDelete.id);
                  setItemToDelete(null);
                }
              }}
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
