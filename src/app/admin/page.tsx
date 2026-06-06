import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isOwner, listAllUsers } from "@/lib/repo/users";
import { listAllInvites } from "@/lib/repo/invites";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · CAIRN", robots: "noindex, nofollow" };

function fmt(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  // Hidden: anyone who isn't the owner gets a real 404 — looks like it doesn't exist.
  if (!user || !(await isOwner(user.id))) notFound();

  const [users, invites] = await Promise.all([
    listAllUsers(),
    listAllInvites(),
  ]);
  const usedInvites = invites.filter((i) => i.usedBy).length;

  return (
    <AppShell title="Admin">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-text">Admin</h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {users.length} {users.length === 1 ? "account" : "accounts"} ·{" "}
          {invites.length} invites ({usedInvites} used)
        </p>
      </header>

      <div className="space-y-10">
        <section>
          <h2 className={label}>Accounts</h2>
          <div className={card}>
            {users.map((u, i) => (
              <div key={u.id} className={row}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-text">
                    {u.username}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-accent-soft">
                      owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 font-mono text-[0.6875rem] text-faint">
                  <span className={u.hasKey ? "text-accent-dim" : ""}>
                    {u.hasKey ? "key set" : "no key"}
                  </span>
                  <span>{fmt(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={label}>Invite codes</h2>
          {invites.length === 0 ? (
            <p className="text-sm text-muted">No invites minted yet.</p>
          ) : (
            <div className={card}>
              {invites.map((inv) => (
                <div key={inv.id} className={row}>
                  <code
                    className={`font-mono text-sm ${
                      inv.usedBy ? "text-faint line-through" : "text-text"
                    }`}
                  >
                    {inv.code}
                  </code>
                  <div className="flex items-center gap-4 font-mono text-[0.6875rem] text-faint">
                    <span className={inv.usedBy ? "text-accent-dim" : ""}>
                      {inv.usedBy ? "used" : "open"}
                    </span>
                    <span>{fmt(inv.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const label =
  "mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint";
const card =
  "divide-y divide-border overflow-hidden rounded-xl border border-border";
const row = "flex items-center justify-between gap-3 px-4 py-3";
