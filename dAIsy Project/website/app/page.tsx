"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import DaisyFlower from "@/components/flower/DaisyFlower";
import PipelineDiagram from "@/components/pipeline/PipelineDiagram";
import { HOME_CONTENT } from "@/lib/content";
import { MOTION_VARIANTS } from "@/lib/motion";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16 space-y-32">

      {/* Hero */}
      <motion.section
        className="flex flex-col lg:flex-row items-center gap-16"
        initial="initial"
        animate="animate"
        variants={MOTION_VARIANTS.pageTransition}
      >
        <div className="flex-1 space-y-6">
          <p className="text-sm font-medium text-accent uppercase tracking-widest">Hockaday School</p>
          <h1 className="text-5xl font-serif font-bold leading-tight text-balance">
            dAIsy
          </h1>
          <p className="text-xl text-primary/80 leading-relaxed max-w-xl text-balance">
            &ldquo;{HOME_CONTENT.tagline}&rdquo;
          </p>
          <p className="text-base text-primary/60">{HOME_CONTENT.subtagline}</p>
          <p className="text-base text-primary/70 max-w-lg">{HOME_CONTENT.programSummary}</p>
        </div>
        <div className="shrink-0">
          <DaisyFlower size={280} />
          <p className="text-center text-xs text-primary/40 mt-3">Click a petal to explore a pillar</p>
        </div>
      </motion.section>

      {/* Pipeline */}
      <section className="space-y-8">
        <motion.div
          className="text-center space-y-2"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.fadeUp}
        >
          <h2 className="text-3xl font-serif font-bold">One renewing pipeline</h2>
          <p className="text-primary/60">{HOME_CONTENT.pipelineCaption}</p>
        </motion.div>
        <PipelineDiagram />
      </section>

      {/* Three Pillars */}
      <section className="space-y-8">
        <motion.h2
          className="text-3xl font-serif font-bold"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.fadeUp}
        >
          Three pillars, one program
        </motion.h2>
        <motion.div
          className="grid md:grid-cols-3 gap-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={MOTION_VARIANTS.staggerContainer}
        >
          {HOME_CONTENT.pillars.map((pillar) => (
            <motion.div key={pillar.number} variants={MOTION_VARIANTS.fadeUp}>
              <Link href={pillar.href} className="block h-full group">
                <div
                  className="rounded-2xl p-6 h-full space-y-4 border border-transparent hover:shadow-md transition-shadow"
                  style={{ backgroundColor: `${pillar.color}22`, borderColor: `${pillar.color}44` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary"
                      style={{ backgroundColor: pillar.color }}
                    >
                      {pillar.number}
                    </span>
                    <h3 className="font-serif font-bold text-lg">{pillar.name}</h3>
                  </div>
                  <p className="text-primary/70 text-sm leading-relaxed">{pillar.summary}</p>
                  <p className="text-xs text-primary/50 italic">{pillar.serves}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary/60 group-hover:text-primary">
                    Learn more <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* AI Use Scale callout */}
      <motion.section
        className="rounded-2xl bg-primary text-background p-10 flex flex-col md:flex-row items-center gap-8"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={MOTION_VARIANTS.fadeUp}
      >
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl font-serif font-bold">{HOME_CONTENT.scaleCallout.heading}</h2>
          <p className="text-background/80 leading-relaxed">{HOME_CONTENT.scaleCallout.body}</p>
        </div>
        <Link
          href={HOME_CONTENT.scaleCallout.href}
          className="shrink-0 px-6 py-3 rounded-full font-medium text-primary bg-accent hover:bg-accent/90 transition-colors"
        >
          Explore the AI Use Scale
        </Link>
      </motion.section>

    </div>
  );
}
