import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { deleteArtifact } from "@/lib/repo/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Discard a captured artifact (does not touch anything already saved to the vault). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  await deleteArtifact(ownerId, id);
  return NextResponse.json({ ok: true });
}
