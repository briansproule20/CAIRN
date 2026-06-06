import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";

/** Serialize MDX with GFM so bare URLs (sources) autolink and are clickable. */
export function serializeMdx(content: string) {
  return serialize(content, { mdxOptions: { remarkPlugins: [remarkGfm] } });
}
