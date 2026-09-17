import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { fetchFeed, fetchLeaderboard } from "@/lib/community";
import { BookHeart, Menu, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Home", external: false },
  { to: "/browse", label: "Browse", external: false },
  { to: "/leaderboard", label: "Readers' Choice", external: false },
  { to: "/submit", label: "Recommend", external: false },
  { to: "/my-recommendations", label: "My Recommendations", external: false },
] as const;

const externalNavItem = {
  href: "https://smart.urdunovelbanks.com/",
  label: "Search Novels",
};

/* ── Consistent filled-glyph SVG icons (no enclosing circles) ── */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.079 1.372.157v3.318a8.7 8.7 0 00-.879-.028c-1.246 0-1.729.473-1.729 1.702v2.409h2.457l-.423 3.667h-2.034v8.15A11.999 11.999 0 0012.001 24a12.07 12.07 0 01-2.9-.309z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a8.6 8.6 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345c-.091.379-.293 1.194-.333 1.361-.053.218-.174.265-.402.16-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
    </svg>
  );
}

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/Urdu-novel-Bank/100090906471153/",
    icon: FacebookIcon,
  },
  {
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029VaurdEY0wajrnyeAl50Y",
    icon: WhatsAppIcon,
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/bankurdunovel/",
    icon: PinterestIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/urdunovelbank/",
    icon: InstagramIcon,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@urdunovelbank",
    icon: YouTubeIcon,
  },
  {
    label: "Telegram",
    href: "https://t.me/urdunovelbank",
    icon: TelegramIcon,
  },
];

export function SiteHeader() {
  const queryClient = useQueryClient();

  const handlePrefetch = (path: string) => {
    if (path === "/browse") {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["feed", "newest", "All"],
        queryFn: () => fetchFeed({ sort: "newest", genre: "All", limit: 30, offset: 0 }),
        initialPageParam: 0,
      });
    } else if (path === "/leaderboard") {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["leaderboard", "all"],
        queryFn: () => fetchLeaderboard("all", 30, 0),
        initialPageParam: 0,
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <BookHeart className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-[15px] font-semibold tracking-tight sm:text-base">Readers&apos;</span>
            <span className="text-[10px] tracking-wide text-muted-foreground sm:text-[11px]">Suggestion Library</span>
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onMouseEnter={() => handlePrefetch(item.to)}
              onFocus={() => handlePrefetch(item.to)}
              className="rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={externalNavItem.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {externalNavItem.label}
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </nav>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm sm:w-[350px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <BookHeart className="h-5 w-5 text-primary" />
                  <span className="flex flex-col leading-none">
                    <span className="font-serif text-xl font-semibold">Readers&apos;</span>
                    <span className="text-xs tracking-wide text-muted-foreground">Suggestion Library</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      className="block rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:font-semibold [&.active]:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <a
                    href={externalNavItem.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {externalNavItem.label}
                    <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                  </a>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
      <p className="font-serif italic">Kitaabein dost hoti hain — books are friends.</p>
      <p className="mt-2">
        Made by readers, for readers
      </p>

      {/* Social media icons */}
      <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3">
        {socialLinks.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary hover:text-primary-foreground hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
          </a>
        ))}
      </div>

      {/* Website links */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm sm:gap-4">
        <a
          href="https://www.urdunovelbanks.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/80 underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-primary"
        >
          Urdu Novel Bank
        </a>
        <span className="text-border" aria-hidden="true">·</span>
        <a
          href="https://urdufictionbank.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/80 underline decoration-border underline-offset-4 transition-colors duration-200 hover:text-primary hover:decoration-primary"
        >
          Urdu Fiction Bank
        </a>
      </div>
    </footer>
  );
}

