import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";

const components = {
  a: ({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) => {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
};

/**
 * MDXServer — server-rendered MDX (RSC) for use INSIDE Server Components, where
 * the client `MDXRemote` (`MDXContent`) crashes. GFM autolinks bare URLs; falls
 * back to a <pre> if the MDX can't compile (stray braces/angle brackets).
 */
export async function MDXServer({ source }: { source: string }) {
  try {
    const { content } = await compileMDX({
      source,
      options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
      components,
    });
    return <div className="prose-cairn">{content}</div>;
  } catch {
    return (
      <pre className="overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface px-4 py-4 font-mono text-[0.8125rem] leading-relaxed text-text">
        {source}
      </pre>
    );
  }
}

export default MDXServer;
