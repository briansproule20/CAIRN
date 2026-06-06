"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings, ChevronDown, Home } from "lucide-react";
import { SidebarTree } from "@/components/sidebar-tree";
import type { TreeNode } from "@/lib/repo/nodes";

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
          <li key={chat.id}>
            <Link
              href={`/chats/${chat.id}`}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent-soft"
                  : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span
                aria-hidden
                className={`h-1 w-1 shrink-0 rounded-full transition-colors ${
                  active ? "bg-accent" : "bg-border-strong group-hover:bg-accent-dim"
                }`}
              />
              <span className="truncate">{chat.title}</span>
            </Link>
          </li>
        );
      })}
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
