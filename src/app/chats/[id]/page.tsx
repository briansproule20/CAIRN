import Link from "next/link";
import Image from "next/image";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { AppShell } from "@/components/app-shell";
import { ChatActions } from "@/components/chat-actions";
import { MDXContent } from "@/components/mdx-content";
import { getChat, PonchoError, type PonchoStep } from "@/lib/poncho";
import { resolvePonchoKey } from "@/lib/auth/poncho-key";

export const dynamic = "force-dynamic";
export const metadata = { title: "Chat · CAIRN" };

/** "mcp__agentcash__search" -> "agentcash · search" */
function prettyTool(name?: string): string {
  if (!name) return "tool";
  return name.replace(/^mcp__/, "").replace(/__/g, " · ");
}

/** Raw monospace fallback for text that MDX can't parse. */
function RawText({ text }: { text: string }) {
  return (
    <pre className="overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface px-4 py-4 font-mono text-[0.8125rem] leading-relaxed text-text">
      {text}
    </pre>
  );
}

/**
 * Render a `text` step as real markdown prose.
 *
 * Research answers often lead with YAML frontmatter, so strip it with
 * gray-matter first, then serialize through the same next-mdx-remote
 * pipeline the vault uses. MDX parsing is stricter than markdown
 * (curly braces / angle brackets throw), so any failure falls back to a
 * raw <pre> rather than crashing the page.
 */
async function TextStep({ text }: { text: string }) {
  let body = text;
  try {
    body = matter(text).content.trim() || text;
  } catch {
    body = text;
  }

  try {
    const source = await serialize(body);
    return <MDXContent source={source} />;
  } catch {
    return <RawText text={body} />;
  }
}

async function Step({ step }: { step: PonchoStep }) {
  if (step.kind === "tool") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted">
        <span aria-hidden className="text-accent">
          ✓
        </span>
        <span className="font-mono text-accent-soft">
          {prettyTool(step.name)}
        </span>
      </div>
    );
  }
  if (step.kind === "reasoning") {
    return (
      <p className="border-l border-border-strong pl-3 text-xs italic leading-relaxed text-faint">
        {step.text}
      </p>
    );
  }
  if (!step.text) return null;
  return <TextStep text={step.text} />;
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let transcript: Awaited<ReturnType<typeof getChat>> | null = null;
  let error = "";
  try {
    const apiKey = (await resolvePonchoKey()) ?? undefined;
    transcript = await getChat(id, apiKey);
  } catch (err) {
    error =
      err instanceof PonchoError ? err.message : "Could not load this chat.";
  }

  const finalText = (transcript?.messages ?? [])
    .filter((m) => m.role === "assistant")
    .flatMap((m) => m.steps)
    .filter((s) => s.kind === "text" && s.text)
    .map((s) => s.text)
    .join("")
    .trim();

  return (
    <AppShell
      title="Chat"
      breadcrumb={
        <Link href="/poncho" className="text-muted transition-colors hover:text-text">
          Poncho
        </Link>
      }
    >
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-text">Chat</h1>
          {transcript && (
            <p className="mt-1 font-mono text-xs text-faint">
              {transcript.status}
            </p>
          )}
        </div>
        {finalText && <ChatActions markdown={finalText} />}
      </header>

      {error ? (
        <div className="rounded-xl border border-accent-dim/40 bg-accent/[0.06] px-4 py-3 text-sm leading-relaxed text-accent-soft">
          {error}
        </div>
      ) : !transcript || transcript.messages.length === 0 ? (
        <p className="text-sm text-muted">
          This chat doesn&apos;t have any content yet.
        </p>
      ) : (
        <div className="space-y-7">
          {transcript.messages.map((m, mi) => {
            const isAssistant = m.role !== "user";
            return (
              <div
                key={mi}
                className={
                  isAssistant
                    ? "rounded-r-xl border-l border-accent-dim/40 bg-accent/[0.03] py-3 pl-4 pr-3"
                    : ""
                }
              >
                {isAssistant ? (
                  <div className="mb-2 flex items-center gap-2">
                    <Image
                      src="/poncho-mark.svg"
                      alt=""
                      width={18}
                      height={18}
                      aria-hidden
                      className="opacity-90"
                    />
                    <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-accent-soft">
                      Poncho
                    </span>
                  </div>
                ) : (
                  <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
                    You
                  </p>
                )}
                <div className="space-y-2">
                  {m.steps.map((s, si) => (
                    <Step key={si} step={s} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
