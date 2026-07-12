"use client";

import { motion } from "framer-motion";
import StatsGrid from "@/components/stats/StatsGrid";
import { RESEARCH_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";

export default function ResearchPage() {
  const c = RESEARCH_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div
        className="space-y-4"
        initial="initial"
        animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <p className="text-sm font-medium text-accent uppercase tracking-widest">Evidence base</p>
        <h1 className="text-4xl font-serif font-bold">Research &amp; Evidence</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.intro}</p>
      </motion.div>

      {/* Stat counters */}
      <motion.div
        className="space-y-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">The numbers</h2>
        <StatsGrid />
      </motion.div>

      {/* Six findings */}
      <div className="space-y-8">
        <motion.h2
          className="text-2xl font-serif font-bold"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={MOTION_VARIANTS.fadeUp}
        >
          Six findings, six design choices
        </motion.h2>
        <motion.div
          className="space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={MOTION_VARIANTS.staggerContainer}
        >
          {c.findings.map((finding, i) => (
            <motion.div
              key={i}
              variants={MOTION_VARIANTS.fadeUp}
              className="rounded-2xl border border-primary/12 p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-primary shrink-0">
                  {i + 1}
                </span>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-primary">{finding.title}</h3>
                  <p className="text-sm text-primary/65 leading-relaxed">{finding.detail}</p>
                </div>
              </div>
              <div className="ml-11 rounded-xl bg-accent/12 border border-accent/25 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">dAIsy&apos;s response</p>
                <p className="text-sm text-primary/80 leading-relaxed">{finding.daisyResponse}</p>
              </div>
              <p className="ml-11 text-xs text-primary/35">Source: {finding.source}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* dAIsy Pulse */}
      <motion.div
        className="space-y-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">The dAIsy Pulse</h2>
        <p className="text-primary/60 text-sm">Benchmarked annual survey — Hockaday numbers sit next to national ones.</p>
        <div className="overflow-x-auto rounded-xl border border-primary/12">
          <table className="w-full text-sm">
            <thead className="bg-primary/6">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Survey item</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60 whitespace-nowrap">National benchmark</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60 whitespace-nowrap">dAIsy target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/8">
              {c.pulse.map((row, i) => (
                <tr key={i} className="hover:bg-primary/3">
                  <td className="px-5 py-4 text-primary/80 leading-snug">{row.item}</td>
                  <td className="px-5 py-4 font-medium text-primary whitespace-nowrap">{row.benchmark}</td>
                  <td className="px-5 py-4 text-primary/65">{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Measure of success */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-10 space-y-4 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <p className="text-sm text-background/50 uppercase tracking-widest">The measure of success</p>
        <p className="text-xl font-serif leading-relaxed text-background/90 max-w-2xl mx-auto">&ldquo;{c.successMeasure}&rdquo;</p>
      </motion.div>
    </div>
  );
}
