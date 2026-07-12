"use client";

import { useState } from "react";
import LadderRung from "./LadderRung";
import { ORCHESTRATOR_CONTENT } from "@/lib/content";

export default function CertLadder() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {ORCHESTRATOR_CONTENT.tiers.map((tier, i) => (
        <LadderRung
          key={tier.name}
          tier={tier}
          rungIndex={i}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
