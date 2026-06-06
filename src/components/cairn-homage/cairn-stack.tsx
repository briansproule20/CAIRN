"use client";

/**
 * CairnStack — the hero centerpiece. An SVG cairn of seven hand-stacked
 * stones that assembles itself from the ground up: each stone settles into
 * place with a weighty, earthy motion, its stroke drawing on as it lands.
 *
 * Echoes the brand `CairnMark` (uniform vertical spacing, the widest stone
 * at the base, tapering to the cap) but with irregular, hand-found shapes so
 * it reads as real rock rather than a logo. Palette is the favicon tan
 * (`#c8a87c`) and its accent family on the warm-dark base.
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Stones, base → cap. Each is a rounded "river stone" path centered on cx.
 * `ry` shrinks and `rx` tapers upward; small horizontal/tilt offsets keep the
 * stack from looking machined. Opacity lifts toward the cap, matching the
 * CairnMark's fade.
 */
type Stone = {
  cy: number;
  rx: number;
  ry: number;
  cx: number;
  tilt: number;
  opacity: number;
};

const STONES: Stone[] = [
  { cy: 250, rx: 78, ry: 26, cx: 152, tilt: -1.5, opacity: 1 },
  { cy: 206, rx: 64, ry: 22, cx: 149, tilt: 2, opacity: 0.96 },
  { cy: 167, rx: 70, ry: 20, cx: 154, tilt: -2.5, opacity: 0.92 },
  { cy: 132, rx: 50, ry: 19, cx: 150, tilt: 1.5, opacity: 0.86 },
  { cy: 100, rx: 40, ry: 16, cx: 152, tilt: -1, opacity: 0.78 },
  { cy: 72, rx: 30, ry: 14, cx: 150, tilt: 2.5, opacity: 0.68 },
  { cy: 48, rx: 20, ry: 11, cx: 151, tilt: -1.5, opacity: 0.55 },
];

/**
 * Build a closed, slightly irregular "stone" path: an ellipse nudged by
 * small per-quadrant deltas so each rock has its own found-on-the-trail
 * silhouette. Deterministic (seeded by index) so SSR and client match.
 */
function stonePath(s: Stone, i: number): string {
  const { cx, cy, rx, ry } = s;
  // Deterministic pseudo-random wobble per stone.
  const r = (n: number) => {
    const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return (v - Math.floor(v) - 0.5) * 2; // -1..1
  };
  const k = 0.5523; // circle→bézier constant
  const top = cy - ry * (1 + r(1) * 0.12);
  const bot = cy + ry * (1 + r(2) * 0.1);
  const left = cx - rx * (1 + r(3) * 0.08);
  const right = cx + rx * (1 + r(4) * 0.08);
  const hx = rx * k;
  const vy = ry * k;
  // Round so server (Node V8) and client (browser V8) emit identical strings
  // — avoids SVG-path hydration mismatches from sub-ULP Math.sin differences.
  const f = (x: number) => x.toFixed(2);
  return [
    `M ${f(left)} ${f(cy)}`,
    `C ${f(left)} ${f(cy - vy)}, ${f(cx - hx)} ${f(top)}, ${f(cx)} ${f(top)}`,
    `C ${f(cx + hx)} ${f(top)}, ${f(right)} ${f(cy - vy)}, ${f(right)} ${f(cy)}`,
    `C ${f(right)} ${f(cy + vy)}, ${f(cx + hx)} ${f(bot)}, ${f(cx)} ${f(bot)}`,
    `C ${f(cx - hx)} ${f(bot)}, ${f(left)} ${f(cy + vy)}, ${f(left)} ${f(cy)}`,
    "Z",
  ].join(" ");
}

const ACCENT = "#c8a87c";
const ACCENT_SOFT = "#d8bd97";
const ACCENT_DIM = "#8b7355";

export function CairnStack({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  // Stones land top-of-stack last; reverse so the base settles first.
  // A long stagger gives each stone its own weighted beat.
  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.26,
        delayChildren: reduce ? 0 : 0.15,
      },
    },
  };

  const stoneVariant: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : -34, scale: reduce ? 1 : 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        // Weighty settle: quick drop, then it sinks and holds — no bounce.
        duration: reduce ? 0.3 : 0.9,
        ease: [0.16, 0.84, 0.3, 1],
      },
    },
  };

  // The stroke that "draws" around each stone as it lands.
  const drawVariant: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: reduce ? 0.3 : 1.1, ease: "easeInOut" },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 300 300"
      className={className}
      role="img"
      aria-label="A cairn of seven stones, stacked by hand."
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <defs>
        {/* Warm radial sheen, as if low sun catches the windward face. */}
        <radialGradient id="cairn-stone-fill" cx="38%" cy="30%" r="85%">
          <stop offset="0%" stopColor={ACCENT_SOFT} />
          <stop offset="55%" stopColor={ACCENT} />
          <stop offset="100%" stopColor={ACCENT_DIM} />
        </radialGradient>
        {/* Soft contact shadow pooled beneath the base. */}
        <radialGradient id="cairn-ground" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ground shadow — fades in first, the stones land onto it. */}
      <motion.ellipse
        cx="152"
        cy="282"
        rx="92"
        ry="13"
        fill="url(#cairn-ground)"
        variants={{
          hidden: { opacity: 0, scaleX: 0.6 },
          visible: {
            opacity: 1,
            scaleX: 1,
            transition: { duration: 0.7, ease: "easeOut" },
          },
        }}
        style={{ transformOrigin: "152px 282px" }}
      />

      {STONES.map((s, i) => (
        <motion.g key={i} variants={stoneVariant}>
          {/* per-stone tilt + own contact shadow */}
          <g transform={`rotate(${s.tilt} ${s.cx} ${s.cy})`}>
            <ellipse
              cx={s.cx}
              cy={s.cy + s.ry * 0.72}
              rx={s.rx * 0.86}
              ry={s.ry * 0.34}
              fill="#000000"
              opacity={0.28}
            />
            <path
              d={stonePath(s, i)}
              fill="url(#cairn-stone-fill)"
              opacity={s.opacity}
            />
            {/* Drawn-on rim light: the stroke that assembles the silhouette. */}
            <motion.path
              d={stonePath(s, i)}
              fill="none"
              stroke={ACCENT_SOFT}
              strokeWidth={1.4}
              strokeLinecap="round"
              opacity={0.7}
              variants={drawVariant}
            />
            {/* A small catch-light to give the rock volume. */}
            <ellipse
              cx={s.cx - s.rx * 0.34}
              cy={s.cy - s.ry * 0.42}
              rx={s.rx * 0.26}
              ry={s.ry * 0.28}
              fill={ACCENT_SOFT}
              opacity={0.22}
            />
          </g>
        </motion.g>
      ))}
    </motion.svg>
  );
}

export default CairnStack;
