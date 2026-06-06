import { NextRequest } from "next/server";
import { streamPoncho, stepsToText, PonchoError } from "@/lib/poncho";
import { resolvePonchoKey } from "@/lib/auth/poncho-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Poncho is an agent — give the run room to breathe.
export const maxDuration = 120;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Strip a leading/trailing ``` or ```markdown fence if Poncho wraps the file. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:mdx|markdown|md)?\s*\n([\s\S]*?)\n```$/;
  const m = trimmed.match(fence);
  return (m ? m[1] : trimmed).trim();
}

export async function POST(request: NextRequest) {
  let body: { content?: unknown; instructions?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const content = typeof body.content === "string" ? body.content : "";
  const instructions =
    typeof body.instructions === "string" ? body.instructions : "";

  if (!content.trim()) {
    return jsonError("Nothing to enrich — this entry is empty.", 400);
  }

  // Build the enrich prompt inline so the stream carries the same intent as the
  // blocking enrichEntry() did.
  const ask = instructions.trim()
    ? `The author wants you to enrich it with these instructions:\n${instructions.trim()}`
    : `Enrich it: tighten the writing, add useful structure, and expand thin sections with accurate, relevant detail.`;

  const prompt = `You are enriching an existing CAIRN vault entry. Improve it and return ONLY the updated content — no preamble, no commentary, no surrounding code fences.

${ask}

Rules:
- Preserve the author's voice and intent, and keep any existing frontmatter.
- You may use your tools (web access, etc.) to add accurate detail, but DO NOT invent facts or fabricate sources.
- Enrich rather than rewrite from scratch — keep what already works.
- Return well-structured Markdown (headings, lists, links where they help).

CURRENT ENTRY:
${content}`;

  const apiKey = (await resolvePonchoKey()) ?? undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      try {
        for await (const snap of streamPoncho(prompt, {
          signal: request.signal,
          apiKey,
        })) {
          send("progress", snap);
          if (snap.status === "finished") {
            send("done", { result: stripCodeFence(stepsToText(snap.steps)) });
          } else if (snap.status === "timeout") {
            send("timeout", { partial: stripCodeFence(stepsToText(snap.steps)) });
          }
        }
      } catch (err) {
        const msg =
          err instanceof PonchoError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Poncho couldn't enrich that.";
        send("error", { error: msg });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
