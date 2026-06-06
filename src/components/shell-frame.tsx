"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/topbar";

const SIDEBAR_WIDTH = "16rem"; // w-64

/**
 * ShellFrame — client layout scaffold for <AppShell>.
 * Owns the responsive sidebar: fixed full-height rail on lg+, off-canvas
 * drawer on small screens. The server-rendered sidebar tree is passed in via
 * the `sidebar` prop so data-fetching stays on the server.
 */
export function ShellFrame({
  sidebar,
  title,
  breadcrumb,
  children,
}: {
  sidebar: ReactNode;
  title?: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Esc closes the drawer; lock scroll while it's open.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      {/* ---- Desktop sidebar: fixed, full height ---- */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-surface lg:block"
        style={{ width: SIDEBAR_WIDTH }}
      >
        {sidebar}
      </aside>

      {/* ---- Mobile drawer ---- */}
      {drawerOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm [animation:cairn-fade-in_150ms_ease-out]"
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 border-r border-border-strong bg-surface shadow-2xl shadow-black/50 [animation:cairn-rise-in_180ms_ease-out]"
            style={{ width: SIDEBAR_WIDTH }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* ---- Content column ---- */}
      <div className="lg:pl-64">
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export default ShellFrame;
