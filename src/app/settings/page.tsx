import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Settings · CAIRN" };

export default function SettingsPage() {
  const ponchoConnected = Boolean(process.env.PONCHO_API_KEY);
  const usingMongo = Boolean(process.env.MONGODB_URI);

  return (
    <AppShell title="Settings">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-text">Settings</h1>
        <p className="mt-1 text-sm text-muted">Connections and session.</p>
      </header>

      <div className="max-w-xl space-y-10">
        <section>
          <h2 className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Connections
          </h2>
          <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            <StatusRow
              label="Poncho agent"
              value={ponchoConnected ? "Connected" : "Not configured"}
              ok={ponchoConnected}
            />
            <StatusRow
              label="Content store"
              value={usingMongo ? "MongoDB Atlas" : "Local files"}
              ok={usingMongo}
            />
          </dl>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
            Session
          </h2>
          <LogoutButton />
        </section>
      </div>
    </AppShell>
  );
}

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
    <div className="flex items-center justify-between px-4 py-3">
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
