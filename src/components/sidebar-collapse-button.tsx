"use client";

import { PanelLeftClose } from "lucide-react";

export const TOGGLE_SIDEBAR_EVENT = "cairn:toggle-sidebar";

/**
 * Collapse control that lives inside the sidebar header. Dispatches a window
 * event that <ShellFrame> listens for, so the persistent server-rendered
 * sidebar can drive the client collapse state without prop drilling.
 * Desktop-only (the rail only collapses at lg+). When collapsed, the rail
 * slides off-screen and the Topbar shows the expand affordance.
 */
export function SidebarCollapseButton() {
  return (
    <button
      type="button"
      aria-label="Collapse sidebar"
      onClick={() => window.dispatchEvent(new CustomEvent(TOGGLE_SIDEBAR_EVENT))}
      className="hidden h-7 w-7 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-accent-soft lg:grid"
    >
      <PanelLeftClose aria-hidden className="h-4 w-4" />
    </button>
  );
}

export default SidebarCollapseButton;
