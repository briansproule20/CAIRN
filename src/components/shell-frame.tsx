"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Topbar } from "@/components/topbar";

const SIDEBAR_WIDTH = "16rem"; // w-64
const SIDEBAR_WIDTH_PX = 256; // 16rem
const COLLAPSE_KEY = "cairn:sidebar-collapsed";

// Quick, clean (non-bouncy) tween shared by the rail + content offset.
const COLLAPSE_TRANSITION = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

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
  // Desktop (lg+) sidebar collapse. Defaults to expanded; the persisted value
  // is read in an effect to avoid an SSR/hydration mismatch.
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Whether we're at the lg+ breakpoint (the desktop sidebar / offset only
  // exist there). Tracked so the content offset animates only on desktop.
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  // Restore persisted collapse state after mount (client-only).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "true");
    } catch {
      /* ignore (private mode / disabled storage) */
    }
    setHydrated(true);
  }, []);

  // Track the lg breakpoint (1024px) so the content offset only animates when
  // the desktop rail is actually present.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
      {/* ---- Desktop sidebar: fixed, full height. Slides out (transform) on
            collapse so the off-screen rail keeps its width / no reflow jank. ---- */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-border bg-surface lg:block"
        style={{ width: SIDEBAR_WIDTH }}
        initial={false}
        animate={{ x: collapsed ? -SIDEBAR_WIDTH_PX : 0 }}
        transition={hydrated ? COLLAPSE_TRANSITION : { duration: 0 }}
        aria-hidden={collapsed}
      >
        {sidebar}
      </motion.aside>

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

      {/* ---- Content column. Left offset matches the desktop rail and animates
            in lockstep with the collapse so content reflows cleanly. ---- */}
      <motion.div
        // Before hydration, fall back to the CSS class (`lg:pl-64`) to avoid a
        // first-paint flash; once hydrated, motion drives the inline offset.
        className={hydrated ? undefined : "lg:pl-64"}
        initial={false}
        animate={
          hydrated
            ? { paddingLeft: isDesktop && !collapsed ? SIDEBAR_WIDTH_PX : 0 }
            : {}
        }
        transition={COLLAPSE_TRANSITION}
      >
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          onMenuClick={() => setDrawerOpen(true)}
          onToggleSidebar={toggleCollapsed}
          sidebarCollapsed={collapsed}
        />
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </motion.div>
    </div>
  );
}

export default ShellFrame;
