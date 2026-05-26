"use client";

import { motion } from "framer-motion";
import { Gem } from "lucide-react";

export default function ThinkingMotion() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2.5 backdrop-blur-xl">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.08, 1],
          }}
          transition={{
            rotate: { duration: 5, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
          }}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/12"
        >
          <Gem className="h-4 w-4 text-cyan-100" />
        </motion.div>

        <div className="flex items-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={0.15} />
          <Dot delay={0.3} />
        </div>

        <p className="text-xs font-medium text-white/70">
          جاري تحليل القطعة
        </p>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{
        y: [0, -4, 0],
        opacity: [0.35, 1, 0.35],
      }}
      transition={{
        duration: 0.75,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className="h-1.5 w-1.5 rounded-full bg-cyan-100"
    />
  );
}