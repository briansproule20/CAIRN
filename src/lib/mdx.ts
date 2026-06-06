import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

/**
 * Serialize MDX with GitHub-flavored markdown — notably autolinking bare URLs
 * (sources, references) so they're clickable, plus tables/strikethrough.
 */
export function serializeMdx(content: string) {
  return serialize(content, {
    mdxOptions: { remarkPlugins: [remarkGfm] },
  });
}
