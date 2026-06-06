import { getCurrentUser } from "@/lib/auth/current-user";
import { userPonchoKey } from "@/lib/repo/users";

/**
 * The Poncho key to use for the current request: the logged-in user's own
 * (decrypted) BYO key, falling back to the env key if they have none set.
 */
export async function resolvePonchoKey(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (user) {
      const key = userPonchoKey(user);
      if (key) return key;
    }
  } catch {
    /* fall through to env */
  }
  return process.env.PONCHO_API_KEY || null;
}
