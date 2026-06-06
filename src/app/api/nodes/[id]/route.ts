import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { getNode, updateNode, deleteNode } from "@/lib/repo/nodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const patch: {
    title?: string;
    content?: string;
    status?: string;
    tags?: string[];
  } = {};
  if (typeof body.title === "string" && body.title.trim())
    patch.title = body.title.trim();
  if (typeof body.content === "string") patch.content = body.content;
  if (typeof body.status === "string") patch.status = body.status;
  if (Array.isArray(body.tags))
    patch.tags = body.tags.map((t) => String(t).trim()).filter(Boolean);

  const node = await updateNode(ownerId, id, patch);
  if (!node) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const node = await getNode(ownerId, id);
  if (!node) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await deleteNode(ownerId, id);
  return NextResponse.json({ ok: true });
}
