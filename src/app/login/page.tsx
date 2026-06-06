"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CairnMark } from "@/components/cairn-mark";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("That password doesn't match. Try again.");
        setPassword("");
        setLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and retry.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-base text-text">
      {/* Subtle stone backdrop — layered low-contrast washes, no neon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(200,168,124,0.06), transparent 60%), radial-gradient(80% 60% at 50% 120%, rgba(30,30,30,0.9), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm [animation:cairn-rise-in_180ms_ease-out]">
          {/* Wordmark + cairn glyph */}
          <div className="mb-9 flex flex-col items-center text-center">
            <CairnMark className="mb-5 h-[53px] w-11 text-accent" />
            <h1 className="font-serif text-3xl tracking-tight text-text">
              CAIRN
            </h1>
            <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-muted">
              Curated Archive of Interactive Records and Notes
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-surface/80 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset] backdrop-blur-sm sm:p-7"
            noValidate
          >
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-faint"
            >
              Passphrase
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter to continue"
              autoFocus
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
              className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 font-mono text-sm text-text outline-none placeholder:text-faint transition-colors hover:border-border-strong focus-visible:border-accent-dim focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-60"
            />

            <div
              id="login-error"
              role="alert"
              aria-live="polite"
              className={`overflow-hidden text-sm text-accent-soft transition-all ${
                error ? "mt-3 max-h-12 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {error}
            </div>

            <button
              type="submit"
              disabled={loading || password.length === 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-base transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-accent-dim disabled:text-base/70"
            >
              {loading && (
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-base/40 border-t-base"
                />
              )}
              {loading ? "Unlocking…" : "Enter the archive"}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-[0.6875rem] tracking-wide text-faint">
            Private vault · access restricted
          </p>
        </div>
      </div>
    </main>
  );
}

