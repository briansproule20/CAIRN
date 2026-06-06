"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { slugify } from "@/components/toc";

/**
 * MDXContent — renders serialized MDX inside the Foundation's
 * `.prose-cairn` long-form reading style.
 *
 * h2/h3 headings receive slugified ids (matching `extractHeadings` /
 * `slugify` from toc.tsx) plus an anchor affordance, so the right-rail
 * table of contents and in-page links resolve. A per-render counter
 * de-duplicates repeated heading text, mirroring the server parser.
 */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

export function MDXContent({ source }: { source: MDXRemoteSerializeResult }) {
  // Mirror the de-dup scheme used by extractHeadings so anchor ids line up.
  const seen = new Map<string, number>();
  const headingCount = { value: 0 };

  const makeId = (children: ReactNode) => {
    let id = slugify(extractText(children));
    if (!id) id = `section-${headingCount.value}`;
    headingCount.value += 1;
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    return count > 0 ? `${id}-${count}` : id;
  };

  const Heading = (
    Tag: "h2" | "h3"
  ) =>
    function MDXHeading({ children, ...props }: ComponentPropsWithoutRef<"h2">) {
      const id = makeId(children);
      return (
        <Tag id={id} {...props} className="group scroll-mt-24">
          <a
            href={`#${id}`}
            aria-label={`Link to section: ${extractText(children)}`}
            className="no-underline"
          >
            {children}
            <span
              aria-hidden
              className="ml-2 select-none text-accent-dim opacity-0 transition-opacity group-hover:opacity-100"
            >
              #
            </span>
          </a>
        </Tag>
      );
    };

  const components = {
    h2: Heading("h2"),
    h3: Heading("h3"),
    a: ({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) => {
      const isExternal = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="prose-cairn">
      <MDXRemote {...source} components={components} />
    </div>
  );
}

export default MDXContent;
