import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Lazy Neon + Drizzle client. The connection is created on first use, so the
 * app builds fine before DATABASE_URL exists (provision Neon via the Vercel
 * Marketplace, then add DATABASE_URL to .env.local).
 */
function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision Neon (Vercel → Storage → Neon) and add DATABASE_URL to .env.local."
    );
  }
  return drizzle(neon(url), { schema });
}

let cached: ReturnType<typeof create> | null = null;

export function getDb() {
  return (cached ??= create());
}

export { schema };
