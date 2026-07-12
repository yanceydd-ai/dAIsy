"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHALLENGE_CONTENT } from "@/lib/content";

export default function BuildDayTimeline() {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-challenge/30" />

      <div className="space-y-2">
        {CHALLENGE_CONTENT.timeline.map((slot, i) => {
          const isActive = activeSlot === i;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
            >
              <button
                className="w-full flex items-start gap-4 text-left group"
                onClick={() => setActiveSlot(isActive ? null : i)}
                aria-expanded={isActive}
              >
                <div
                  className={[
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors",
                    isActive ? "bg-challenge text-white" : "bg-challenge/20 text-primary group-hover:bg-challenge/40",
                  ].join(" ")}
                >
                  {i + 1}
                </div>
                <div className="flex-1 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-primary">{slot.title}</p>
                    <p className="text-xs text-primary/40 shrink-0 ml-4">{slot.time}</p>
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-primary/65 leading-relaxed mt-1 overflow-hidden"
                      >
                        {slot.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
