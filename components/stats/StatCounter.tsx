"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface Props {
  value: number;
  suffix: string;
  label: string;
  source: string;
}

export default function StatCounter({ value, suffix, label, source }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="rounded-2xl bg-primary/4 p-6 space-y-3">
      <div className="text-4xl font-serif font-bold text-primary tabular-nums">
        {count}<span>{suffix}</span>
      </div>
      <p className="text-sm text-primary/75 leading-snug">{label}</p>
      <p className="text-xs text-primary/40">{source}</p>
    </div>
  );
}
