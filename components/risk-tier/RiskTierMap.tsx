"use client";

import { useState } from "react";
import TierColumn from "./TierColumn";
import { GOVERNANCE_CONTENT } from "@/lib/content";

export default function RiskTierMap() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {GOVERNANCE_CONTENT.riskTiers.map((tier, i) => (
        <TierColumn
          key={tier.name}
          tier={tier}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
