import fs from "fs";
import path from "path";
import matter from "gray-matter";

const VAULT_DIR = path.join(process.cwd(), "vault");

export interface VaultEntry {
  slug: string;
  category: string;
  title: string;
  tags: string[];
  status: string;
  created: string;
  updated: string;
  content: string;
  [key: string]: unknown;
}

export function getCategories(): string[] {
  if (!fs.existsSync(VAULT_DIR)) return [];
  return fs
    .readdirSync(VAULT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

export function getEntriesByCategory(category: string): VaultEntry[] {
  const dir = path.join(VAULT_DIR, category);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: f.replace(/\.mdx$/, ""),
        category,
        title: data.title || f.replace(/\.mdx$/, ""),
        tags: data.tags || [],
        status: data.status || "draft",
        created: data.created || "",
        updated: data.updated || "",
        content,
        ...data,
      };
    })
    .sort((a, b) => (a.title > b.title ? 1 : -1));
}

export function getEntry(category: string, slug: string): VaultEntry | null {
  const filePath = path.join(VAULT_DIR, category, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    category,
    title: data.title || slug,
    tags: data.tags || [],
    status: data.status || "draft",
    created: data.created || "",
    updated: data.updated || "",
    content,
    ...data,
  };
}

export function getAllEntries(): VaultEntry[] {
  return getCategories().flatMap(getEntriesByCategory);
}

export function searchEntries(query: string): VaultEntry[] {
  const q = query.toLowerCase();
  return getAllEntries().filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
  );
}
