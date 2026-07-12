"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { OrchestratorTier } from "@/lib/content";
import { ChevronDown } from "lucide-react";

interface Props {
  tier: OrchestratorTier;
  isOpen: boolean;
  onToggle: () => void;
  rungIndex: number;
}

export default function LadderRung({ tier, isOpen, onToggle, rungIndex }: Props) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${tier.color}44` }}>
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-primary/3"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary shrink-0"
            style={{ backgroundColor: tier.color }}
          >
            {rungIndex + 1}
          </div>
          <div>
            <p className="font-serif font-bold text-xl text-primary">{tier.name}</p>
            <p className="text-sm text-primary/60">{tier.subtitle}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-primary/40" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-primary/8 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">She demonstrates</p>
                <ul className="space-y-1">
                  {tier.demonstrates.map((item, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-primary/75">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: tier.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Evidence required to advance</p>
                <ul className="space-y-1">
                  {tier.evidence.map((item, i) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-primary/75">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary/30" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: `${tier.color}18` }}>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Tool access earned</p>
                <p className="text-sm text-primary/80">{tier.toolAccess}</p>
              </div>

              <div className="text-xs text-primary/40">
                Cornerstone alignment: <span className="text-primary/60 font-medium">{tier.cornerstone}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
