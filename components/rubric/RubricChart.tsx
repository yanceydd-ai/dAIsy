"use client";

import { motion } from "framer-motion";
import { CHALLENGE_CONTENT } from "@/lib/content";

const DOMAIN_COLORS: Record<string, string> = {
  "Engage": "#E8A598",
  "Create": "#A89BC2",
  "Manage": "#7BB8D4",
  "Manage / Shape": "#7BB8D4",
  "Shape": "#F5C842",
};

export default function RubricChart() {
  return (
    <div className="space-y-3">
      {CHALLENGE_CONTENT.rubric.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary/80 flex-1 pr-4 leading-snug">{item.criterion}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/8 text-primary/60">{item.domain}</span>
              <span className="font-bold text-primary w-8 text-right">{item.weight}%</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-primary/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: DOMAIN_COLORS[item.domain] ?? "#E8A598" }}
              initial={{ width: 0 }}
              whileInView={{ width: `${item.weight * 4}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
