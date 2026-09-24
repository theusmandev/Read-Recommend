// Client-side data helpers for the public site.
// All of these run against the public (row-level-secured) tables:
// only approved recommendations are readable, submissions always start pending.
import { supabase } from "@/integrations/supabase/client";

export type Genre = {
  id: string;
  name: string;
  display_order: number;
};

export type FeedItem = {
  id: string;
  reader_name: string | null;
  reason: string;
  genre: string;
  genre_id?: string;
  helpful_count: number;
  created_at: string;
  status?: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
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
  genreId: string;
  limit?: number;
  offset?: number;
}): Promise<FeedItem[]> {
  let query = supabase
    .from("recommendations")
    .select("id, reader_name, reason, genre, helpful_count, created_at, novels(id, title, author_name)")
    .eq("status", "approved");

  if (options.genreId !== "All") query = query.eq("genre_id", options.genreId);

  query =
    options.sort === "helpful"
      ? query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data, error } = await query.range(
    options.offset ?? 0,
    (options.offset ?? 0) + (options.limit ?? 30) - 1
  );
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

export async function fetchLeaderboard(
  period: "all" | "month" | "week",
  limit: number = 30,
  offset: number = 0
): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("leaderboard", { period, p_limit: limit, p_offset: offset });
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}

export type TopReader = {
  reader_id: string;
  reader_name: string;
  approved_count: number;
};

export async function fetchTopReaders(period: "all" | "month" | "week" = "all", limit: number = 20): Promise<TopReader[]> {
  const { data, error } = await supabase.rpc("get_top_readers", { p_period: period, p_limit: limit });
  if (error) throw error;
  return (data ?? []) as TopReader[];
}

export type NovelMatch = { id: string; title: string; author_name: string; score: number };

/** Fuzzy title lookup so the same novel is not created twice under different spellings. */
export async function searchNovels(q: string): Promise<NovelMatch[]> {
  if (q.trim().length < 2) return [];
  const { data, error } = await supabase.rpc("search_novels", { q });
  if (error) throw error;
  return (data ?? []) as NovelMatch[];
}

export function forgetVote(id: string) {
  if (typeof window === "undefined") return;
  const voted = new Set(getVotedIds());
  voted.delete(id);
  localStorage.setItem("unb_voted", JSON.stringify([...voted]));
}

export async function toggleVoteHelpful(recommendationId: string) {
  const { data, error } = await supabase.rpc("toggle_helpful_vote", {
    p_recommendation_id: recommendationId,
    p_voter_fingerprint: getFingerprint(),
  });

  if (error) throw error;
  if (!data || data.length === 0) throw new Error("No response from toggle function");

  const result = data[0];
  
  if (result.is_voted) {
    rememberVote(recommendationId);
  } else {
    forgetVote(recommendationId);
  }

  return {
    isVoted: result.is_voted,
    newCount: result.new_count,
  };
}

export async function submitRecommendation(input: {
  novelId: string | null;
  title: string;
  author: string;
  readerName: string;
  readerEmail: string;
  reason: string;
  genreId: string;
  genreName: string;
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
  if (readerError) throw new Error(readerError.message);

  const { error } = await supabase.from("recommendations").insert({
    novel_id: novelId,
    reader_name: input.readerName.trim() || null,
    reader_id: readerId,
    reason: input.reason.trim(),
    genre_id: input.genreId,
    genre: input.genreName,
    status: "pending",
  });
  if (error) throw error;
}

export async function fetchMyRecommendations(readerId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .rpc("get_my_recommendations", { p_reader_id: readerId })
    .select("id, reader_name, reason, genre, genre_id, status, rejection_reason, helpful_count, created_at, novels(id, title, author_name)");

  if (error) throw error;
  return (data ?? []) as unknown as FeedItem[];
}

export async function deleteMyRecommendation(recommendationId: string, readerId: string) {
  const { error } = await supabase.rpc("delete_my_recommendation", {
    p_recommendation_id: recommendationId,
    p_reader_id: readerId,
  });
  if (error) throw error;
}

export async function updateAndResubmitRecommendation(
  recommendationId: string,
  readerId: string,
  reason: string,
  genreId: string,
  genreName: string
) {
  const { error } = await supabase.rpc("update_and_resubmit_recommendation", {
    p_recommendation_id: recommendationId,
    p_reader_id: readerId,
    p_reason: reason.trim(),
    p_genre_id: genreId,
    p_genre: genreName,
  });
  if (error) throw error;
}

export async function fetchReaderProfile(readerId: string) {
  const { data: recommendations, error } = await supabase
    .from("recommendations")
    .select("id, reader_name, reason, genre, helpful_count, created_at, novels(id, title, author_name)")
    .eq("status", "approved")
    .eq("reader_id", readerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const readerName = recommendations?.[0]?.reader_name || "Unknown Reader";

  return {
    readerName,
    recommendations: (recommendations ?? []) as unknown as FeedItem[],
  };
}

export async function getReaderId(name: string, email: string): Promise<string> {
  const { data: readerId, error } = await supabase.rpc("upsert_reader", {
    p_name: name.trim(),
    p_email: email.trim(),
  });
  if (error) throw new Error(error.message);
  return readerId;
}

export async function fetchGenres(): Promise<Genre[]> {
  const { data, error } = await supabase
    .from("genres")
    .select("id, name, display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data as Genre[];
}

export async function fetchAllGenreCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("get_genre_counts");
  if (error) {
    console.error("Error fetching genre counts:", error);
    return { All: 0 };
  }

  const counts: Record<string, number> = { All: 0 };
  let total = 0;
  for (const row of data || []) {
    counts[row.genre_id] = Number(row.count);
    total += Number(row.count);
  }
  counts["All"] = total;
  return counts;
}

export async function fetchTotalReaderCount(): Promise<number> {
  const { data, error } = await supabase.rpc("get_total_reader_count");
  if (error) {
    console.error("Error fetching total reader count:", error);
    return 0;
  }
  return Number(data ?? 0);
}

