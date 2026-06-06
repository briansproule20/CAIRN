import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { ShellFrame } from "@/components/shell-frame";

/**
 * AppShell — server component. The persistent vault layout.
 *
 * Renders a fixed left <Sidebar/>, a sticky <Topbar/> over the content area,
 * and <main> with a comfortably-measured container. Mounts <CommandPalette/>
 * once so Cmd/Ctrl+K works on every page wrapped by the shell.
 *
 * Pages OPT IN. Login & editor stay full-screen and do NOT use this.
 *
 *   import { AppShell } from "@/components/app-shell";
 *
 *   export default function Page() {
 *     return (
 *       <AppShell title="Vault">
 *         ...page content...
 *       </AppShell>
 *     );
 *   }
 *
 * Props:
 *  - title?:      string | ReactNode — shown in the topbar.
 *  - breadcrumb?: ReactNode          — optional breadcrumb before the title.
 *  - children:    ReactNode          — page content (rendered in <main>).
 */
export function AppShell({
  title,
  breadcrumb,
  children,
}: {
  title?: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {/* Sidebar is a server component (reads the vault); it's passed down to
          the client ShellFrame which owns the mobile drawer state. */}
      <ShellFrame sidebar={<Sidebar />} title={title} breadcrumb={breadcrumb}>
        {children}
      </ShellFrame>
      <CommandPalette />
    </>
  );
}

export default AppShell;
