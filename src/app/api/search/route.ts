import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { searchNodes, slugPathFor } from "@/lib/repo/nodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SNIPPET_RADIUS = 70;

export interface SearchResult {
  title: string;
  kind: "folder" | "entry";
  href: string;
  snippet: string;
  matchedTitle: boolean;
}

function toPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^>+\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/^---[\s\S]*?---/, "")
    .replace(/\s+/g, " ")
    .trim();
}

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
  let s = plain.slice(start, end).trim();
  if (start > 0) s = "…" + s;
  if (end < plain.length) s = s + "…";
  return s;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const ownerId = await getCurrentUserId();
  if (!q || !ownerId) {
    return NextResponse.json(
      { query: q, count: 0, results: [] as SearchResult[] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const lowered = q.toLowerCase();
  const matches = await searchNodes(ownerId, q, 24);
  const results: SearchResult[] = await Promise.all(
    matches.map(async (m) => ({
      title: m.title,
      kind: m.kind as "folder" | "entry",
      href:
        "/vault/" +
        (await slugPathFor(ownerId, m)).map(encodeURIComponent).join("/"),
      snippet: buildSnippet(m.content, q),
      matchedTitle: m.title.toLowerCase().includes(lowered),
    }))
  );
  results.sort((a, b) => Number(b.matchedTitle) - Number(a.matchedTitle));

  return NextResponse.json(
    { query: q, count: results.length, results },
    { headers: { "Cache-Control": "no-store" } }
  );
}
