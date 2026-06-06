import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Info · CAIRN" };

interface Note {
  label: string;
  title: string;
  body: React.ReactNode;
}

const NOTES: Note[] = [
  {
    label: "01",
    title: "The vault",
    body: (
      <>
        Everything you keep lives in the vault as <em>folders</em> and{" "}
        <em>entries</em>, nested as deep as you want. It&rsquo;s stored in
        Postgres (Neon) and partitioned to your account — your archive is yours
        alone, not a shared space.
      </>
    ),
  },
  {
    label: "02",
    title: "Sections",
    body: (
      <>
        The top level is made of sections — your broadest shelves (Music, Field
        Notes, whatever you&rsquo;re keeping). Start one from the dashboard or
        the sidebar; everything else nests underneath. They get first billing so
        the shape of the archive stays legible at a glance.
      </>
    ),
  },
  {
    label: "03",
    title: "Writing & editing",
    body: (
      <>
        Open any entry and edit it in place. Write in plain text — it&rsquo;s
        just prose. When you want structure, the <strong>Add markdown</strong>{" "}
        toolbar drops headings, lists, links, and quotes in at your cursor.
        Stored as markdown, rendered clean.
      </>
    ),
  },
  {
    label: "04",
    title: "Poncho",
    body: (
      <>
        Poncho is the agent behind Tools. Ask it to research a topic, draft
        copy, or format rough notes — you watch it work, step by step, rather
        than waiting on a black box. It runs on your own key, so the work (and
        the bill) stays yours.
      </>
    ),
  },
  {
    label: "05",
    title: "Chats & Save to Vault",
    body: (
      <>
        Conversations with Poncho collect under <strong>Chats</strong> — a
        scratch space, not the archive. When an answer earns its keep,{" "}
        <strong>Save to Vault</strong> lets you place it in any folder as a
        proper entry. Nothing lands in the archive unless you put it there.
      </>
    ),
  },
  {
    label: "06",
    title: "Organizing & finding",
    body: (
      <>
        Drag items around the sidebar tree to re-file them — move a folder and
        its whole subtree follows. Browse subfolders inline from any folder
        page, switch between card, list, and tree views, and jump anywhere with{" "}
        <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 font-mono text-[0.625rem] text-faint">
          ⌘K
        </kbd>
        .
      </>
    ),
  },
  {
    label: "07",
    title: "Your data",
    body: (
      <>
        CAIRN is invite-only, one account per person, no cross-tenant leakage.
        Everything you make is exportable — pull the whole archive as{" "}
        <code className="font-mono text-[0.8em]">.mdx</code> files plus an
        agent-readable manifest from Settings, any time. No lock-in.
      </>
    ),
  },
];

export default function InfoPage() {
  return (
    <AppShell title="Info">
      <div className="max-w-2xl">
        <header className="mb-10">
          <h1 className="font-serif text-3xl text-text">What this is</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A cairn is a stack of stones left on a trail — proof someone came
            through, and a hand to whoever&rsquo;s next. This one is digital: a
            quiet, private place to stack what you find, think, and want to keep.
            Here&rsquo;s how it holds together.
          </p>
        </header>

        <div className="space-y-9">
          {NOTES.map((n) => (
            <section key={n.label} className="flex gap-4">
              <span className="mt-1 shrink-0 font-mono text-[0.6875rem] text-faint">
                {n.label}
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-lg text-text">{n.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {n.body}
                </p>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-border pt-6 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
          Curated Archive of Interactive Records &amp; Notes
        </p>
      </div>
    </AppShell>
  );
}
