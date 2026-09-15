import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  GENRES,
  searchNovels,
  submitRecommendation,
  type Genre,
  type NovelMatch,
} from "@/lib/community";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Recommend an Urdu Novel | Urdu Novel Bank" },
      {
        name: "description",
        content:
          "Share an Urdu novel you loved and tell fellow readers why. No sign-up needed — just the novel, the writer and your reason.",
      },
      { property: "og:title", content: "Recommend an Urdu Novel" },
      {
        property: "og:description",
        content: "Add your favourite Urdu novel to the community shelf in under a minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Submit,
});

const MAX_REASON = 300;

function Submit() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [novelId, setNovelId] = useState<string | null>(null);
  const [matches, setMatches] = useState<NovelMatch[]>([]);
  
  const [reason, setReason] = useState("");
  const [genre, setGenre] = useState<Genre>("Social");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Identity state
  const [savedIdentity, setSavedIdentity] = useState<{ name: string; email: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalEmail, setModalEmail] = useState("");

  useEffect(() => {
    // Load identity from localStorage on mount
    const name = localStorage.getItem("reader_name");
    const email = localStorage.getItem("reader_email");
    if (name && email) {
      setSavedIdentity({ name, email });
    }
  }, []);

  // Fuzzy autocomplete against novels already in the library, so the same book
  // does not end up on the leaderboard under three different spellings.
  useEffect(() => {
    if (novelId) return;
    const handle = setTimeout(async () => {
      try {
        setMatches(await searchNovels(title));
      } catch {
        setMatches([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [title, novelId]);

  function chooseMatch(match: NovelMatch) {
    setNovelId(match.id);
    setTitle(match.title);
    setAuthor(match.author_name);
    setMatches([]);
  }

  function handleChangeIdentity() {
    if (savedIdentity) {
      setModalName(savedIdentity.name);
      setModalEmail(savedIdentity.email);
    } else {
      setModalName("");
      setModalEmail("");
    }
    setIsModalOpen(true);
  }

  async function performSubmit(name: string, email: string) {
    setSaving(true);
    try {
      await submitRecommendation({ 
        novelId, 
        title, 
        author, 
        readerName: name, 
        readerEmail: email,
        reason, 
        genre 
      });
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !reason.trim()) {
      toast.error("Please add the novel name and why you recommend it.");
      return;
    }
    
    if (savedIdentity) {
      await performSubmit(savedIdentity.name, savedIdentity.email);
    } else {
      // Trigger modal to capture identity
      setIsModalOpen(true);
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

    // Save to localStorage
    localStorage.setItem("reader_name", name);
    localStorage.setItem("reader_email", email);
    setSavedIdentity({ name, email });
    setIsModalOpen(false);
    
    // Proceed with submission immediately
    await performSubmit(name, email);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-serif text-2xl font-bold">Jazak Allah — thank you!</h1>
        <p className="mt-3 text-muted-foreground">
          Your recommendation has been sent for a quick review. Once approved it will appear in the
          community feed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/browse"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            See Recommendations
          </Link>
          <button
            onClick={() => {
              setDone(false);
              setTitle("");
              setAuthor("");
              setNovelId(null);
              setReason("");
            }}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
          >
            Recommend another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">Recommend a Novel</h1>
      <p className="mt-2 text-muted-foreground">
        Tell us the novel and why it deserves a place on someone's shelf.
      </p>

      <form onSubmit={onSubmitForm} className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6">
        <div className="relative">
          <label className="block text-sm font-medium" htmlFor="title">
            Novel title
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setNovelId(null);
            }}
            placeholder="e.g. Jannat Kay Pattay"
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
            dir="auto"
          />
          {matches.length > 0 ? (
            <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
              <li className="px-3 py-2 text-xs text-muted-foreground">
                Already in the library — pick one to avoid duplicates:
              </li>
              {matches.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    onClick={() => chooseMatch(match)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <span className="font-medium" dir="auto">{match.title}</span>
                    {match.author_name ? (
                      <span className="text-muted-foreground" dir="auto"> — {match.author_name}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {novelId ? (
            <p className="mt-1.5 text-xs text-primary">
              Linked to an existing novel in the library.
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="author">
            Writer's name
          </label>
          <input
            id="author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="e.g. Nimra Ahmed"
            disabled={Boolean(novelId)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            dir="auto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="genre">
            Genre
          </label>
          <select
            id="genre"
            value={genre}
            onChange={(event) => setGenre(event.target.value as Genre)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
          >
            {GENRES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium" htmlFor="reason">
            Why do you recommend it?
          </label>
          <textarea
            id="reason"
            value={reason}
            maxLength={MAX_REASON}
            rows={4}
            onChange={(event) => setReason(event.target.value)}
            placeholder="What made this novel special for you?"
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-base leading-relaxed outline-none focus:ring-2 focus:ring-ring"
            dir="auto"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {reason.length}/{MAX_REASON}
          </p>
        </div>

        {savedIdentity && (
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              <span dir="auto">
                Recommending as: <strong className="font-medium">{savedIdentity.name}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleChangeIdentity}
              className="text-xs text-muted-foreground hover:text-foreground underline decoration-muted-foreground/50 underline-offset-4"
            >
              Not you? Change
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Sending…" : "Send recommendation"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Recommendations appear after a quick review by the admin.
        </p>
      </form>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Who are you?</DialogTitle>
            <DialogDescription>
              We'd love to know who is recommending this novel. We'll save this on your device so you don't have to enter it again.
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
              <p className="mt-1 text-xs text-muted-foreground">
                Your email is kept private and never shown publicly.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Sending recommendation…" : "Save & Send"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
