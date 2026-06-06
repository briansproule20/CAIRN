"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { ArtifactCard } from "@/components/artifacts/artifact-card";
import type { Artifact } from "@/lib/db/schema";

/**
 * ArtifactGallery — client gallery of all captured artifacts. Fetches
 * /api/artifacts (newest first), polls + listens for `cairn:artifacts-updated`,
 * and offers discard (optimistic) / Save to Vault on each card.
 */
export function ArtifactGallery() {
  const [artifacts, setArtifacts] = useState<Artifact[] | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/artifacts", { signal });
      const data = await res.json();
      setArtifacts(Array.isArray(data.artifacts) ? data.artifacts : []);
    } catch {
      // Ignore aborts; surface other failures as an empty list.
      if (!signal?.aborted) setArtifacts([]);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    const t = setInterval(() => load(), 20_000);
    const onUpdated = () => load();
    window.addEventListener("cairn:artifacts-updated", onUpdated);
    window.addEventListener("cairn:chats-updated", onUpdated);
    return () => {
      ac.abort();
      clearInterval(t);
      window.removeEventListener("cairn:artifacts-updated", onUpdated);
      window.removeEventListener("cairn:chats-updated", onUpdated);
    };
  }, [load]);

  // Optimistic discard — if the request fails the artifact returns on next poll.
  const discard = useCallback(async (id: string) => {
    setArtifacts((prev) => prev?.filter((a) => a.id !== id) ?? prev);
    try {
      await fetch(`/api/artifacts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      window.dispatchEvent(new Event("cairn:artifacts-updated"));
    } catch {
      /* will reappear on the next poll */
    }
  }, []);

  if (artifacts === null) {
    return (
      <p className="font-mono text-xs text-faint">Loading artifacts…</p>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <Sparkles className="mx-auto mb-3 h-6 w-6 text-accent-dim" />
        <p className="text-sm text-muted">No artifacts yet.</p>
        <p className="mt-1 text-xs text-faint">
          Generate media in Poncho and it&apos;ll be captured here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {artifacts.map((a) => (
        <ArtifactCard key={a.id} artifact={a} onDiscard={discard} />
      ))}
    </div>
  );
}

export default ArtifactGallery;
