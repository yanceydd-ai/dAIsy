"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import RiskTierMap from "@/components/risk-tier/RiskTierMap";
import { GOVERNANCE_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { RefreshCw } from "lucide-react";

export default function GovernancePage() {
  const c = GOVERNANCE_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <p className="text-sm font-medium text-accent uppercase tracking-widest">Program governance</p>
        <h1 className="text-4xl font-serif font-bold">Governance</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.intro}</p>
      </motion.div>

      {/* Verification-first callout */}
      <motion.div
        className="rounded-2xl border-l-4 border-orchestrator bg-orchestrator/8 px-8 py-6 space-y-3"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <blockquote className="text-lg font-serif text-primary/80 leading-relaxed">
          &ldquo;{c.verificationFirst.quote}&rdquo;
        </blockquote>
        <Link href={c.verificationFirst.link.href} className="text-sm font-medium text-orchestrator hover:underline">
          {c.verificationFirst.link.label}
        </Link>
      </motion.div>

      {/* Tool Risk Tier Map */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">The Hockaday Tool Risk Tier Map</h2>
        <p className="text-primary/60 text-sm">Click a tier to expand tool categories and Hockaday&apos;s posture.</p>
        <RiskTierMap />
      </motion.div>

      {/* SAFE AI */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">SAFE AI framework</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {c.safeAI.map((item) => (
            <div key={item.principle} className="rounded-xl bg-primary/4 p-5 space-y-2">
              <p className="font-semibold text-primary">{item.principle}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Iteration loops */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-primary" />
          <h2 className="text-2xl font-serif font-bold">Built to iterate: four feedback loops</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-primary/12">
          <table className="w-full text-sm">
            <thead className="bg-primary/6">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Loop</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Cadence</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Owner</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Can change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/8">
              {c.iterationLoops.map((loop, i) => (
                <tr key={i} className="hover:bg-primary/3">
                  <td className="px-5 py-4 text-primary/80 leading-snug">{loop.loop}</td>
                  <td className="px-5 py-4 text-primary/65 whitespace-nowrap">{loop.cadence}</td>
                  <td className="px-5 py-4 text-primary/65">{loop.owner}</td>
                  <td className="px-5 py-4 text-primary/65">{loop.canChange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Closing statement */}
      <motion.div
        className="rounded-2xl bg-primary text-background p-10 text-center space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <p className="text-xl font-serif leading-relaxed text-background/90 max-w-2xl mx-auto">
          &ldquo;{c.closingStatement}&rdquo;
        </p>
      </motion.div>
    </div>
  );
}
