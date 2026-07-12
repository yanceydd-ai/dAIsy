"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AMBASSADORS_CONTENT } from "@/lib/content";
import { ChevronDown } from "lucide-react";

export default function SessionCards() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {AMBASSADORS_CONTENT.sessions.map((session, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="rounded-xl border border-primary/12 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-primary/4 transition-colors"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-ambassadors/30 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium text-primary">{session.title}</span>
              </div>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} className="text-primary/40" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 space-y-3 border-t border-primary/8">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-primary/40 uppercase tracking-wide">Core experience</p>
                      <p className="text-sm text-primary/80 leading-relaxed">{session.coreExperience}</p>
                    </div>
                    <div className="rounded-lg bg-ambassadors/15 px-4 py-3 space-y-1">
                      <p className="text-xs font-medium text-primary/40 uppercase tracking-wide">She leaves knowing</p>
                      <p className="text-sm text-primary/80 leading-relaxed">{session.leaves}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
