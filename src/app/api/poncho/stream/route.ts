import { NextRequest } from "next/server";
import {
  buildPrompt,
  streamPoncho,
  stepsToText,
  PonchoError,
  type PonchoMode,
} from "@/lib/poncho";
import { recordChat } from "@/lib/chat-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Streaming research can run for minutes; give it room.
export const maxDuration = 300;

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  let body: { mode?: unknown; input?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const mode = body.mode as PonchoMode;
  const input = typeof body.input === "string" ? body.input : "";
  const category =
    typeof body.category === "string" && body.category.trim()
      ? body.category.trim()
      : undefined;

  if (mode !== "research" && mode !== "write" && mode !== "format") {
    return jsonError("mode must be one of: research, write, format.", 400);
  }
  if (!input.trim()) {
    return jsonError("Nothing to send — add some input first.", 400);
  }

  const prompt = buildPrompt(mode, input, { category });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      let recorded = false;
      const firstLine = input
        .trim()
        .split("\n")
        .find((l) => l.trim());
      const title = (firstLine ? firstLine.slice(0, 70) : "") || "Untitled chat";
      try {
        for await (const snap of streamPoncho(prompt, {
          signal: request.signal,
        })) {
          // Track this chat as ours the moment Poncho assigns its id.
          if (!recorded && snap.chatId) {
            recorded = true;
            recordChat({ id: snap.chatId, title, mode });
          }
          send("progress", snap);
          if (snap.status === "finished") {
            send("done", { result: stepsToText(snap.steps) });
          } else if (snap.status === "timeout") {
            send("timeout", { partial: stepsToText(snap.steps) });
          }
        }
      } catch (err) {
        const msg =
          err instanceof PonchoError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Poncho stream failed.";
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
