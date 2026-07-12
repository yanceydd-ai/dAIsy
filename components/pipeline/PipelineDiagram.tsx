"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HOME_CONTENT } from "@/lib/content";

const NODE_POSITIONS = [
  { x: 50,  y: 10  },  // top
  { x: 90,  y: 60  },  // right
  { x: 65,  y: 90  },  // bottom-right
  { x: 10,  y: 60  },  // left
];

export default function PipelineDiagram() {
  const nodes = HOME_CONTENT.pipelineNodes;

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-auto" aria-hidden>
        {/* Curved arrows between nodes */}
        {nodes.map((_, i) => {
          const from = NODE_POSITIONS[i];
          const to = NODE_POSITIONS[(i + 1) % nodes.length];
          const mx = (from.x + to.x) / 2 + (i % 2 === 0 ? 12 : -12);
          const my = (from.y + to.y) / 2 + (i % 2 === 0 ? -8 : 8);
          return (
            <motion.path
              key={i}
              d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
              stroke="#1B4332"
              strokeWidth={0.8}
              strokeOpacity={0.3}
              fill="none"
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.5, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      {/* Absolute-positioned node buttons */}
      {nodes.map((node, i) => {
        const pos = NODE_POSITIONS[i];
        return (
          <motion.div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.5 + 0.2 }}
          >
            <Link href={node.href}>
              <motion.div
                className="rounded-xl px-3 py-2 text-xs font-medium text-center max-w-28 cursor-pointer shadow-sm border border-white/50"
                style={{ backgroundColor: node.color }}
                whileHover={{ scale: 1.06, y: -2 }}
                title={node.label}
              >
                {node.label}
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
