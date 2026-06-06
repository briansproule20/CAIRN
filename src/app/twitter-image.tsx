// The Twitter/X share image reuses the exact Open Graph composition.
// App Router auto-wires this into <meta name="twitter:image"> with an
// absolute URL derived from metadataBase in layout.tsx.

// `runtime` must be a statically-analyzable literal in each route file,
// so it is declared here rather than re-exported.
export const runtime = "nodejs";

export { alt, size, contentType, default } from "./opengraph-image";
