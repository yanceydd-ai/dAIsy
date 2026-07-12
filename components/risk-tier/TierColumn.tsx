"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RiskTier } from "@/lib/content";
import { ChevronDown, ShieldOff, Shield, CheckCircle, AlertTriangle } from "lucide-react";

const TIER_CONFIG = {
  prohibited: { color: "#D9534F", bg: "#D9534F18", icon: ShieldOff, badge: "Blocked" },
  governed:   { color: "#F0A500", bg: "#F0A50018", icon: Shield,    badge: "Conditional" },
  approved:   { color: "#1B4332", bg: "#1B433218", icon: CheckCircle, badge: "Baseline" },
  caution:    { color: "#6B7280", bg: "#6B728018", icon: AlertTriangle, badge: "Review required" },
};

interface Props {
  tier: RiskTier;
  isOpen: boolean;
  onToggle: () => void;
}

export default function TierColumn({ tier, isOpen, onToggle }: Props) {
  const config = TIER_CONFIG[tier.variant];
  const Icon = config.icon;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${config.color}40`, backgroundColor: isOpen ? config.bg : "transparent" }}
    >
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:opacity-80"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} style={{ color: config.color }} />
          <div>
            <p className="font-semibold text-primary">{tier.name}</p>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5"
              style={{ backgroundColor: `${config.color}22`, color: config.color }}
            >
              {config.badge}
            </span>
          </div>
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
            <div className="px-5 pb-5 pt-1 space-y-4 border-t" style={{ borderColor: `${config.color}20` }}>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Categories</p>
                <ul className="space-y-1">
                  {tier.categories.map((cat, i) => (
                    <li
                      key={i}
                      className={[
                        "text-sm px-3 py-1.5 rounded-lg",
                        tier.variant === "prohibited" ? "line-through text-primary/40 bg-prohibited/8" : "text-primary/75 bg-primary/4",
                      ].join(" ")}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary/40">Hockaday posture</p>
                <p className="text-sm text-primary/70 leading-relaxed">{tier.posture}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
