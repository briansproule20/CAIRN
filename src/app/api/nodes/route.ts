import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { createNode } from "@/lib/repo/nodes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ownerId = await getCurrentUserId();
  if (!ownerId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const kind = body.kind === "folder" ? "folder" : "entry";
  const parentId = body.parentId ? String(body.parentId) : null;
  const content = typeof body.content === "string" ? body.content : "";
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  try {
    const node = await createNode(ownerId, { parentId, kind, title, content });
    return NextResponse.json({
      node: {
        id: node.id,
        slug: node.slug,
        kind: node.kind,
        title: node.title,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't create that." },
      { status: 400 }
    );
  }
}
