import JSZip from "jszip";
import { getAllEntries, type VaultEntry } from "@/lib/vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function frontmatter(e: VaultEntry): string {
  const tags = (e.tags ?? []).map((t) => `${t}`).join(", ");
  return [
    "---",
    `title: ${e.title}`,
    `category: ${e.category}`,
    `tags: [${tags}]`,
    `status: ${e.status}`,
    `created: ${e.created}`,
    `updated: ${e.updated}`,
    "---",
    "",
  ].join("\n");
}

function manifest(entries: VaultEntry[], when: string): string {
  const categories = Array.from(new Set(entries.map((e) => e.category))).sort();
  return `# CAIRN export

This is a full export of a **CAIRN** vault — a private, personal knowledge app
(notes, records, research) organized by category and rendered as MDX.

- Exported: ${when}
- Entries: ${entries.length}
- Categories: ${categories.join(", ") || "(none)"}

## Structure

- \`vault/<category>/<slug>.mdx\` — one file per entry.
- Each \`.mdx\` begins with YAML frontmatter: \`title\`, \`category\`, \`tags\`,
  \`status\` (draft|published), \`created\`, \`updated\`. The body is Markdown/MDX.
- Cross-references between entries use \`[[wikilink]]\` syntax in the body.
- \`cairn.json\` — the same content as machine-readable JSON for clean re-import.

## For a future agent

Treat each \`.mdx\` as an atomic note. The folder is the category. Preserve the
frontmatter on round-trip. To rebuild the vault, recreate the folder layout and
files; to import elsewhere, parse \`cairn.json\`.
`;
}

export async function GET() {
  const entries = getAllEntries();
  const when = new Date().toISOString();

  const zip = new JSZip();
  zip.file("CAIRN-EXPORT.md", manifest(entries, when));
  zip.file(
    "cairn.json",
    JSON.stringify(
      {
        app: "cairn",
        exportedAt: when,
        entryCount: entries.length,
        entries: entries.map((e) => ({
          category: e.category,
          slug: e.slug,
          title: e.title,
          tags: e.tags,
          status: e.status,
          created: e.created,
          updated: e.updated,
          content: e.content,
        })),
      },
      null,
      2
    )
  );
  for (const e of entries) {
    zip.file(`vault/${e.category}/${e.slug}.mdx`, frontmatter(e) + e.content);
  }

  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const body = new Uint8Array(buf);
  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="cairn-export.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
