import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { fetchFeed, fetchLeaderboard } from "@/lib/community";
import { BookHeart, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/leaderboard", label: "Readers' Choice" },
  { to: "/submit", label: "Recommend" },
  { to: "/my-recommendations", label: "My Recommendations" },
] as const;

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
          <span className="truncate text-[15px] font-semibold tracking-tight sm:text-lg">
            Urdu Novel Bank
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
                <SheetTitle className="flex items-center gap-2 font-serif text-xl">
                  <BookHeart className="h-5 w-5 text-primary" />
                  Urdu Novel Bank
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
    </footer>
  );
}
