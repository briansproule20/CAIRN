"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Settings,
  ChevronDown,
  Home,
  Info,
  X,
  ImageIcon,
  AudioLines,
  Video,
  Code2,
} from "lucide-react";
import { SidebarTree } from "@/components/sidebar-tree";
import type { TreeNode } from "@/lib/repo/nodes";
import type { Artifact } from "@/lib/db/schema";

interface ChatSummary {
  id: string;
  title: string;
  mode?: string;
}

/**
 * SidebarNav — client nav with three grouped sections (shadcn-style, flat):
 *   Tools  → Poncho, Tags
 *   Vault  → categories (permanent entries)
 *   Chats  → live Poncho conversations, polled from /api/poncho/chats
 * Plus a "+ New Entry" / "+ New Chat" action row.
 */
export function SidebarNav({ tree }: { tree: TreeNode[] }) {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pt-1 pb-4">
        {/* Vault */}
        <Group label="Vault">
          <NavRow
            href="/"
            active={pathname === "/"}
            icon={<Home className="h-3.5 w-3.5 shrink-0" />}
          >
            Home
          </NavRow>
          <SidebarTree nodes={tree} />
        </Group>

        {/* Tools */}
        <Group label="Tools">
          <NavRow
            href="/poncho"
            active={pathname === "/poncho"}
            icon={
              <Image
                src="/poncho-mark.svg"
                alt=""
                width={18}
                height={19}
                className="-my-0.5 shrink-0"
              />
            }
          >
            Poncho
          </NavRow>
          <NavRow
            href="/tags"
            active={pathname === "/tags" || pathname.startsWith("/tags/")}
            icon={<TagIcon />}
          >
            Tags
          </NavRow>
          <NavRow
            href="/info"
            active={pathname === "/info"}
            icon={<Info className="h-3.5 w-3.5 shrink-0" />}
          >
            Info
          </NavRow>
          <NavRow
            href="/settings"
            active={pathname === "/settings"}
            icon={<Settings className="h-3.5 w-3.5 shrink-0" />}
          >
            Settings
          </NavRow>
        </Group>

        {/* Chats */}
        <Group label="Chats">
          <ChatsNav pathname={pathname} />
        </Group>

        {/* Artifacts — ephemeral media Poncho generated, awaiting promotion. */}
        <Group label="Artifacts">
          <ArtifactsNav pathname={pathname} />
        </Group>
      </div>

      {/* New Entry / New Chat — pinned to the bottom */}
      <div className="flex shrink-0 gap-2 border-t border-border p-3">
        <Link
          href="/editor"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs font-medium text-text transition-colors hover:border-accent-dim hover:bg-accent/10 hover:text-accent-soft"
        >
          <span aria-hidden className="text-accent">
            +
          </span>
          New Entry
        </Link>
        <Link
          href="/poncho"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs font-medium text-text transition-colors hover:border-accent-dim hover:bg-accent/10 hover:text-accent-soft"
        >
          <span aria-hidden className="text-accent">
            +
          </span>
          New Chat
        </Link>
      </div>
    </nav>
  );
}

function Group({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-2 pb-1.5 pt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint transition-colors hover:text-muted"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && children}
    </div>
  );
}

function NavRow({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
        active
          ? "bg-accent/10 text-accent-soft"
          : "text-muted hover:bg-surface-2 hover:text-text"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

/** Chats — only the ones CAIRN generated, tracked locally. */
function ChatsNav({ pathname }: { pathname: string }) {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/poncho/chats");
        const data = await res.json();
        if (alive) setChats(Array.isArray(data.chats) ? data.chats : []);
      } catch {
        if (alive) setChats([]);
      }
    }
    load();
    const t = setInterval(load, 20_000);
    const onUpdated = () => load();
    window.addEventListener("cairn:chats-updated", onUpdated);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("cairn:chats-updated", onUpdated);
    };
  }, []);

  // Stop tracking a chat in the CAIRN DB (the Poncho conversation itself is
  // untouched). Optimistic — if the request fails it returns on the next poll.
  async function remove(id: string) {
    setChats((prev) => prev?.filter((c) => c.id !== id) ?? prev);
    try {
      await fetch(`/api/poncho/chats/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      /* will reappear on the next poll */
    }
  }

  if (chats === null) {
    return (
      <p className="px-2 py-1 font-mono text-[0.6875rem] text-faint">Loading…</p>
    );
  }
  if (chats.length === 0) {
    return (
      <p className="px-2 py-1 text-xs leading-relaxed text-muted">
        No chats yet. Use{" "}
        <span className="text-accent-dim">+ New Chat</span> to start one.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {chats.slice(0, 15).map((chat) => {
        const active = pathname === `/chats/${chat.id}`;
        return (
          <li key={chat.id} className="group/chat relative">
            <Link
              href={`/chats/${chat.id}`}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-7 text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent-soft"
                  : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span
                aria-hidden
                className={`h-1 w-1 shrink-0 rounded-full transition-colors ${
                  active
                    ? "bg-accent"
                    : "bg-border-strong group-hover/chat:bg-accent-dim"
                }`}
              />
              <span className="truncate">{chat.title}</span>
            </Link>
            <button
              type="button"
              onClick={() => remove(chat.id)}
              aria-label={`Remove ${chat.title}`}
              title="Remove from CAIRN"
              className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded p-1 text-faint transition-colors hover:bg-surface-2 hover:text-accent-soft group-hover/chat:block"
            >
              <X className="h-3 w-3" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** A tiny kind glyph for non-image artifacts in the sidebar. */
function ArtifactKindIcon({ kind }: { kind: string }) {
  const cls = "h-3.5 w-3.5 shrink-0 text-accent-dim";
  if (kind === "audio") return <AudioLines className={cls} />;
  if (kind === "video") return <Video className={cls} />;
  if (kind === "html") return <Code2 className={cls} />;
  return <ImageIcon className={cls} />;
}

/** Artifacts — ephemeral media captured from Poncho, polled like Chats. */
function ArtifactsNav({ pathname }: { pathname: string }) {
  const [artifacts, setArtifacts] = useState<Artifact[] | null>(null);
  const active = pathname === "/artifacts" || pathname.startsWith("/artifacts/");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/artifacts");
        const data = await res.json();
        if (alive)
          setArtifacts(Array.isArray(data.artifacts) ? data.artifacts : []);
      } catch {
        if (alive) setArtifacts([]);
      }
    }
    load();
    const t = setInterval(load, 20_000);
    const onUpdated = () => load();
    window.addEventListener("cairn:artifacts-updated", onUpdated);
    window.addEventListener("cairn:chats-updated", onUpdated);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("cairn:artifacts-updated", onUpdated);
      window.removeEventListener("cairn:chats-updated", onUpdated);
    };
  }, []);

  if (artifacts === null) {
    return (
      <p className="px-2 py-1 font-mono text-[0.6875rem] text-faint">Loading…</p>
    );
  }
  if (artifacts.length === 0) {
    return (
      <p className="px-2 py-1 text-xs leading-relaxed text-muted">
        No artifacts yet — generate media in{" "}
        <span className="text-accent-dim">Poncho</span>.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {artifacts.slice(0, 12).map((a) => (
        <li key={a.id}>
          <Link
            href="/artifacts"
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-2 text-sm transition-colors ${
              active
                ? "bg-accent/10 text-accent-soft"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {a.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.url}
                alt=""
                className="h-4 w-4 shrink-0 rounded-sm border border-border object-cover"
              />
            ) : (
              <ArtifactKindIcon kind={a.kind} />
            )}
            <span className="truncate">
              {a.title || `Generated ${a.kind}`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TagIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 7.5h.01M3 12V4a1 1 0 0 1 1-1h8l9 9-8 8z" />
    </svg>
  );
}

export default SidebarNav;
