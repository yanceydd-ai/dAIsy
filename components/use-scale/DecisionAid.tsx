"use client";

import { motion } from "framer-motion";
import { USE_SCALE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Moon, Shield } from "lucide-react";

export default function DecisionAid() {
  const { decisionAid, designRules, level0Gift } = USE_SCALE_CONTENT;
  return (
    <div className="space-y-8">
      {/* 10pm decision aid */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-8 space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2 text-accent font-medium">
          <Moon size={16} /> {decisionAid.heading}
        </div>
        <p className="text-background/85 leading-relaxed">{decisionAid.body}</p>
      </motion.div>

      {/* Design rules */}
      <motion.div
        className="space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.staggerContainer}
      >
        <h3 className="font-serif font-bold text-xl">Three design rules</h3>
        {designRules.map((rule, i) => (
          <motion.div
            key={i}
            variants={MOTION_VARIANTS.fadeUp}
            className="flex gap-3 items-start rounded-xl bg-primary/4 p-4"
          >
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-background text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-primary/80 leading-relaxed">{rule}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Level 0 is a gift */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <h3 className="font-serif font-bold text-xl">{level0Gift.heading}</h3>
        </div>
        <p className="text-primary/70 leading-relaxed">{level0Gift.body}</p>
        <blockquote className="border-l-4 border-accent pl-4 italic text-primary/60 text-sm">
          {level0Gift.analogy}
        </blockquote>
      </motion.div>
    </div>
  );
}
