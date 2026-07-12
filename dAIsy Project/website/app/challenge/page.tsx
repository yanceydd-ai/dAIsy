"use client";

import { motion } from "framer-motion";
import BuildDayTimeline from "@/components/timeline/BuildDayTimeline";
import RubricChart from "@/components/rubric/RubricChart";
import { CHALLENGE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { Zap, Trophy, Star } from "lucide-react";

export default function ChallengePage() {
  const c = CHALLENGE_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-challenge" />
          <p className="text-sm font-medium text-primary/50 uppercase tracking-widest">Pillar 3</p>
        </div>
        <h1 className="text-4xl font-serif font-bold">dAIsy Innovation Challenge</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.purpose}</p>
      </motion.div>

      {/* Failure requirement */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-8 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex items-center gap-2 text-accent font-semibold">
          <Zap size={16} /> The requirement that makes it real: failure
        </div>
        <p className="text-background/85 leading-relaxed">{c.failureRequirement}</p>
      </motion.div>

      {/* Structure grid */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Structure</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(c.structure).map(([key, val]) => (
            <div key={key} className="rounded-xl bg-primary/4 p-5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-sm text-primary/80 leading-relaxed">{val}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Team roles */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Team roles</h2>
        <p className="text-primary/60 text-sm">The role structure is the inclusion strategy — the girl who cannot write a line of code but can see clearly what is fair, what is useful, and what is missing is essential to the team.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.roles.map((role) => (
            <div key={role.name} className="rounded-xl border border-challenge/30 bg-challenge/8 p-5 space-y-2">
              <p className="font-semibold text-primary">{role.name}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Challenge areas */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Challenge areas</h2>
        <div className="flex flex-wrap gap-3">
          {c.challengeAreas.map((area) => (
            <span key={area.name} className="px-4 py-2 rounded-full bg-primary/8 text-sm font-medium text-primary/80">
              {area.name}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Build Day Timeline */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Sample day</h2>
        <p className="text-primary/60 text-sm">Click a session block to expand it.</p>
        <BuildDayTimeline />
      </motion.div>

      {/* Judging rubric */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Judging rubric</h2>
        <RubricChart />
      </motion.div>

      {/* STEMmy Awards */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-accent" />
          <h2 className="text-2xl font-serif font-bold">The STEMmy Awards</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {c.stemmyAwards.map((award) => (
            <div key={award} className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30">
              <Star size={12} className="text-accent" />
              <span className="text-sm font-medium text-primary">{award}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* dAIsy Studio */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">From one day to an ecosystem: the dAIsy Studio</h2>
        <p className="text-primary/70 leading-relaxed">{c.studio}</p>
      </motion.div>

      {/* SAFE AI */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">SAFE AI governance</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.safeAI.map((item) => (
            <div key={item.principle} className="rounded-xl bg-primary/4 p-5 space-y-2">
              <p className="font-semibold text-primary">{item.principle}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
