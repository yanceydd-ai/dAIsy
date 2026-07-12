"use client";

import { motion } from "framer-motion";
import SessionCards from "@/components/sessions/SessionCards";
import { AMBASSADORS_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Users, Heart, BookOpen } from "lucide-react";

export default function AmbassadorsPage() {
  const c = AMBASSADORS_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div
        className="space-y-4"
        initial="initial" animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-ambassadors" />
          <p className="text-sm font-medium text-primary/50 uppercase tracking-widest">Pillar 1</p>
        </div>
        <h1 className="text-4xl font-serif font-bold">Student AI Ambassadors</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.purpose}</p>
      </motion.div>

      {/* The Hockaday Way */}
      <motion.div
        className="rounded-2xl bg-ambassadors/15 border border-ambassadors/30 p-8 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-xl font-serif font-bold">The Hockaday Way</h2>
        <p className="text-primary/80 leading-relaxed">{c.hockadayWay}</p>
      </motion.div>

      {/* Who serves */}
      <motion.div
        className="space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">Who serves, and how they earn it</h2>
        <p className="text-primary/70 leading-relaxed">{c.whoServes}</p>
      </motion.div>

      {/* Onboarding sessions */}
      <motion.div
        className="space-y-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">The four onboarding sessions</h2>
        <p className="text-primary/60 text-sm">Click a session to expand it.</p>
        <SessionCards />
      </motion.div>

      {/* Division callout */}
      <motion.div
        className="grid md:grid-cols-2 gap-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.staggerContainer}
      >
        {[
          { label: "Middle School (5–8)", text: c.divisions.middle },
          { label: "Upper School (9–12)", text: c.divisions.upper },
        ].map((d) => (
          <motion.div key={d.label} variants={MOTION_VARIANTS.fadeUp} className="rounded-xl bg-primary/4 p-6 space-y-2">
            <h3 className="font-semibold text-primary">{d.label}</h3>
            <p className="text-sm text-primary/70 leading-relaxed">{d.text}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Companion AI */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-prohibited" />
          <h2 className="text-2xl font-serif font-bold">Companion AI: Educated Students, Adult Responsibility</h2>
        </div>
        <p className="text-primary/70 leading-relaxed">{c.companionAI.finding}</p>
        <p className="text-primary/70 leading-relaxed font-medium">{c.companionAI.line}</p>
        <div className="space-y-3">
          {c.companionAI.protocols.map((protocol, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="w-2 h-2 rounded-full bg-primary/40 mt-2 shrink-0" />
              <p className="text-sm text-primary/70 leading-relaxed">{protocol}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Family strand */}
      <motion.div
        className="space-y-6"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">The Family Strand</h2>
        <div className="space-y-4">
          {c.familyStrand.map((touchpoint, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-ambassadors/30 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                {i + 1}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-primary">{touchpoint.name}</p>
                <p className="text-sm text-primary/65 leading-relaxed">{touchpoint.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cornerstone */}
      <div className="flex items-center gap-2 text-sm text-primary/50">
        <BookOpen size={14} />
        <span>Cornerstone alignment: <strong className="text-primary">{c.cornerstone}</strong></span>
      </div>
    </div>
  );
}
