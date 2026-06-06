import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { CairnStack } from "@/components/cairn-homage/cairn-stack";
import { PhotoGallery } from "@/components/cairn-homage/photo-gallery";

/**
 * /cairn — a hidden tribute to building cairns in real life.
 *
 * Not linked from the nav: discovered, not advertised. A full-bleed,
 * standalone page (no AppShell chrome) so the homage breathes on its own —
 * an animated hand-stacked cairn, then a curated exhibit of the photographs.
 */

export const metadata: Metadata = {
  title: "Cairn · Penn's Woods",
  description: "Stones, stacked by hand — somewhere in Penn's Woods.",
  openGraph: {
    title: "Cairn",
    description: "Stones, stacked by hand — somewhere in Penn's Woods.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function CairnHomagePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-base text-text">
      {/* Atmosphere: a soft warm pool behind the cairn + faint grain, so the
          base isn't a flat black. Purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[820px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(200,168,124,0.13), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative mx-auto flex min-h-[88vh] max-w-3xl flex-col items-center justify-center px-6 pb-16 pt-24">
        <CairnStack className="mb-10 h-56 w-56 sm:h-72 sm:w-72" />

        {/* Quiet scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-faint">
          The cairns ↓
        </div>
      </section>

      {/* ------------------------------------------------------------- Gallery */}
      <section className="relative mx-auto max-w-6xl px-6 pb-32">
        <header className="mx-auto mb-12 max-w-2xl border-t border-border pt-10 text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent-dim">
            Field record
          </span>
        </header>

        <PhotoGallery />

        <footer className="mt-24 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.28em] text-faint">
          <MapPin className="h-3.5 w-3.5 text-accent-dim" aria-hidden />
          somewhere in Penn&apos;s Woods
        </footer>
      </section>
    </main>
  );
}
