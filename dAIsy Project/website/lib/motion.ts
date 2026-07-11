import type { Variants } from "framer-motion";

export const MOTION_VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  } satisfies Variants,

  staggerContainer: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  } satisfies Variants,

  expandHeight: {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: "auto", opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  } satisfies Variants,

  pageTransition: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  } satisfies Variants,

  nodePulse: {
    idle: { scale: 1, opacity: 0.85 },
    active: { scale: 1.08, opacity: 1, transition: { duration: 0.2 } },
  } satisfies Variants,

  petalBreath: {
    dim: { opacity: 0.8 },
    bright: { opacity: 1, transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" } },
  } satisfies Variants,
} as const;
