import Link from "next/link";
import { getCategories, getEntriesByCategory } from "@/lib/vault";
import { SidebarNav, type SidebarCategory } from "@/components/sidebar-nav";
import { CairnMark } from "@/components/cairn-mark";

/**
 * Sidebar — server component. Persistent left rail with the CAIRN wordmark,
 * category navigation (with per-category counts + active state), a Tags link,
 * and a "+ New Entry" action.
 *
 * Data is read server-side here; active-state highlighting lives in the
 * client subcomponent <SidebarNav>. Rendered by <AppShell>.
 *
 *   import { Sidebar } from "@/components/sidebar";
 *   <Sidebar />
 */
export function Sidebar() {
  const categories: SidebarCategory[] = getCategories().map((name) => ({
    name,
    label: name.replace(/-/g, " "),
    count: getEntriesByCategory(name).length,
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5">
        <Link
          href="/"
          className="group inline-flex items-baseline gap-2"
          aria-label="CAIRN home"
        >
          <CairnMark className="h-6 w-5 shrink-0 text-accent" />
          <span className="font-serif text-lg font-semibold tracking-tight text-text transition-colors group-hover:text-accent-soft">
            CAIRN
          </span>
        </Link>
        <p className="mt-1.5 pl-7 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-faint">
          the archive
        </p>
      </div>

      <SidebarNav categories={categories} />
    </div>
  );
}

export default Sidebar;
