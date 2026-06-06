"use client";

/**
 * HeroCopy — the line of copy beneath the cairn. Words rise and settle in
 * sequence, echoing the stones being stacked. Client component so the
 * staggered framer-motion reveal can run after the hero assembles.
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";

export function HeroCopy() {
  const reduce = useReducedMotion();

  const group: Variants = {
    hidden: {},
    visible: {
      transition: {
        // Begin after the stones have largely settled.
        delayChildren: reduce ? 0 : 1.9,
        staggerChildren: reduce ? 0 : 0.12,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 0.84, 0.3, 1] },
    },
  };

  return (
    <motion.div
      variants={group}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center"
    >
      <motion.span
        variants={item}
        className="mb-5 font-mono text-[11px] uppercase tracking-[0.42em] text-accent-dim"
      >
        Stones, stacked by hand
      </motion.span>

      <motion.div
        variants={item}
        aria-hidden
        className="mt-9 h-px w-16 bg-gradient-to-r from-transparent via-accent-dim to-transparent"
      />
    </motion.div>
  );
}

export default HeroCopy;
