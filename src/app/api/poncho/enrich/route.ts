import { NextRequest, NextResponse } from "next/server";
import { enrichEntry, PonchoError } from "@/lib/poncho";
import { resolvePonchoKey } from "@/lib/auth/poncho-key";

// Poncho is an agent — give the run room to breathe.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: { content?: unknown; instructions?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content : "";
  const instructions =
    typeof body.instructions === "string" ? body.instructions : "";

  if (!content.trim()) {
    return NextResponse.json(
      { error: "Nothing to enrich — this entry is empty." },
      { status: 400 }
    );
  }

  try {
    const apiKey = (await resolvePonchoKey()) ?? undefined;
    const markdown = await enrichEntry(content, instructions, { apiKey });
    return NextResponse.json({ markdown });
  } catch (err) {
    if (err instanceof PonchoError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const msg = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json(
      { error: `Poncho request failed: ${msg}` },
      { status: 502 }
    );
  }
}
