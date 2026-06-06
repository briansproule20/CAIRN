"use client";

import { useEffect, useRef, useState } from "react";
import { Check, File, Folder } from "lucide-react";
import { ChatActions } from "@/components/chat-actions";
import { HtmlSave } from "@/components/html-save";
import { MediaSave } from "@/components/media-save";
import { SandboxedHtml } from "@/components/sandboxed-html";
import { NodeMedia } from "@/components/vault/node-media";
import { type MediaArtifact } from "@/lib/poncho";

type Mode = "research" | "write" | "format" | "media" | "build";

interface TreeNode {
  id: string;
  parentId: string | null;
  slug: string;
  title: string;
  kind: "folder" | "entry";
}

/** Depth-first list of folders AND entries for the context picker. */
function orderedNodes(tree: TreeNode[]): { node: TreeNode; depth: number }[] {
  const byParent = new Map<string | null, TreeNode[]>();
  for (const n of tree) {
    const key = n.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(n);
  }
  const out: { node: TreeNode; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = byParent.get(parentId) ?? [];
    // Folders first, then entries, for a stable, scannable tree.
    const sorted = [...children].sort((a, b) =>
      a.kind === b.kind ? 0 : a.kind === "folder" ? -1 : 1
    );
    for (const c of sorted) {
      out.push({ node: c, depth });
      if (c.kind === "folder") walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

type MediaType = "image" | "meme" | "soundtrack" | "video";

interface MediaTypeConfig {
  id: MediaType;
  label: string;
  placeholder: string;
  cta: string;
}

const MEDIA_TYPES: MediaTypeConfig[] = [
  {
    id: "image",
    label: "Image",
    placeholder:
      "Describe the image…\n\ne.g. A misty stone cairn at dawn on a Scottish hillside, painterly.",
    cta: "Generate image",
  },
  {
    id: "meme",
    label: "Meme",
    placeholder:
      "Describe the meme…\n\ne.g. Distracted-boyfriend meme about choosing MDX over Notion.",
    cta: "Generate meme",
  },
  {
    id: "soundtrack",
    label: "Soundtrack",
    placeholder:
      "Describe the soundtrack…\n\ne.g. A slow, warm ambient loop for a late-night writing session.",
    cta: "Generate soundtrack",
  },
  {
    id: "video",
    label: "Video",
    placeholder:
      "Describe the video…\n\ne.g. A 5-second loop of rain on a window, cozy and dim.",
    cta: "Generate video",
  },
];

interface ModeConfig {
  id: Mode;
  label: string;
  blurb: string;
  placeholder: string;
  cta: string;
}

const MODES: ModeConfig[] = [
  {
    id: "research",
    label: "Research",
    blurb:
      "Hand Poncho a topic. It uses its own tools (web, scraping, x402 data) and returns a sourced vault entry in MDX.",
    placeholder:
      "What should Poncho research?\n\ne.g. The history and lore of the Elden Ring Lands Between, focused on the Erdtree.",
    cta: "Research topic",
  },
  {
    id: "write",
    label: "Write copy",
    blurb:
      "Give Poncho a brief and it drafts clean copy — summaries, blurbs, intros, anything.",
    placeholder:
      "Describe the copy you want.\n\ne.g. A 150-word, warm intro paragraph for a cooking vault about sourdough.",
    cta: "Write copy",
  },
  {
    id: "format",
    label: "Format copy",
    blurb:
      "Paste text. Poncho adds Markdown formatting — headings, lists, emphasis — without changing a word.",
    placeholder:
      "Paste your text here…\n\nPoncho returns the same words with Markdown structure layered on.",
    cta: "Format text",
  },
];

const BUILD_MODE: ModeConfig = {
  id: "build",
  label: "Build artifact",
  blurb:
    "Hand Poncho a brief and it builds a self-contained, interactive HTML artifact. Optionally steer the look with a design language and ground it in vault context.",
  placeholder:
    "Describe the artifact to build…\n\ne.g. An interactive timeline of the project's milestones with hover detail cards.",
  cta: "Build artifact",
};

const MEDIA_MODE: ModeConfig = {
  id: "media",
  label: "Media",
  blurb:
    "Hand Poncho a prompt and it generates media — an image, a meme, a soundtrack, or a short video. Generation can take a few minutes; watch it work below.",
  placeholder: "Describe the media…",
  cta: "Generate",
};

const emptyInputs: Record<Mode, string> = {
  research: "",
  write: "",
  format: "",
  media: "",
  build: "",
};

interface Step {
  kind: "reasoning" | "tool" | "text";
  text?: string;
  name?: string;
  state?: string;
  done?: boolean;
}

/** Make a raw tool name readable: "mcp__agentcash__search" -> "agentcash · search". */
function prettyTool(name?: string): string {
  if (!name) return "tool";
  const cleaned = name.replace(/^mcp__/, "").replace(/__/g, " · ");
  return cleaned;
}

export function PonchoWorkspace() {
  const [mode, setMode] = useState<Mode>("research");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [inputs, setInputs] = useState<Record<Mode, string>>(emptyInputs);
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState("");
  const [media, setMedia] = useState<MediaArtifact[]>([]);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);

  // Build-mode state: design language, vault context selection, and the tree.
  const [designLanguage, setDesignLanguage] = useState("");
  const [contextIds, setContextIds] = useState<Set<string>>(new Set());
  const [tree, setTree] = useState<TreeNode[] | null>(null);

  const isMedia = mode === "media";
  const isBuild = mode === "build";

  // Lazily load the vault tree the first time Build mode is opened.
  useEffect(() => {
    if (mode !== "build" || tree !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/nodes/tree");
        const data = await res.json();
        if (!cancelled) setTree(Array.isArray(data.tree) ? data.tree : []);
      } catch {
        if (!cancelled) setTree([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, tree]);

  const nodeList = orderedNodes(tree ?? []);

  function toggleContext(id: string) {
    setContextIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  const activeMediaType = MEDIA_TYPES.find((t) => t.id === mediaType)!;
  const active = isMedia
    ? {
        ...MEDIA_MODE,
        placeholder: activeMediaType.placeholder,
        cta: activeMediaType.cta,
      }
    : isBuild
      ? BUILD_MODE
      : MODES.find((m) => m.id === mode)!;
  const input = inputs[mode];

  const ALL_TABS: ModeConfig[] = [...MODES, BUILD_MODE, MEDIA_MODE];

  // Live answer text accumulates from the streamed text parts.
  const liveText = steps
    .filter((s) => s.kind === "text" && s.text)
    .map((s) => s.text)
    .join("");
  const activity = steps.filter((s) => s.kind !== "text");

  function setInput(value: string) {
    setInputs((prev) => ({ ...prev, [mode]: value }));
  }

  function handleFrame(frame: string) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length === 0) return;
    let data: {
      status?: string;
      steps?: Step[];
      result?: string;
      partial?: string;
      error?: string;
      chatId?: string;
      media?: MediaArtifact[];
    };
    try {
      data = JSON.parse(dataLines.join("\n"));
    } catch {
      return;
    }
    // Media artifacts can arrive on either progress or done frames. Track the
    // latest non-empty array so the result area shows what Poncho produced.
    if (Array.isArray(data.media) && data.media.length > 0) {
      setMedia(data.media);
    }
    if (event === "progress") {
      if (data.status) setStatus(data.status);
      if (Array.isArray(data.steps)) setSteps(data.steps);
      // keep the activity log scrolled to the latest step
      requestAnimationFrame(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
      });
    } else if (event === "done") {
      setResult(data.result || "");
      setStatus("finished");
      // The server already recorded this chat; tell the sidebar to refresh.
      window.dispatchEvent(new Event("cairn:chats-updated"));
    } else if (event === "timeout") {
      setError(
        "Poncho ran past the time limit — here's what it produced so far."
      );
      if (data.partial) setResult(data.partial);
    } else if (event === "error") {
      setError(data.error || "Poncho error.");
    }
  }

  async function run() {
    if (loading || input.trim().length === 0) return;
    setLoading(true);
    setError("");
    setSteps([]);
    setResult("");
    setMedia([]);
    setStatus("running");
    try {
      const res = await fetch("/api/poncho/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isMedia
            ? { mode, mediaType, input }
            : isBuild
              ? {
                  mode,
                  input,
                  designLanguage: designLanguage.trim() || undefined,
                  contextIds: [...contextIds],
                }
              : { mode, input }
        ),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Poncho request failed.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) !== -1) {
          const frame = buf.slice(0, i);
          buf = buf.slice(i + 2);
          if (frame.trim()) handleFrame(frame);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  const showWorking = loading || activity.length > 0 || (liveText && !result);

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div
        role="tablist"
        aria-label="Poncho modes"
        className="inline-flex rounded-xl border border-border bg-surface p-1"
      >
        {ALL_TABS.map((m) => {
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={selected}
              disabled={loading}
              onClick={() => {
                setMode(m.id);
                setError("");
              }}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                selected
                  ? "bg-accent/15 text-accent-soft"
                  : "text-muted hover:text-text"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-muted">
        {active.blurb}
      </p>

      {/* Media sub-type selector */}
      {isMedia && (
        <div
          role="radiogroup"
          aria-label="Media type"
          className="inline-flex flex-wrap gap-2"
        >
          {MEDIA_TYPES.map((t) => {
            const selected = t.id === mediaType;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={loading}
                onClick={() => {
                  setMediaType(t.id);
                  setError("");
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selected
                    ? "border-accent-dim bg-accent/15 text-accent-soft"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Build mode: design language + vault context picker */}
      {isBuild && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="poncho-design-language"
              className="block font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint"
            >
              Design language{" "}
              <span className="normal-case tracking-normal text-faint/70">
                (optional)
              </span>
            </label>
            <input
              id="poncho-design-language"
              value={designLanguage}
              onChange={(e) => setDesignLanguage(e.target.value)}
              disabled={loading}
              placeholder="e.g. brutalist, mono, high-contrast"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <p className="flex items-center justify-between font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
              <span>
                Vault context{" "}
                <span className="normal-case tracking-normal text-faint/70">
                  (optional)
                </span>
              </span>
              {contextIds.size > 0 && (
                <span className="text-accent-soft">{contextIds.size} selected</span>
              )}
            </p>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-surface">
              {tree === null ? (
                <p className="px-2.5 py-2 font-mono text-[0.6875rem] text-faint">
                  Loading…
                </p>
              ) : nodeList.length === 0 ? (
                <p className="px-2.5 py-2 font-mono text-[0.6875rem] text-faint">
                  Vault is empty.
                </p>
              ) : (
                nodeList.map(({ node: n, depth }) => {
                  const selected = contextIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      disabled={loading}
                      onClick={() => toggleContext(n.id)}
                      style={{ paddingLeft: `${0.625 + depth * 0.85}rem` }}
                      className={`flex w-full items-center justify-between gap-2 py-1.5 pr-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                        selected
                          ? "bg-accent/10 text-accent-soft"
                          : "text-muted hover:bg-surface-2"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {n.kind === "folder" ? (
                          <Folder className="h-3.5 w-3.5 shrink-0 text-accent-dim" />
                        ) : (
                          <File className="h-3.5 w-3.5 shrink-0 text-faint" />
                        )}
                        <span className="truncate">{n.title}</span>
                      </span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
          spellCheck={false}
          disabled={loading}
          placeholder={active.placeholder}
          rows={7}
          className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-text caret-accent outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={loading || input.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
          >
            {loading && (
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-base/40 border-t-base"
              />
            )}
            {loading ? "Poncho is working…" : active.cta}
          </button>
          <span className="font-mono text-[0.6875rem] text-faint">
            ⌘↵ to run
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-accent-dim/40 bg-accent/[0.06] px-4 py-3 text-sm leading-relaxed text-accent-soft"
        >
          {error}
        </div>
      )}

      {/* Live activity — watch Poncho work */}
      {showWorking && (
        <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                loading ? "animate-pulse bg-accent" : "bg-accent-dim"
              }`}
            />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
              {loading ? "Poncho is working" : "Trace"}
            </span>
          </div>

          {activity.length > 0 && (
            <div
              ref={logRef}
              className="max-h-56 space-y-2 overflow-y-auto pr-1"
            >
              {activity.map((s, i) =>
                s.kind === "tool" ? (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-muted"
                  >
                    {s.done ? (
                      <span aria-hidden className="text-accent">
                        ✓
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="h-3 w-3 animate-spin rounded-full border-2 border-accent-dim/40 border-t-accent-dim"
                      />
                    )}
                    <span className="font-mono text-accent-soft">
                      {prettyTool(s.name)}
                    </span>
                    {!s.done && <span className="text-faint">running…</span>}
                  </div>
                ) : (
                  <p
                    key={i}
                    className="border-l border-border-strong pl-3 text-xs italic leading-relaxed text-faint"
                  >
                    {s.text}
                  </p>
                )
              )}
            </div>
          )}

          {liveText && !result && (
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-base px-3 py-3 font-mono text-[0.8125rem] leading-relaxed text-text">
              {liveText}
            </pre>
          )}
        </div>
      )}

      {/* Generated media */}
      {media.length > 0 && (
        <div className="space-y-3 [animation:cairn-rise-in_180ms_ease-out]">
          <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Generated media
          </h2>
          <div className="space-y-5">
            {media.map((m, i) => (
              <div key={`${m.url}-${i}`} className="space-y-2">
                <NodeMedia
                  url={m.url}
                  mediaType={m.mimeType || m.kind}
                  title={m.title}
                  description={m.description}
                />
                <div className="flex justify-end">
                  <MediaSave artifact={m} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated artifact (build mode) — render the HTML sandboxed. */}
      {result && isBuild && (
        <div className="space-y-3 [animation:cairn-rise-in_180ms_ease-out]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
              Generated artifact
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.6875rem] text-faint">
                Saved to Artifacts
              </span>
              <HtmlSave html={result} defaultTitle={input.trim() || "Generated artifact"} />
            </div>
          </div>
          <SandboxedHtml html={result} title="Generated artifact" />
        </div>
      )}

      {/* Final result (text). Hidden in media/build modes — those render above. */}
      {result && !isMedia && !isBuild && (
        <div className="space-y-3 [animation:cairn-rise-in_180ms_ease-out]">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
              Result
            </h2>
            <ChatActions markdown={result} />
          </div>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface px-4 py-4 font-mono text-[0.8125rem] leading-relaxed text-text">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}

export default PonchoWorkspace;
