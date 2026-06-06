import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getTree } from "@/lib/repo/nodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The owner's full node tree (flat) — used by destination pickers. */
export async function GET() {
  const ownerId = await getCurrentUserId();
  const tree = ownerId ? await getTree(ownerId) : [];
  return NextResponse.json({ tree }, { headers: { "Cache-Control": "no-store" } });
}
