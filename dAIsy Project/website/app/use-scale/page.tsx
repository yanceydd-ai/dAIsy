"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import LevelSelector from "@/components/use-scale/LevelSelector";
import LevelDetail from "@/components/use-scale/LevelDetail";
import DecisionAid from "@/components/use-scale/DecisionAid";
import { USE_SCALE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Printer } from "lucide-react";

export default function UseScalePage() {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const level = USE_SCALE_CONTENT.levels[selectedLevel];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
      <motion.div
        className="space-y-4"
        initial="initial" animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <p className="text-sm font-medium text-accent uppercase tracking-widest">One instrument, all three pillars</p>
        <h1 className="text-4xl font-serif font-bold">The dAIsy AI Use Scale</h1>
        <p className="text-primary/70 text-lg max-w-2xl leading-relaxed">{USE_SCALE_CONTENT.intro}</p>
        <div className="rounded-xl border border-accent/40 bg-accent/8 px-5 py-3 inline-block">
          <p className="text-sm font-medium text-primary">{USE_SCALE_CONTENT.defaultNote}</p>
        </div>
      </motion.div>

      {/* Interactive level selector */}
      <div className="space-y-8">
        <LevelSelector selectedLevel={selectedLevel} onSelect={setSelectedLevel} />
        <LevelDetail level={level} />
      </div>

      {/* Print button */}
      <div className="flex justify-end no-print">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-sm text-primary/60 hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Printer size={14} /> Print decision-aid one-pager
        </button>
      </div>

      {/* Decision aid + design rules */}
      <DecisionAid />
    </div>
  );
}
