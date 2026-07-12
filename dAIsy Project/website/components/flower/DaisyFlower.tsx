"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HOME_CONTENT } from "@/lib/content";

const PETAL_CONFIGS = [
  { angle: -30,  color: "#E8A598", href: "/ambassadors",  label: "AI Ambassadors" },
  { angle: 90,   color: "#A89BC2", href: "/orchestrator", label: "AI Orchestrator" },
  { angle: 210,  color: "#7BB8D4", href: "/challenge",    label: "Innovation Challenge" },
];

function Petal({ angle, color, href, label }: typeof PETAL_CONFIGS[0]) {
  const rad = (angle * Math.PI) / 180;
  const cx = 100 + Math.sin(rad) * 48;
  const cy = 100 - Math.cos(rad) * 48;

  return (
    <Link href={href} aria-label={label}>
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={18}
        ry={32}
        fill={color}
        transform={`rotate(${angle} ${cx} ${cy})`}
        initial={{ opacity: 0.75 }}
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 1.5 }}
        whileHover={{ opacity: 1, scale: 1.08 }}
        className="cursor-pointer"
      />
    </Link>
  );
}

export default function DaisyFlower({ size = 200 }: { size?: number }) {
  const scale = size / 200;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-label="dAIsy program flower — click a petal to explore a pillar"
    >
      {/* Background petals (decorative, white) */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + Math.sin(rad) * 48;
        const cy = 100 - Math.cos(rad) * 48;
        return (
          <ellipse
            key={angle}
            cx={cx}
            cy={cy}
            rx={16}
            ry={30}
            fill="#E8E8E0"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        );
      })}

      {/* Three pillar petals */}
      {PETAL_CONFIGS.map((p) => (
        <Petal key={p.href} {...p} />
      ))}

      {/* Golden center */}
      <motion.circle
        cx={100}
        cy={100}
        r={26}
        fill="#F5C842"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Dark center dot — the AI */}
      <circle cx={100} cy={100} r={13} fill="#1B4332" />
      <text
        x={100}
        y={105}
        textAnchor="middle"
        fontSize={9}
        fontWeight="bold"
        fill="#F5C842"
        fontFamily="var(--font-inter)"
      >
        AI
      </text>
    </svg>
  );
}
