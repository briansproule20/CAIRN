"use client";

import { useEffect, useRef, useState } from "react";

/**
 * TocHeading — a single entry in the table of contents.
 * `level` is the heading depth (2 = h2, 3 = h3). `id` matches the
 * slugified id applied to the rendered heading by MDXContent.
 */
export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * slugify — deterministic id generation shared between the server-side
 * heading parser (entry page) and the rendered MDX heading overrides
 * (mdx-content). Keep these in sync so anchor links resolve.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * extractHeadings — parse h2/h3 headings from raw MDX/markdown content.
 * Server-safe (no DOM). Skips fenced code blocks so `## inside code`
 * is never mistaken for a heading. Ids are de-duplicated to stay unique.
 */
export function extractHeadings(content: string): TocHeading[] {
  const lines = content.split("\n");
  const headings: TocHeading[] = [];
  const seen = new Map<string, number>();
  let inFence = false;

  for (const line of lines) {
    const fence = line.trimStart();
    if (fence.startsWith("```") || fence.startsWith("~~~")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].replace(/[`*_~]/g, "").trim();
    if (!text) continue;

    let id = slugify(text);
    if (!id) id = `section-${headings.length}`;
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Toc — right-rail table of contents with scroll-spy.
 *
 * Renders the provided headings as anchor links and highlights the
 * section currently in view via IntersectionObserver. Smooth-scrolls on
 * click (respecting the global reduced-motion handling). Hidden on
 * narrow screens by the parent layout.
 */
export function Toc({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");
  const activeRef = useRef(activeId);
  activeRef.current = activeId;

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Track which headings are currently within the viewport band.
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }

        // Prefer the topmost currently-visible heading; otherwise keep the
        // last heading scrolled past (closest above the viewport top).
        if (visible.size > 0) {
          const topmost = headings.find((h) => visible.has(h.id));
          if (topmost) setActiveId(topmost.id);
          return;
        }

        let above = activeRef.current;
        for (const el of elements) {
          if (el.getBoundingClientRect().top < 120) above = el.id;
          else break;
        }
        setActiveId(above);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: [0, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
    // Move focus for keyboard/AT users without an extra visible jump.
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  if (headings.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-faint">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {headings.map((heading) => {
          const isActive = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                aria-current={isActive ? "location" : undefined}
                className={[
                  "-ml-px block border-l py-1 pr-2 leading-snug transition-colors",
                  heading.level === 3 ? "pl-6" : "pl-3",
                  isActive
                    ? "border-accent text-accent-soft"
                    : "border-transparent text-muted hover:border-border-strong hover:text-text",
                ].join(" ")}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Toc;
