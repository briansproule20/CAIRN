/**
 * Poncho hosted-agent client (server-only).
 *
 * Talks to the hosted Poncho API at https://tryponcho.com. Your pk_poncho_ key
 * identifies the agent — there is nothing to self-deploy.
 *
 *   1. POST {BASE}/api/v1/chats            -> create chat + send first message
 *      returns { chatId, commandId, status } (202, async)
 *   2. GET  {BASE}/api/v1/chats/:id/result -> poll until status "finished"
 *      then read the latest assistant message's text parts
 *
 * Auth: Authorization: Bearer ${PONCHO_API_KEY}
 * Config (.env.local): PONCHO_API_KEY (required), PONCHO_API_BASE (optional
 * override, defaults to https://tryponcho.com), PONCHO_MODEL (optional).
 *
 * The Poncho agent holds Firecrawl + an AgentCash wallet, so all scraping /
 * x402 research is delegated to it.
 */

const DEFAULT_BASE = "https://tryponcho.com";
const POLL_INTERVAL_MS = 2_000;
const DEFAULT_TIMEOUT_MS = 115_000;

export class PonchoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PonchoError";
  }
}

function getConfig(apiKeyOverride?: string): {
  base: string;
  apiKey: string;
  model?: string;
} {
  // BYOPK: prefer the per-user key passed in; fall back to the env key.
  const apiKey = apiKeyOverride || process.env.PONCHO_API_KEY;
  if (!apiKey) {
    throw new PonchoError(
      "No Poncho key available. Add your Poncho key (pk_poncho_…) in onboarding or Settings."
    );
  }
  const base = (process.env.PONCHO_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
  const model = process.env.PONCHO_MODEL || undefined;
  return { base, apiKey, model };
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function newId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback: timestamp + counter-ish entropy (runtime only).
  return `cairn-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}

interface CreateChatResult {
  chatId: string;
  commandId?: string;
}

async function createChat(
  base: string,
  apiKey: string,
  model: string | undefined,
  text: string,
  signal: AbortSignal
): Promise<CreateChatResult> {
  const body: Record<string, unknown> = {
    messageId: newId(),
    text,
  };
  if (model) body.options = { model };

  const res = await fetch(`${base}/api/v1/chats`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 401 || res.status === 403) {
    throw new PonchoError(
      "Poncho rejected the API key (401/403). Check PONCHO_API_KEY in .env.local."
    );
  }
  if (!res.ok) {
    throw new PonchoError(
      `Poncho could not start a chat (${res.status}). ${await safeText(res)}`.trim()
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    chatId?: string;
    id?: string;
    commandId?: string;
    state?: string;
    status?: string;
    error?: { message?: string } | string;
  };

  if (data.status === "rejected" || data.state === "rejected") {
    const msg =
      (typeof data.error === "object" ? data.error?.message : data.error) ??
      "Poncho rejected the request.";
    throw new PonchoError(msg);
  }

  const chatId = data.chatId ?? data.id;
  if (!chatId) throw new PonchoError("Poncho did not return a chatId.");
  return { chatId, commandId: data.commandId };
}

interface PonchoMessage {
  role?: string;
  ordinal?: number;
  parts?: unknown;
  content?: unknown;
  text?: unknown;
}

/** Pull readable text out of the latest assistant message. */
function extractAssistantText(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  const assistants = (messages as PonchoMessage[])
    .filter((m) => m?.role === "assistant")
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
  const last = assistants[assistants.length - 1];
  if (!last) return "";

  const collected: string[] = [];
  const parts = last.parts;
  if (Array.isArray(parts)) {
    for (const p of parts) {
      if (typeof p === "string") {
        collected.push(p);
      } else if (p && typeof p === "object") {
        const part = p as { type?: string; text?: unknown; content?: unknown };
        if (typeof part.text === "string") collected.push(part.text);
        else if (part.type === "text" && typeof part.content === "string")
          collected.push(part.content);
      }
    }
  }
  if (collected.length === 0) {
    if (typeof last.text === "string") collected.push(last.text);
    else if (typeof last.content === "string") collected.push(last.content);
  }
  return collected.join("").trim();
}

async function pollResult(
  base: string,
  apiKey: string,
  chatId: string,
  commandId: string | undefined,
  signal: AbortSignal,
  timeoutMs: number
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const url =
    `${base}/api/v1/chats/${chatId}/result` +
    (commandId ? `?commandId=${encodeURIComponent(commandId)}` : "");

  // Small initial delay — the run was just queued.
  await sleep(POLL_INTERVAL_MS, signal);

  while (true) {
    const res = await fetch(url, { headers: authHeaders(apiKey), signal });
    if (!res.ok) {
      throw new PonchoError(
        `Poncho result poll failed (${res.status}). ${await safeText(res)}`.trim()
      );
    }
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      messages?: unknown;
    };

    if (data.status === "finished" || data.status === "idle") {
      const text = extractAssistantText(data.messages);
      if (text) return text;
      if (data.status === "finished") {
        throw new PonchoError("Poncho finished but returned no text.");
      }
    }

    if (Date.now() > deadline) {
      throw new PonchoError("Poncho timed out before replying.");
    }
    await sleep(POLL_INTERVAL_MS, signal);
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

/**
 * Send one prompt to the Poncho agent and return its final text reply.
 * Creates a chat, then polls for the result.
 */
export async function askPoncho(
  message: string,
  opts: { timeoutMs?: number; apiKey?: string } = {}
): Promise<string> {
  const { base, apiKey, model } = getConfig(opts.apiKey);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { chatId, commandId } = await createChat(
      base,
      apiKey,
      model,
      message,
      controller.signal
    );
    return await pollResult(
      base,
      apiKey,
      chatId,
      commandId,
      controller.signal,
      timeoutMs
    );
  } catch (err) {
    if (err instanceof PonchoError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new PonchoError("Poncho timed out before replying.");
    }
    const msg = err instanceof Error ? err.message : String(err);
    throw new PonchoError(`Could not reach Poncho: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }
}

/** Strip a leading/trailing ``` or ```markdown fence if Poncho wraps the file. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:mdx|markdown|md)?\s*\n([\s\S]*?)\n```$/;
  const m = trimmed.match(fence);
  return (m ? m[1] : trimmed).trim();
}

/**
 * Hand raw notes to Poncho and get back a single, clean CAIRN vault entry
 * as MDX (YAML frontmatter + structured Markdown body).
 */
export async function formatNotesToMdx(
  notes: string,
  opts: { category?: string; apiKey?: string } = {}
): Promise<string> {
  const prompt = `You are a Markdown formatter. Your ONLY job is to add Markdown syntax to the user's text below. You must preserve every single word of the original text EXACTLY as written.

Return ONLY the formatted Markdown of the same text. No YAML frontmatter. No preamble. No commentary. No surrounding code fences.

What you MAY add (Markdown syntax only):
- Headings (#, ##, ###) where the text clearly introduces a section.
- Bullet lists and numbered lists for things that are already enumerations.
- Bold (**) and italic (*) emphasis on words already present in the text.
- Blockquotes (>) for quoted passages already present.
- Code blocks and inline code (\`) for code or code-like content already present.
- Turn bare URLs that are already in the text into Markdown links.

What you MUST NOT do:
- DO NOT change, rewrite, paraphrase, tighten, correct, translate, reorder, add, or remove ANY of the user's words.
- DO NOT fix grammar, spelling, or punctuation.
- DO NOT add new sentences, headings text, or list items that aren't in the original words.
- The prose must come back identical to the input except for the Markdown syntax layered around it.

TEXT TO FORMAT:
${notes}`;

  const reply = await askPoncho(prompt, { apiKey: opts.apiKey });
  return stripCodeFence(reply);
}

/**
 * Enrich an existing entry. Passes the current content (plain text) plus the
 * user's instructions to Poncho and returns improved Markdown.
 */
export async function enrichEntry(
  content: string,
  instructions: string,
  opts: { apiKey?: string } = {}
): Promise<string> {
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

  const reply = await askPoncho(prompt, { apiKey: opts.apiKey });
  return stripCodeFence(reply);
}

/**
 * Ask Poncho to research a topic using its own tools (Firecrawl, x402
 * endpoints, web access) and return a structured research brief in Markdown.
 */
export async function researchTopic(
  topic: string,
  opts: { category?: string; apiKey?: string } = {}
): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const categoryLine = opts.category
    ? opts.category
    : "<best-guess lowercase-hyphenated category>";

  const prompt = `Research the following topic using your available tools (web search, scraping, data lookups). Then write ONE well-organized CAIRN vault entry in MDX summarizing what you found.

Return ONLY the MDX file contents — no preamble, no commentary, no surrounding code fences.

Begin with YAML frontmatter exactly in this shape:
---
title: <concise descriptive title>
category: ${categoryLine}
tags: [<3 to 6 lowercase tags>]
status: draft
created: ${today}
updated: ${today}
sources:
  - <url>
  - <url>
---

Then the body as structured Markdown:
- Lead with a short overview, then "##" sections for the key facets.
- Be accurate and specific; cite only sources you actually consulted, and list their URLs in the "sources" frontmatter.
- Do NOT fabricate facts or sources. If something is uncertain, say so.

TOPIC TO RESEARCH:
${topic}`;

  const reply = await askPoncho(prompt, { apiKey: opts.apiKey });
  return stripCodeFence(reply);
}

/**
 * Ask Poncho to write copy from a brief/prompt. Returns clean Markdown.
 */
export async function writeCopy(
  brief: string,
  opts: { category?: string; apiKey?: string } = {}
): Promise<string> {
  const prompt = `Write copy based on the brief below. Return clean, ready-to-use Markdown only — no preamble, no commentary, no surrounding code fences.

Guidelines:
- Match the tone and length implied by the brief.
- Use headings, lists, and emphasis only where they genuinely help.
- Keep it tight and purposeful; no filler.${
    opts.category ? `\n- Intended for the "${opts.category}" context.` : ""
  }

BRIEF:
${brief}`;

  const reply = await askPoncho(prompt, { apiKey: opts.apiKey });
  return stripCodeFence(reply);
}

// ---------------------------------------------------------------------------
// Streaming: watch Poncho work (reasoning + tool calls + text) live.
// ---------------------------------------------------------------------------

export type PonchoMode = "research" | "write" | "format";

/**
 * Short, demarcated message sent to Poncho. We intentionally keep this brief
 * so the Poncho chat reads cleanly (just a research note + the topic) rather
 * than a wall of formatting instructions. CAIRN handles any MDX shaping later.
 */
export function buildPrompt(
  mode: PonchoMode,
  input: string,
  _opts: { category?: string } = {}
): string {
  const topic = input.trim();

  if (mode === "research") {
    return `CAIRN · research note
Topic: ${topic}

Research this using your tools, then reply with a clear markdown write-up — short overview, "##" sections, and any source URLs you used. Markdown only, no preamble.`;
  }

  if (mode === "format") {
    return `CAIRN · format request
Add Markdown syntax ONLY to the text below — preserve every word verbatim. You may add headings, bullet/numbered lists, bold/italic emphasis, blockquotes, code blocks/inline code, and turn bare URLs into Markdown links. DO NOT change, rewrite, paraphrase, tighten, correct, reorder, add, or remove any words; do not fix grammar or spelling. No YAML frontmatter, no preamble, no commentary. Reply with the formatted markdown of the same text only.

Text:
${topic}`;
  }

  return `CAIRN · copy request
${topic}

Write clean, ready-to-use markdown for this — match the implied tone and length. Markdown only, no preamble.`;
}

export interface PonchoStep {
  kind: "reasoning" | "tool" | "text";
  text?: string;
  name?: string;
  state?: string;
  done?: boolean;
}

export interface PonchoSnapshot {
  /** running | finished | pending | idle | timeout */
  status: string;
  steps: PonchoStep[];
  /** The Poncho chat id for this run (so CAIRN can track its own chats). */
  chatId?: string;
}

/** Normalize the latest assistant message's parts into UI-friendly steps. */
function normalizeSteps(messages: unknown): PonchoStep[] {
  if (!Array.isArray(messages)) return [];
  const assistants = (messages as PonchoMessage[])
    .filter((m) => m?.role === "assistant")
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0));
  const last = assistants[assistants.length - 1];
  if (!last || !Array.isArray(last.parts)) return [];

  const steps: PonchoStep[] = [];
  for (const raw of last.parts as Array<Record<string, unknown>>) {
    if (!raw || typeof raw !== "object") continue;
    const type = typeof raw.type === "string" ? raw.type : "";
    const state = typeof raw.state === "string" ? raw.state : undefined;
    if (type === "text" && typeof raw.text === "string") {
      steps.push({ kind: "text", text: raw.text, state, done: state === "done" });
    } else if (type === "reasoning" && typeof raw.text === "string") {
      steps.push({ kind: "reasoning", text: raw.text, state, done: state === "done" });
    } else if (
      typeof raw.toolName === "string" ||
      type === "dynamic-tool" ||
      type.startsWith("tool")
    ) {
      steps.push({
        kind: "tool",
        name: (typeof raw.toolName === "string" && raw.toolName) || type,
        state,
        done: state === "output-available" || state === "done",
      });
    }
  }
  return steps;
}

/**
 * The final answer is the trailing run of text parts — i.e. everything after
 * the last tool/reasoning step. Earlier text parts are interstitial narration
 * ("Let me fetch the article…"), which we drop.
 */
export function stepsToText(steps: PonchoStep[]): string {
  const tail: string[] = [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (s.kind === "text" && s.text) tail.unshift(s.text);
    else if (s.kind === "tool" || s.kind === "reasoning") break;
  }
  return stripCodeFence(tail.join("").trim());
}

/**
 * Stream a Poncho run: create a chat, then poll /result, yielding a snapshot
 * (status + normalized steps) after each poll until the run finishes. This is
 * how the UI shows reasoning + tool calls + text as they happen.
 */
export async function* streamPoncho(
  prompt: string,
  opts: { signal?: AbortSignal; timeoutMs?: number; apiKey?: string } = {}
): AsyncGenerator<PonchoSnapshot> {
  const { base, apiKey, model } = getConfig(opts.apiKey);
  const signal = opts.signal ?? new AbortController().signal;
  const timeoutMs = opts.timeoutMs ?? 300_000;

  const { chatId, commandId } = await createChat(
    base,
    apiKey,
    model,
    prompt,
    signal
  );
  const url =
    `${base}/api/v1/chats/${chatId}/result` +
    (commandId ? `?commandId=${encodeURIComponent(commandId)}` : "");
  const deadline = Date.now() + timeoutMs;

  await sleep(1200, signal);
  while (true) {
    const res = await fetch(url, { headers: authHeaders(apiKey), signal });
    if (!res.ok) {
      throw new PonchoError(
        `Poncho result poll failed (${res.status}). ${await safeText(res)}`.trim()
      );
    }
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      messages?: unknown;
    };
    const steps = normalizeSteps(data.messages);
    const status = data.status || "running";
    const hasText = steps.some(
      (s) => s.kind === "text" && s.text && s.text.trim().length > 0
    );
    // A completed run reports "finished", or settles to "idle" once Poncho's
    // sandbox goes quiet — treat idle-with-output as done so results come back.
    const terminal = status === "finished" || (status === "idle" && hasText);
    yield { status: terminal ? "finished" : status, steps, chatId };
    if (terminal) return;
    if (Date.now() > deadline) {
      yield { status: "timeout", steps, chatId };
      return;
    }
    await sleep(1500, signal);
  }
}

// ---------------------------------------------------------------------------
// Chats: list + fetch Poncho conversations so CAIRN can surface them.
// ---------------------------------------------------------------------------

export interface PonchoChatSummary {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  activityAt?: string;
  starred?: boolean;
}

/** List the agent's recent Poncho chats (newest activity first, no archived). */
export async function listChats(
  limit = 30,
  apiKeyOverride?: string
): Promise<PonchoChatSummary[]> {
  const { base, apiKey } = getConfig(apiKeyOverride);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${base}/api/v1/chats?limit=${limit}`, {
      headers: authHeaders(apiKey),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new PonchoError(`Could not list chats (${res.status}).`);
    }
    const data = (await res.json().catch(() => ({}))) as {
      chats?: Array<Record<string, unknown>>;
    };
    const chats = Array.isArray(data.chats) ? data.chats : [];
    return chats
      .filter((c) => c.id && !c.archived)
      .map((c) => ({
        id: String(c.id),
        title:
          typeof c.title === "string" && c.title.trim()
            ? c.title
            : "Untitled chat",
        createdAt: typeof c.createdAt === "string" ? c.createdAt : undefined,
        updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : undefined,
        activityAt: typeof c.activityAt === "string" ? c.activityAt : undefined,
        starred: Boolean(c.starred),
      }));
  } finally {
    clearTimeout(timer);
  }
}

/** Convert any message's parts into UI steps. */
function partsToSteps(parts: unknown): PonchoStep[] {
  if (!Array.isArray(parts)) return [];
  const steps: PonchoStep[] = [];
  for (const raw of parts as Array<Record<string, unknown>>) {
    if (!raw || typeof raw !== "object") continue;
    const type = typeof raw.type === "string" ? raw.type : "";
    const state = typeof raw.state === "string" ? raw.state : undefined;
    if (type === "text" && typeof raw.text === "string") {
      steps.push({ kind: "text", text: raw.text, state, done: state === "done" });
    } else if (type === "reasoning" && typeof raw.text === "string") {
      steps.push({
        kind: "reasoning",
        text: raw.text,
        state,
        done: state === "done",
      });
    } else if (
      typeof raw.toolName === "string" ||
      type === "dynamic-tool" ||
      type.startsWith("tool")
    ) {
      steps.push({
        kind: "tool",
        name: (typeof raw.toolName === "string" && raw.toolName) || type,
        state,
        done: state === "output-available" || state === "done",
      });
    }
  }
  return steps;
}

export interface PonchoChatMessage {
  role: string;
  steps: PonchoStep[];
}

export interface PonchoChatTranscript {
  status: string;
  messages: PonchoChatMessage[];
}

/** Fetch one chat's full transcript (all messages) for display in CAIRN. */
export async function getChat(
  chatId: string,
  apiKeyOverride?: string
): Promise<PonchoChatTranscript> {
  const { base, apiKey } = getConfig(apiKeyOverride);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(
      `${base}/api/v1/chats/${encodeURIComponent(chatId)}/result`,
      { headers: authHeaders(apiKey), signal: controller.signal }
    );
    if (!res.ok) {
      throw new PonchoError(`Could not load chat (${res.status}).`);
    }
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      messages?: Array<Record<string, unknown>>;
      snapshot?: { messages?: Array<Record<string, unknown>> };
    };
    // With no active run, top-level `messages` is empty and the full
    // transcript lives in `snapshot.messages` instead.
    const snapMsgs = data.snapshot?.messages;
    const raw =
      Array.isArray(data.messages) && data.messages.length > 0
        ? data.messages
        : Array.isArray(snapMsgs)
          ? snapMsgs
          : [];
    return {
      status: data.status || "idle",
      messages: raw
        .map((m) => ({
          role: typeof m.role === "string" ? m.role : "assistant",
          steps: partsToSteps(m.parts),
        }))
        .filter((m) => m.steps.length > 0),
    };
  } finally {
    clearTimeout(timer);
  }
}
