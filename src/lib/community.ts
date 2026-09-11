// Client-side data helpers for the public site.
// All of these run against the public (row-level-secured) tables:
// only approved recommendations are readable, submissions always start pending.
import { supabase } from "@/integrations/supabase/client";

export const GENRES = ["Romance", "Social", "Mystery", "Historical", "Fantasy", "Other"] as const;
export type Genre = (typeof GENRES)[number];

export type FeedItem = {
  id: string;
  reader_name: string | null;
  reason: string;
  genre: string;
  helpful_count: number;
  created_at: string;
  novels: { id: string; title: string; author_name: string } | null;
};

export type SortKey = "newest" | "helpful";

/** Lowercase + collapse whitespace so "Jannat  Kay Pattay" == "jannat kay pattay". */
export function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Stable per-browser id used to allow exactly one helpful vote per recommendation. */
export function getFingerprint(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("unb_voter_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("unb_voter_id", id);
  }
  return id;
}

export function getVotedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("unb_voted") ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function rememberVote(id: string) {
  const voted = new Set(getVotedIds());
  voted.add(id);
  localStorage.setItem("unb_voted", JSON.stringify([...voted]));
}

export async function fetchFeed(options: {
  sort: SortKey;
  genre: string;
  limit?: number;
}): Promise<FeedItem[]> {
  let query = supabase
    .from("recommendations")
    .select("id, reader_name, reason, genre, helpful_count, created_at, novels(id, title, author_name)")
    .eq("status", "approved");

  if (options.genre !== "All") query = query.eq("genre", options.genre);

  query =
    options.sort === "helpful"
      ? query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(options.limit ?? 60);
  if (error) throw error;
  return (data ?? []) as unknown as FeedItem[];
}

export type LeaderRow = {
  novel_id: string;
  title: string;
  author_name: string;
  recommendation_count: number;
  helpful_total: number;
};

export async function fetchLeaderboard(period: "all" | "month" | "week"): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("leaderboard", { period });
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}

export type NovelMatch = { id: string; title: string; author_name: string; score: number };

/** Fuzzy title lookup so the same novel is not created twice under different spellings. */
export async function searchNovels(q: string): Promise<NovelMatch[]> {
  if (q.trim().length < 2) return [];
  const { data, error } = await supabase.rpc("search_novels", { q });
  if (error) throw error;
  return (data ?? []) as NovelMatch[];
}

export async function voteHelpful(recommendationId: string) {
  const { error } = await supabase.from("recommendation_votes").insert({
    recommendation_id: recommendationId,
    voter_fingerprint: getFingerprint(),
  });
  // Duplicate vote (unique constraint) is a no-op, not an error for the reader.
  if (error && error.code !== "23505") throw error;
  rememberVote(recommendationId);
}

export function forgetVote(id: string) {
  if (typeof window === "undefined") return;
  const voted = new Set(getVotedIds());
  voted.delete(id);
  localStorage.setItem("unb_voted", JSON.stringify([...voted]));
}

export async function removeVoteHelpful(recommendationId: string) {
  const { error, count } = await supabase
    .from("recommendation_votes")
    .delete({ count: "exact" })
    .eq("recommendation_id", recommendationId)
    .eq("voter_fingerprint", getFingerprint());
  
  if (error) throw error;
  if (count === 0) {
    throw new Error("Vote could not be removed. It may have already been removed, or a database policy blocked the action.");
  }
  
  forgetVote(recommendationId);
}

export async function submitRecommendation(input: {
  novelId: string | null;
  title: string;
  author: string;
  readerName: string;
  readerEmail: string;
  reason: string;
  genre: Genre;
}) {
  let novelId = input.novelId;

  if (!novelId) {
    const normalized = normalizeTitle(input.title);
    // Re-check for an existing novel with the same normalized title before inserting.
    const { data: existing } = await supabase
      .from("novels")
      .select("id")
      .eq("normalized_title", normalized)
      .maybeSingle();

    if (existing) {
      novelId = existing.id;
    } else {
      const { data: created, error: novelError } = await supabase
        .from("novels")
        .insert({
          title: input.title.trim(),
          author_name: input.author.trim(),
          normalized_title: normalized,
        })
        .select("id")
        .single();
      if (novelError) throw novelError;
      novelId = created.id;
    }
  }

  // Upsert reader identity via RPC to get the reader_id securely
  const { data: readerId, error: readerError } = await supabase.rpc("upsert_reader", {
    p_name: input.readerName.trim(),
    p_email: input.readerEmail.trim(),
  });
  if (readerError) throw readerError;

  const { error } = await supabase.from("recommendations").insert({
    novel_id: novelId,
    reader_name: input.readerName.trim() || null,
    reader_id: readerId,
    reason: input.reason.trim(),
    genre: input.genre,
    status: "pending",
  });
  if (error) throw error;
}

export async function debugWhoami() {
  const { data, error } = await supabase.rpc("debug_whoami");
  if (error) {
    console.error("debug_whoami error:", error);
  } else {
    console.log("debug_whoami output:", data);
  }
}
