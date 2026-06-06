import { NextRequest, NextResponse } from "next/server";
import { searchEntries } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Max number of results returned per query. */
const RESULT_CAP = 24;
/** Characters of context to show on either side of the matched term. */
const SNIPPET_RADIUS = 70;

export interface SearchResult {
  slug: string;
  category: string;
  title: string;
  tags: string[];
  status: string;
  /** Short excerpt of content around the matched term (plain text). */
  snippet: string;
  /** Whether the query matched the title. */
  matchedTitle: boolean;
}

/**
 * Collapse MDX/markdown noise into readable plain text for the snippet.
 * Keeps it lightweight — strips code fences, headings, list markers, links,
 * and excess whitespace so the excerpt reads like prose.
 */
function toPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // images / links -> label
    .replace(/^>+\s?/gm, "") // blockquotes
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^[-*+]\s+/gm, "") // bullet markers
    .replace(/[*_~]/g, "") // emphasis markers
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a snippet centered on the first occurrence of `q` (case-insensitive).
 * Falls back to the start of the content when there is no body match.
 */
function buildSnippet(content: string, q: string): string {
  const plain = toPlainText(content);
  if (!plain) return "";

  const idx = plain.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) {
    return plain.length > SNIPPET_RADIUS * 2
      ? plain.slice(0, SNIPPET_RADIUS * 2).trimEnd() + "…"
      : plain;
  }

  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(plain.length, idx + q.length + SNIPPET_RADIUS);
  let snippet = plain.slice(start, end).trim();
  if (start > 0) snippet = "…" + snippet;
  if (end < plain.length) snippet = snippet + "…";
  return snippet;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json(
      { query: "", count: 0, results: [] as SearchResult[] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const lowered = q.toLowerCase();
  const matches = searchEntries(q);

  const results: SearchResult[] = matches.slice(0, RESULT_CAP).map((e) => ({
    slug: e.slug,
    category: e.category,
    title: e.title,
    tags: e.tags,
    status: e.status,
    snippet: buildSnippet(e.content, q),
    matchedTitle: e.title.toLowerCase().includes(lowered),
  }));

  // Title matches first, then the rest — keeps the most relevant up top.
  results.sort((a, b) => Number(b.matchedTitle) - Number(a.matchedTitle));

  return NextResponse.json(
    { query: q, count: matches.length, results },
    { headers: { "Cache-Control": "no-store" } }
  );
}
