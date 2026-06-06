"use client";

/**
 * PhotoGallery — a curated exhibit of the cairn photographs.
 *
 * CSS-columns masonry so mixed portrait/landscape frames pack without cropping.
 * Plain <img> (natural aspect — the photos are already web-optimized) so every
 * orientation renders true. No per-child transform animation (transforms inside
 * CSS multi-column break rendering), so all frames reliably show. Clicking
 * opens a lightbox with keyboard nav.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const COUNT = 30;
const PHOTOS = Array.from({ length: COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { n, src: `/cairn-photos/cairn-${n}.jpeg` };
});

function Lightbox({
  index,
  onClose,
  onStep,
}: {
  index: number;
  onClose: () => void;
  onStep: (dir: number) => void;
}) {
  const { n, src } = PHOTOS[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onStep(1);
      else if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onStep]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/92 p-4 backdrop-blur-md sm:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${n}, enlarged`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent-soft sm:right-8 sm:top-7"
      >
        Close ✕
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStep(-1);
        }}
        aria-label="Previous"
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 px-3 py-6 font-serif text-3xl text-muted transition-colors hover:text-accent-soft sm:left-6"
      >
        ‹
      </button>

      <motion.figure
        key={n}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-full flex-col items-center"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 0.84, 0.3, 1] }}
      >
        <div className="overflow-hidden rounded-[3px] border border-border-strong bg-surface p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Cairn photograph ${n}, enlarged`}
            className="block max-h-[78vh] w-auto rounded-[2px]"
          />
        </div>
      </motion.figure>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStep(1);
        }}
        aria-label="Next"
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 px-3 py-6 font-serif text-3xl text-muted transition-colors hover:text-accent-soft sm:right-6"
      >
        ›
      </button>
    </motion.div>
  );
}

export function PhotoGallery() {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback((dir: number) => {
    setOpen((cur) => (cur === null ? cur : (cur + dir + COUNT) % COUNT));
  }, []);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {PHOTOS.map((p, i) => (
          <figure key={p.n} className="group mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open photograph ${p.n}`}
              className="block w-full overflow-hidden rounded-[3px] border border-border bg-surface p-[6px] text-left transition-all duration-500 ease-out hover:-translate-y-1 hover:border-accent-dim hover:shadow-[0_22px_50px_-24px_rgba(0,0,0,0.85)] focus-visible:-translate-y-1"
            >
              <div className="relative overflow-hidden rounded-[2px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={`Cairn photograph ${p.n}`}
                  loading="lazy"
                  className="block h-auto w-full select-none transition-transform duration-[1100ms] ease-out group-hover:scale-[1.045]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/45 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-30" />
              </div>
            </button>
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <Lightbox index={open} onClose={() => setOpen(null)} onStep={step} />
        )}
      </AnimatePresence>
    </>
  );
}

export default PhotoGallery;
