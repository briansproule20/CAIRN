import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { CairnMark } from "@/components/cairn-mark";
import { SidebarCollapseButton } from "@/components/sidebar-collapse-button";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getTree, type TreeNode } from "@/lib/repo/nodes";

/**
 * Sidebar — server component. Persistent left rail with the CAIRN wordmark and
 * navigation. Reads the owner's flat node tree server-side and hands it to the
 * client <SidebarNav>, which renders a nested file-tree for the Vault group.
 * Rendered by <AppShell>.
 *
 *   import { Sidebar } from "@/components/sidebar";
 *   <Sidebar />
 */
export async function Sidebar() {
  let tree: TreeNode[] = [];
  try {
    const ownerId = await getCurrentUserId();
    if (ownerId) {
      tree = await getTree(ownerId);
    }
  } catch {
    tree = [];
  }

  return (
    <div className="flex h-full flex-col">
      {/* Wordmark + collapse */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
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
        <SidebarCollapseButton />
      </div>

      <SidebarNav tree={tree} />
    </div>
  );
}

export default Sidebar;
