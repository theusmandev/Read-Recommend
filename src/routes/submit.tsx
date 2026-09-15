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

type FieldErrors = {
  title?: string;
  author?: string;
  reason?: string;
  genre?: string;
};

type ModalFieldErrors = {
  name?: string;
  email?: string;
};

const fieldErrorClass =
  "mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring";
const fieldErrorBorder = "border-red-500";
const fieldNormalBorder = "border-input";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-500" role="alert">
      {message}
    </p>
  );
}

function Submit() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [novelId, setNovelId] = useState<string | null>(null);
  const [matches, setMatches] = useState<NovelMatch[]>([]);
  
  const [reason, setReason] = useState("");
  const [genre, setGenre] = useState<Genre>("Social");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [modalErrors, setModalErrors] = useState<ModalFieldErrors>({});

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
    // Clear errors for fields that are now filled
    setFieldErrors((prev) => ({ ...prev, title: undefined, author: undefined }));
  }

  function handleChangeIdentity() {
    if (savedIdentity) {
      setModalName(savedIdentity.name);
      setModalEmail(savedIdentity.email);
    } else {
      setModalName("");
      setModalEmail("");
    }
    setModalErrors({});
    setIsModalOpen(true);
  }

  /** Validate all main form fields and return errors (empty object = valid). */
  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};
    if (!title.trim()) {
      errors.title = "Please add the novel name.";
    }
    if (!author.trim() && !novelId) {
      errors.author = "Please add the writer's name.";
    }
    if (!reason.trim()) {
      errors.reason = "Please tell us why you recommend this novel.";
    }
    if (!genre) {
      errors.genre = "Please select a genre.";
    }
    return errors;
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

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
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

    const errors: ModalFieldErrors = {};
    if (!name) {
      errors.name = "Please enter your name.";
    }
    if (!email) {
      errors.email = "Please enter your email address.";
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        errors.email = "Please enter a valid email address.";
      }
    }

    setModalErrors(errors);
    if (Object.keys(errors).length > 0) {
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

  // --- Clear individual field errors on change ---
  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
    setNovelId(null);
    if (fieldErrors.title) {
      setFieldErrors((prev) => ({ ...prev, title: undefined }));
    }
  }

  function handleAuthorChange(event: React.ChangeEvent<HTMLInputElement>) {
    setAuthor(event.target.value);
    if (fieldErrors.author) {
      setFieldErrors((prev) => ({ ...prev, author: undefined }));
    }
  }

  function handleReasonChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setReason(event.target.value);
    if (fieldErrors.reason) {
      setFieldErrors((prev) => ({ ...prev, reason: undefined }));
    }
  }

  function handleGenreChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setGenre(event.target.value as Genre);
    if (fieldErrors.genre) {
      setFieldErrors((prev) => ({ ...prev, genre: undefined }));
    }
  }

  function handleModalNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setModalName(event.target.value);
    if (modalErrors.name) {
      setModalErrors((prev) => ({ ...prev, name: undefined }));
    }
  }

  function handleModalEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setModalEmail(event.target.value);
    if (modalErrors.email) {
      setModalErrors((prev) => ({ ...prev, email: undefined }));
    }
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
              setFieldErrors({});
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

      <form onSubmit={onSubmitForm} className="mt-6 space-y-5 rounded-3xl border border-border bg-card p-6" noValidate>
        {/* Novel title */}
        <div className="relative">
          <label className="block text-sm font-medium" htmlFor="title">
            Novel title
          </label>
          <input
            id="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Jannat Kay Pattay"
            className={`${fieldErrorClass} ${fieldErrors.title ? fieldErrorBorder : fieldNormalBorder}`}
            autoComplete="off"
            dir="auto"
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? "title-error" : undefined}
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
          <FieldError message={fieldErrors.title} />
        </div>

        {/* Writer's name */}
        <div>
          <label className="block text-sm font-medium" htmlFor="author">
            Writer's name
          </label>
          <input
            id="author"
            value={author}
            onChange={handleAuthorChange}
            placeholder="e.g. Nimra Ahmed"
            disabled={Boolean(novelId)}
            className={`${fieldErrorClass} disabled:opacity-60 ${fieldErrors.author ? fieldErrorBorder : fieldNormalBorder}`}
            dir="auto"
            aria-invalid={!!fieldErrors.author}
            aria-describedby={fieldErrors.author ? "author-error" : undefined}
          />
          <FieldError message={fieldErrors.author} />
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium" htmlFor="genre">
            Genre
          </label>
          <select
            id="genre"
            value={genre}
            onChange={handleGenreChange}
            className={`${fieldErrorClass} ${fieldErrors.genre ? fieldErrorBorder : fieldNormalBorder}`}
            aria-invalid={!!fieldErrors.genre}
            aria-describedby={fieldErrors.genre ? "genre-error" : undefined}
          >
            {GENRES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.genre} />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium" htmlFor="reason">
            Why do you recommend it?
          </label>
          <textarea
            id="reason"
            value={reason}
            maxLength={MAX_REASON}
            rows={4}
            onChange={handleReasonChange}
            placeholder="What made this novel special for you?"
            className={`${fieldErrorClass} leading-relaxed ${fieldErrors.reason ? fieldErrorBorder : fieldNormalBorder}`}
            dir="auto"
            aria-invalid={!!fieldErrors.reason}
            aria-describedby={fieldErrors.reason ? "reason-error" : undefined}
          />
          <div className="mt-1 flex items-start justify-between gap-2">
            <FieldError message={fieldErrors.reason} />
            <p className="shrink-0 text-right text-xs text-muted-foreground">
              {reason.length}/{MAX_REASON}
            </p>
          </div>
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
          <form onSubmit={onModalSubmit} className="mt-4 space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium" htmlFor="modalName">
                Your name
              </label>
              <input
                id="modalName"
                value={modalName}
                onChange={handleModalNameChange}
                placeholder="e.g. Ayesha"
                className={`${fieldErrorClass} ${modalErrors.name ? fieldErrorBorder : fieldNormalBorder}`}
                dir="auto"
                aria-invalid={!!modalErrors.name}
              />
              <FieldError message={modalErrors.name} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="modalEmail">
                Email address
              </label>
              <input
                id="modalEmail"
                type="email"
                value={modalEmail}
                onChange={handleModalEmailChange}
                placeholder="you@example.com"
                className={`${fieldErrorClass} ${modalErrors.email ? fieldErrorBorder : fieldNormalBorder}`}
                aria-invalid={!!modalErrors.email}
              />
              <FieldError message={modalErrors.email} />
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
