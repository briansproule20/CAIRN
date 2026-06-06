import { NextRequest, NextResponse } from "next/server";
import {
  formatNotesToMdx,
  researchTopic,
  writeCopy,
  PonchoError,
} from "@/lib/poncho";

// Poncho is an agent — research especially can take a while.
export const maxDuration = 120;

type Mode = "research" | "write" | "format";

export async function POST(request: NextRequest) {
  let body: { mode?: unknown; input?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mode = body.mode as Mode;
  const input = typeof body.input === "string" ? body.input : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : undefined;

  if (mode !== "research" && mode !== "write" && mode !== "format") {
    return NextResponse.json(
      { error: "mode must be one of: research, write, format." },
      { status: 400 }
    );
  }
  if (!input.trim()) {
    return NextResponse.json(
      { error: "Nothing to send — add some input first." },
      { status: 400 }
    );
  }

  try {
    let result: string;
    if (mode === "research") result = await researchTopic(input, { category });
    else if (mode === "write") result = await writeCopy(input, { category });
    else result = await formatNotesToMdx(input, { category });

    return NextResponse.json({ mode, result });
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
