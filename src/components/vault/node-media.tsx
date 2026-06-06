import { type MediaArtifact } from "@/lib/poncho";

/** Decide how to render a media artifact from its mediaType (kind or MIME). */
function mediaKind(mediaType?: string | null): "image" | "audio" | "video" {
  const t = (mediaType ?? "").toLowerCase();
  if (t === "audio" || t.startsWith("audio/")) return "audio";
  if (t === "video" || t.startsWith("video/")) return "video";
  return "image";
}

/**
 * NodeMedia — renders a single media artifact (image / audio / video) inline.
 * Used both at the top of a vault entry view and in the Poncho result area.
 */
export function NodeMedia({
  url,
  mediaType,
  title,
  description,
}: {
  url: string;
  mediaType?: string | null;
  title?: string | null;
  description?: string | null;
}) {
  const kind = mediaKind(mediaType);

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface">
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title || ""}
          className="block max-h-[70vh] w-full object-contain"
        />
      ) : kind === "audio" ? (
        <div className="p-4">
          <audio controls src={url} className="w-full">
            <track kind="captions" />
          </audio>
        </div>
      ) : (
        <video controls src={url} className="block max-h-[70vh] w-full" />
      )}
      {(title || description) && (
        <figcaption className="space-y-1 border-t border-border px-4 py-3">
          {title && (
            <p className="font-serif text-sm text-text">{title}</p>
          )}
          {description && (
            <p className="text-xs leading-relaxed text-muted">{description}</p>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** Convenience renderer for an array of MediaArtifacts. */
export function MediaList({ media }: { media: MediaArtifact[] }) {
  if (!media.length) return null;
  return (
    <div className="space-y-4">
      {media.map((m, i) => (
        <NodeMedia
          key={`${m.url}-${i}`}
          url={m.url}
          mediaType={m.mimeType || m.kind}
          title={m.title}
          description={m.description}
        />
      ))}
    </div>
  );
}

export default NodeMedia;
