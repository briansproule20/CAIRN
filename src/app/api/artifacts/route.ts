import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { listArtifactsFor } from "@/lib/repo/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in owner's captured artifacts (ephemeral, not yet in the vault). */
export async function GET() {
  const ownerId = await getCurrentUserId();
  const artifacts = ownerId ? await listArtifactsFor(ownerId) : [];
  return NextResponse.json(
    { artifacts },
    { headers: { "Cache-Control": "no-store" } }
  );
}
