import { countUsers } from "@/lib/repo/users";
import { SignupForm } from "@/components/signup-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account · CAIRN" };

export default async function SignupPage() {
  // First account is the owner (no invite). After that, invite-only.
  let ownerMode = false;
  try {
    ownerMode = (await countUsers()) === 0;
  } catch {
    ownerMode = false;
  }
  return <SignupForm ownerMode={ownerMode} />;
}
