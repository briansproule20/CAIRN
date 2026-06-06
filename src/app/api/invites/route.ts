import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isOwner } from "@/lib/repo/users";
import { createInvite, listInvitesBy } from "@/lib/repo/invites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in.", status: 401 as const };
  if (!(await isOwner(user.id))) {
    return { error: "Only the owner can manage invites.", status: 403 as const };
  }
  return { user };
}

export async function GET() {
  const guard = await requireOwner();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const invites = await listInvitesBy(guard.user.id);
  return NextResponse.json(
    {
      invites: invites.map((i) => ({
        code: i.code,
        used: i.usedBy !== null,
        createdAt: i.createdAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() {
  const guard = await requireOwner();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  const invite = await createInvite(guard.user.id);
  return NextResponse.json({ code: invite.code });
}
