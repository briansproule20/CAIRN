import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { InvitePanel } from "@/components/invite-panel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isOwner } from "@/lib/repo/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · CAIRN" };

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const owner = user ? await isOwner(user.id) : false;
  const hasKey = Boolean(user?.ponchoKeyEnc);
  const dbConnected = Boolean(process.env.DATABASE_URL);

  return (
    <AppShell title="Settings">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-text">Settings</h1>
        <p className="mt-1 text-sm text-muted">Your account, connections, and data.</p>
      </header>

      <div className="max-w-xl space-y-10">
        {/* Profile */}
        <section>
          <h2 className={sectionLabel}>Profile</h2>
          <dl className={card}>
            <div className={row}>
              <dt className="text-sm text-text">Username</dt>
              <dd className="flex items-center gap-2 text-sm">
                <span className="font-mono text-text">
                  {user?.username ?? "—"}
                </span>
                {owner && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-accent-soft">
                    owner
                  </span>
                )}
              </dd>
            </div>
            <div className={row}>
              <dt className="text-sm text-text">Member since</dt>
              <dd className="text-sm text-muted">
                {formatDate(user?.createdAt)}
              </dd>
            </div>
            <StatusRow
              label="Poncho key"
              value={hasKey ? "Set · encrypted" : "Not set"}
              ok={hasKey}
            />
          </dl>
        </section>

        {/* Connections */}
        <section>
          <h2 className={sectionLabel}>Connections</h2>
          <dl className={card}>
            <StatusRow
              label="Database"
              value={dbConnected ? "Neon Postgres" : "Not configured"}
              ok={dbConnected}
            />
            <StatusRow
              label="Poncho agent"
              value={hasKey ? "Connected · your key" : "No key on file"}
              ok={hasKey}
            />
          </dl>
        </section>

        {/* Invites — owner only */}
        {owner && (
          <section>
            <h2 className={sectionLabel}>Invites</h2>
            <p className="mb-3 text-sm leading-relaxed text-muted">
              Mint single-use codes to invite others. Every new account needs
              one.
            </p>
            <InvitePanel />
          </section>
        )}

        {/* Export */}
        <section>
          <h2 className={sectionLabel}>Export</h2>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            Download everything as a ZIP — your entries as <code>.mdx</code> plus
            an agent-readable manifest and JSON.
          </p>
          <a
            href="/api/export"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-dim/50 bg-accent/5 px-4 py-2 text-sm font-medium text-accent-soft transition-colors hover:border-accent-dim hover:bg-accent/10"
          >
            Export everything
          </a>
        </section>

        {/* Session */}
        <section>
          <h2 className={sectionLabel}>Session</h2>
          <LogoutButton />
        </section>
      </div>
    </AppShell>
  );
}

const sectionLabel =
  "mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint";
const card = "divide-y divide-border overflow-hidden rounded-xl border border-border";
const row = "flex items-center justify-between px-4 py-3";

function StatusRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className={row}>
      <dt className="text-sm text-text">{label}</dt>
      <dd className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-accent" : "bg-faint"}`}
        />
        <span className={ok ? "text-accent-soft" : "text-muted"}>{value}</span>
      </dd>
    </div>
  );
}
