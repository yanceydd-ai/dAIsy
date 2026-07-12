"use client";

import { motion } from "framer-motion";
import { USE_SCALE_CONTENT } from "@/lib/content";

const LEVEL_COLORS = ["#6B7280", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

interface Props {
  selectedLevel: number;
  onSelect: (level: number) => void;
}

export default function LevelSelector({ selectedLevel, onSelect }: Props) {
  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="AI Use Scale level selector">
      {USE_SCALE_CONTENT.levels.map((level) => {
        const isSelected = selectedLevel === level.number;
        return (
          <button
            key={level.number}
            onClick={() => onSelect(level.number)}
            aria-pressed={isSelected}
            aria-label={`Level ${level.number}: ${level.name}`}
            className={[
              "relative px-5 py-3 rounded-xl font-medium text-sm transition-all",
              isSelected ? "text-white shadow-md" : "text-primary/70 bg-primary/6 hover:bg-primary/12",
            ].join(" ")}
            style={isSelected ? { backgroundColor: LEVEL_COLORS[level.number] } : {}}
          >
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                layoutId="level-indicator"
                style={{ backgroundColor: LEVEL_COLORS[level.number] }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <span className="block text-xs opacity-70">Level {level.number}</span>
              <span className="block font-semibold">{level.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
