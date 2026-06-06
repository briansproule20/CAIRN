import { NextRequest, NextResponse } from "next/server";
import { formatNotesToMdx, PonchoError } from "@/lib/poncho";

// Poncho is an agent — give the run room to breathe.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let body: { notes?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const notes = typeof body.notes === "string" ? body.notes : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : undefined;

  if (!notes.trim()) {
    return NextResponse.json(
      { error: "Nothing to format — write some notes first." },
      { status: 400 }
    );
  }

  try {
    const markdown = await formatNotesToMdx(notes, { category });
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
