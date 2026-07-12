"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { UseScaleLevel } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { BookOpen, FileCheck, Layers } from "lucide-react";

interface Props {
  level: UseScaleLevel;
}

export default function LevelDetail({ level }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level.number}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
        variants={MOTION_VARIANTS.fadeUp}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-serif font-bold">Level {level.number}: {level.name}</h3>
          <p className="text-primary/70 text-base leading-relaxed">{level.definition}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-primary/4 p-5 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm text-primary/60">
              <BookOpen size={14} /> Scenario
            </div>
            <p className="text-sm leading-relaxed text-primary/80 italic">&ldquo;{level.scenario}&rdquo;</p>
          </div>

          <div className="rounded-xl bg-primary/4 p-5 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm text-primary/60">
              <FileCheck size={14} /> Disclosure
            </div>
            <p className="text-sm leading-relaxed text-primary/80">{level.disclosure}</p>
          </div>
        </div>

        <div className="rounded-xl border border-accent/40 bg-accent/8 p-5 space-y-2">
          <div className="flex items-center gap-2 font-medium text-sm text-primary/60">
            <Layers size={14} /> In the dAIsy program
          </div>
          <p className="text-sm text-primary/80">{level.pillarNote}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
