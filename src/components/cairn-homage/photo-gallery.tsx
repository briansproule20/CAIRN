"use client";

/**
 * PhotoGallery — a curated exhibit of the cairn photographs.
 *
 * Treatment: an asymmetric CSS-columns masonry (so portrait frames pack
 * tightly without cropping), each plate scroll-revealing with a staggered,
 * weighty rise. Frames carry a thin archival mat, a film-style index tab, and
 * lift on hover. Clicking opens a quiet lightbox with keyboard nav. All images
 * lazy-load through next/image.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const COUNT = 33;
const PHOTOS = Array.from({ length: COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { n, src: `/cairn-photos/cairn-${n}.jpeg` };
});

function Plate({
  n,
  src,
  index,
  onOpen,
}: {
  n: string;
  src: string;
  index: number;
  onOpen: (i: number) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      className="group relative mb-4 break-inside-avoid"
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: 0.7,
        ease: [0.16, 0.84, 0.3, 1],
        // gentle intra-row offset so a row doesn't pop in lockstep
        delay: reduce ? 0 : (index % 3) * 0.07,
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={`Open photograph ${n} of ${COUNT}`}
        className="block w-full overflow-hidden rounded-[3px] border border-border bg-surface p-[6px] text-left transition-all duration-500 ease-out hover:-translate-y-1 hover:border-accent-dim hover:shadow-[0_22px_50px_-24px_rgba(0,0,0,0.85)] focus-visible:-translate-y-1"
      >
        <div className="relative overflow-hidden rounded-[2px]">
          <Image
            src={src}
            alt={`Cairn photograph ${n}`}
            width={1200}
            height={1600}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-auto w-full select-none transition-transform duration-[1100ms] ease-out group-hover:scale-[1.045]"
          />
          {/* warm wash that lifts on hover, tying frames to the palette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/45 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-30" />
          {/* film-style index tab */}
          <figcaption className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-[2px] bg-base/55 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-accent-soft opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100">
            <span className="inline-block h-1 w-1 rotate-45 bg-accent-dim" />
            {n} / {COUNT}
          </figcaption>
        </div>
      </button>
    </motion.figure>
  );
}

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
      aria-label={`Photograph ${n} of ${COUNT}, enlarged`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent-soft sm:right-8 sm:top-7"
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
        className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-6 font-serif text-3xl text-muted transition-colors hover:text-accent-soft sm:left-6"
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
          <Image
            src={src}
            alt={`Cairn photograph ${n}, enlarged`}
            width={1200}
            height={1600}
            priority
            sizes="(max-width: 640px) 92vw, 70vh"
            className="h-auto max-h-[78vh] w-auto rounded-[2px]"
          />
        </div>
        <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Stone {n} · of {COUNT}
        </figcaption>
      </motion.figure>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStep(1);
        }}
        aria-label="Next"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-6 font-serif text-3xl text-muted transition-colors hover:text-accent-soft sm:right-6"
      >
        ›
      </button>
    </motion.div>
  );
}

export function PhotoGallery() {
  const [open, setOpen] = useState<number | null>(null);

  const step = useCallback((dir: number) => {
    setOpen((cur) => {
      if (cur === null) return cur;
      return (cur + dir + COUNT) % COUNT;
    });
  }, []);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {PHOTOS.map((p, i) => (
          <Plate
            key={p.n}
            n={p.n}
            src={p.src}
            index={i}
            onOpen={setOpen}
          />
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <Lightbox
            index={open}
            onClose={() => setOpen(null)}
            onStep={step}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default PhotoGallery;
