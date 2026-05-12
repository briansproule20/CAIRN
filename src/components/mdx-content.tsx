"use client";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

export function MDXContent({ source }: { source: MDXRemoteSerializeResult }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-medium prose-a:text-[var(--accent)] prose-code:text-[var(--accent-dim)]">
      <MDXRemote {...source} />
    </div>
  );
}
