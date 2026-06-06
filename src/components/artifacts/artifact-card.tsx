"use client";

import { Trash2, Code2 } from "lucide-react";
import { NodeMedia } from "@/components/vault/node-media";
import { MediaSave } from "@/components/media-save";
import { HtmlSave } from "@/components/html-save";
import { SandboxedHtml } from "@/components/sandboxed-html";
import { type MediaArtifact } from "@/lib/poncho";
import type { Artifact } from "@/lib/db/schema";

/** Format an ISO/date string as a short, human "created" label. */
function formatCreated(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** True for kinds NodeMedia can render natively. */
function isRenderableMedia(
  kind: string
): kind is "image" | "audio" | "video" {
  return kind === "image" || kind === "audio" || kind === "video";
}

/**
 * ArtifactCard — one ephemeral artifact in the gallery. Renders the media
 * (or an html/link fallback), its title/description + created date, and two
 * actions: promote into the vault (MediaSave) or discard.
 */
export function ArtifactCard({
  artifact,
  onDiscard,
}: {
  artifact: Artifact;
  onDiscard: (id: string) => void;
}) {
  const created = formatCreated(artifact.createdAt);

  // HTML artifacts carry their markup in `content` and render sandboxed.
  const isHtml = artifact.kind === "html" && !!artifact.content?.trim();

  // Map the Artifact row onto the MediaArtifact shape MediaSave/NodeMedia want.
  // The guard narrows `kind` to the literal union MediaArtifact requires.
  const renderable = isRenderableMedia(artifact.kind);
  const mediaArtifact: MediaArtifact = {
    url: artifact.url,
    kind: isRenderableMedia(artifact.kind) ? artifact.kind : "image",
    mimeType: artifact.mimeType ?? undefined,
    title: artifact.title ?? undefined,
    description: artifact.description ?? undefined,
  };

  function discard() {
    if (window.confirm("Discard this artifact? This can't be undone.")) {
      onDiscard(artifact.id);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong">
      <div className="min-h-0">
        {renderable ? (
          <NodeMedia
            url={artifact.url}
            mediaType={artifact.mimeType || artifact.kind}
            title={artifact.title}
            description={artifact.description}
          />
        ) : isHtml ? (
          <div className="space-y-2 p-4">
            {artifact.title && (
              <p className="font-serif text-sm text-text">{artifact.title}</p>
            )}
            <SandboxedHtml
              html={artifact.content!}
              title={artifact.title || "HTML artifact"}
            />
          </div>
        ) : (
          <HtmlPreview artifact={artifact} />
        )}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <span className="font-mono text-[0.6875rem] text-faint">
          {created}
        </span>
        <div className="flex items-center gap-2">
          {renderable && <MediaSave artifact={mediaArtifact} />}
          {isHtml && (
            <HtmlSave
              html={artifact.content!}
              defaultTitle={artifact.title || "Generated artifact"}
            />
          )}
          <button
            type="button"
            onClick={discard}
            aria-label="Discard artifact"
            title="Discard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent-dim hover:text-accent-soft"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            Discard
          </button>
        </div>
      </footer>
    </article>
  );
}

/** Fallback card body for `html` (and any non-media) artifacts. */
function HtmlPreview({ artifact }: { artifact: Artifact }) {
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center gap-2 text-accent-dim">
        <Code2 className="h-4 w-4 shrink-0" />
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em]">
          {artifact.kind}
        </span>
      </div>
      {artifact.title && (
        <p className="font-serif text-sm text-text">{artifact.title}</p>
      )}
      {artifact.description && (
        <p className="text-xs leading-relaxed text-muted">
          {artifact.description}
        </p>
      )}
      <a
        href={artifact.url}
        target="_blank"
        rel="noreferrer"
        className="inline-block break-all font-mono text-[0.6875rem] text-accent-dim underline-offset-2 hover:text-accent-soft hover:underline"
      >
        {artifact.url}
      </a>
    </div>
  );
}

export default ArtifactCard;
