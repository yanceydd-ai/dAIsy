"use client";

import { motion } from "framer-motion";
import CertLadder from "@/components/ladder/CertLadder";
import { ORCHESTRATOR_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { BookOpen } from "lucide-react";

export default function OrchestratorPage() {
  const c = ORCHESTRATOR_CONTENT;
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
      <motion.div className="space-y-4" initial="initial" animate="animate" variants={MOTION_VARIANTS.pageTransition}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orchestrator" />
          <p className="text-sm font-medium text-primary/50 uppercase tracking-widest">Pillar 2</p>
        </div>
        <h1 className="text-4xl font-serif font-bold">Junior AI Orchestrator Award</h1>
        <p className="text-lg text-primary/70 max-w-2xl leading-relaxed">{c.purpose}</p>
      </motion.div>

      {/* The orchestrator metaphor */}
      <motion.div
        className="rounded-2xl bg-orchestrator/15 border border-orchestrator/30 p-8 space-y-4"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-xl font-serif font-bold">The orchestrator, not the consumer</h2>
        <p className="text-primary/80 leading-relaxed italic">&ldquo;{c.orchestratorDefinition}&rdquo;</p>
        <div className="flex flex-wrap gap-3 pt-2">
          {c.threeQuestions.map((q, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-orchestrator/20 text-sm font-medium text-primary">
              {q}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Certification ladder */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">The certification ladder</h2>
        <p className="text-primary/60 text-sm">Click a tier to expand its requirements.</p>
        <CertLadder />
      </motion.div>

      {/* Evidence types */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">How mastery is evidenced</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {c.evidenceTypes.map((e, i) => (
            <div key={i} className="rounded-xl bg-primary/4 p-5 space-y-2">
              <p className="font-semibold text-primary">{e.name}</p>
              <p className="text-sm text-primary/70 leading-relaxed">{e.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Verification-first policy */}
      <motion.div
        className="rounded-2xl border border-primary/20 p-8 space-y-5"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <h2 className="text-2xl font-serif font-bold">{c.verificationFirst.heading}</h2>
        <blockquote className="border-l-4 border-primary pl-5 text-primary/75 leading-relaxed italic">
          {c.verificationFirst.policy}
        </blockquote>
        <div className="space-y-2">
          {c.verificationFirst.jobs.map((job, i) => (
            <div key={i} className="flex gap-3 items-start text-sm text-primary/70">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs shrink-0 mt-0.5">{i + 1}</span>
              {job}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tool access */}
      <motion.div className="space-y-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={MOTION_VARIANTS.fadeUp}>
        <h2 className="text-2xl font-serif font-bold">Tiered tool access</h2>
        <div className="overflow-x-auto rounded-xl border border-primary/12">
          <table className="w-full text-sm">
            <thead className="bg-primary/6">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Access tier</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Tool</th>
                <th className="px-5 py-3 text-left font-semibold text-primary/60">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/8">
              {c.toolAccess.map((row, i) => (
                <tr key={i} className="hover:bg-primary/3">
                  <td className="px-5 py-4 font-medium text-primary">{row.tier}</td>
                  <td className="px-5 py-4 text-primary/80">{row.tool}</td>
                  <td className="px-5 py-4 text-primary/60">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="flex items-center gap-2 text-sm text-primary/50">
        <BookOpen size={14} />
        <span>Cornerstone alignment: <strong className="text-primary">{c.cornerstone}</strong></span>
      </div>
    </div>
  );
}
