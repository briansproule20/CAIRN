import Link from "next/link";
import { SidebarNav, type SidebarCategory } from "@/components/sidebar-nav";
import { CairnMark } from "@/components/cairn-mark";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listChildren, childCount } from "@/lib/repo/nodes";

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
export async function Sidebar() {
  let categories: SidebarCategory[] = [];
  try {
    const ownerId = await getCurrentUserId();
    if (ownerId) {
      const tops = await listChildren(ownerId, null);
      categories = await Promise.all(
        tops.map(async (t) => ({
          name: t.slug,
          label: t.title,
          count: t.kind === "folder" ? await childCount(ownerId, t.id) : 0,
        }))
      );
    }
  } catch {
    categories = [];
  }

  return (
    <div className="flex h-full flex-col">
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5">
        <Link
          href="/"
          className="group inline-flex items-center gap-2"
          aria-label="CAIRN home"
        >
          <CairnMark className="h-6 w-5 shrink-0 text-accent" />
          <span className="font-serif text-lg font-semibold tracking-tight text-text transition-colors group-hover:text-accent-soft">
            CAIRN
          </span>
        </Link>
      </div>

      <SidebarNav categories={categories} />
    </div>
  );
}

export default Sidebar;
