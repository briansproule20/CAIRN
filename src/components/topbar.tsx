"use client";

import type { ReactNode } from "react";
import { SEARCH_OPEN_EVENT } from "@/components/command-palette";

/**
 * Topbar — client component. Slim bar across the top of the content area.
 *
 * Props:
 *  - title?:      string | ReactNode — page title / current location.
 *  - breadcrumb?: ReactNode          — optional breadcrumb element rendered
 *                                       before the title (e.g. links).
 *  - onMenuClick?: () => void        — opens the mobile sidebar (AppShell wires
 *                                       this; the button only shows on small screens).
 *
 * The search button dispatches the global `cairn:open-search` window event,
 * which <CommandPalette> listens for.
 */
export function Topbar({
  title,
  breadcrumb,
  onMenuClick,
}: {
  title?: ReactNode;
  breadcrumb?: ReactNode;
  onMenuClick?: () => void;
}) {
  function openSearch() {
    window.dispatchEvent(new CustomEvent(SEARCH_OPEN_EVENT));
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-base/85 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu toggle */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      )}

      {/* Breadcrumb / title */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        {breadcrumb}
        {title && (
          <span className="truncate font-serif text-[0.95rem] font-medium text-text">
            {title}
          </span>
        )}
      </div>

      {/* Search trigger */}
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search the archive"
        aria-keyshortcuts="Meta+K Control+K"
        className="group flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-muted transition-colors hover:border-border-strong hover:text-text"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 text-faint transition-colors group-hover:text-accent-dim"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem] text-faint sm:flex">
          <span className="text-[0.7rem] leading-none">⌘</span>K
        </kbd>
      </button>
    </header>
  );
}

export default Topbar;
