"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CairnMark } from "@/components/cairn-mark";

const PONCHO_REFERRAL = "https://tryponcho.com/r/bsproule";

const fieldClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-sm text-text outline-none transition-colors placeholder:text-faint hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60";
const labelClass =
  "mb-2 block font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-faint";

export function SignupForm({ ownerMode }: { ownerMode: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ponchoKey, setPonchoKey] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, ponchoKey, inviteCode }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't create your account.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and retry.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-base text-text">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(200,168,124,0.06), transparent 60%), radial-gradient(80% 60% at 50% 120%, rgba(30,30,30,0.9), transparent 70%)",
        }}
      />

      <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm [animation:cairn-rise-in_180ms_ease-out]">
          <div className="mb-8 flex flex-col items-center text-center">
            <CairnMark className="mb-5 h-[53px] w-11 text-accent" />
            <h1 className="font-serif text-3xl tracking-tight text-text">
              {ownerMode ? "Found your cairn" : "Join CAIRN"}
            </h1>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted">
              {ownerMode
                ? "Create the owner account for this archive."
                : "Create your private, partitioned vault."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm sm:p-7"
            noValidate
          >
            <div>
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <input
                id="username"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="3–32 chars · a-z 0-9 - _"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
                disabled={loading}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Passphrase
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="at least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                className={fieldClass}
              />
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <label htmlFor="ponchoKey" className={`${labelClass} mb-0`}>
                  Poncho key
                </label>
                <a
                  href={PONCHO_REFERRAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.6875rem] text-accent-soft underline-offset-2 hover:underline"
                >
                  Get a Poncho key →
                </a>
              </div>
              <input
                id="ponchoKey"
                type="password"
                autoComplete="off"
                placeholder="pk_poncho_…"
                value={ponchoKey}
                onChange={(e) => {
                  setPonchoKey(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                className={fieldClass}
              />
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-faint">
                Your own Poncho agent powers research. Stored encrypted, never
                shared.
              </p>
            </div>

            {!ownerMode && (
              <div>
                <label htmlFor="inviteCode" className={labelClass}>
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  className={fieldClass}
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-accent-soft">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !username ||
                !password ||
                !ponchoKey ||
                (!ownerMode && !inviteCode)
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
            >
              {loading && (
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-base/40 border-t-base"
                />
              )}
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-accent-soft underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default SignupForm;
