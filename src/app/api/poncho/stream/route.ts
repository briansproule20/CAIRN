import { NextRequest } from "next/server";
import {
  buildPrompt,
  streamPoncho,
  stepsToText,
  PonchoError,
  type PonchoMode,
} from "@/lib/poncho";
import { recordChat } from "@/lib/repo/chats";
import { recordArtifacts } from "@/lib/repo/artifacts";
import { buildContext } from "@/lib/repo/nodes";
import { resolvePonchoKey } from "@/lib/auth/poncho-key";
import { getCurrentUserId } from "@/lib/auth/current-user";

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
  let body: {
    mode?: unknown;
    input?: unknown;
    category?: unknown;
    mediaType?: unknown;
    designLanguage?: unknown;
    contextIds?: unknown;
  };
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
  const mediaType =
    typeof body.mediaType === "string" ? body.mediaType : undefined;
  const designLanguage =
    typeof body.designLanguage === "string" ? body.designLanguage : undefined;
  const contextIds = Array.isArray(body.contextIds)
    ? body.contextIds.map(String)
    : [];

  if (
    mode !== "research" &&
    mode !== "write" &&
    mode !== "format" &&
    mode !== "media" &&
    mode !== "build"
  ) {
    return jsonError(
      "mode must be one of: research, write, format, media, build.",
      400
    );
  }
  if (!input.trim()) {
    return jsonError("Nothing to send — add some input first.", 400);
  }

  const apiKey = (await resolvePonchoKey()) ?? undefined;
  const ownerId = await getCurrentUserId();
  const context =
    mode === "build" && ownerId && contextIds.length
      ? await buildContext(ownerId, contextIds)
      : undefined;
  const prompt = buildPrompt(mode, input, {
    category,
    mediaType,
    designLanguage,
    context,
  });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      let recorded = false;
      const seenMedia = new Set<string>();
      const firstLine = input
        .trim()
        .split("\n")
        .find((l) => l.trim());
      const title = (firstLine ? firstLine.slice(0, 70) : "") || "Untitled chat";
      try {
        for await (const snap of streamPoncho(prompt, {
          signal: request.signal,
          apiKey,
        })) {
          // Track this chat as ours the moment Poncho assigns its id.
          if (!recorded && snap.chatId && ownerId) {
            recorded = true;
            void recordChat(ownerId, {
              ponchoChatId: snap.chatId,
              title,
              mode,
            });
          }
          // Auto-capture any generated media into the Artifacts holding pen.
          if (ownerId && snap.media?.length) {
            const fresh = snap.media.filter(
              (m) => m.url && !seenMedia.has(m.url)
            );
            if (fresh.length) {
              fresh.forEach((m) => seenMedia.add(m.url));
              void recordArtifacts(
                ownerId,
                fresh.map((m) => ({
                  chatId: snap.chatId,
                  kind: m.kind,
                  url: m.url,
                  mimeType: m.mimeType,
                  title: m.title,
                  description: m.description,
                }))
              );
            }
          }
          send("progress", snap);
          if (snap.status === "finished") {
            const result = stepsToText(snap.steps);
            send("done", { result });
            // A built HTML artifact comes back inline — capture it into the pen.
            if (
              ownerId &&
              mode === "build" &&
              snap.chatId &&
              /<[a-z!]/i.test(result)
            ) {
              void recordArtifacts(ownerId, [
                {
                  chatId: snap.chatId,
                  kind: "html",
                  url: `cairn:html:${snap.chatId}`,
                  content: result,
                  mimeType: "text/html",
                  title,
                },
              ]);
            }
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
