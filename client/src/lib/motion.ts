// Shared Framer Motion spring configs
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 350, damping: 25 };
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 300, damping: 25 };
export const SPRING_SLOW = { type: "spring" as const, stiffness: 200, damping: 20 };

// Stagger Timings
export const STAGGER_FAST = 0.002;  // 2ms - waveform bars
export const STAGGER_NORMAL = 0.04; // 40ms - list items, cards
export const STAGGER_SLOW = 0.06;   // 60ms - large sections

// Transition Durations
export const DURATION_INSTANT = 0;
export const DURATION_FAST = 150;
export const DURATION_NORMAL = 200;
export const DURATION_SLOW = 400;
export const DURATION_EXTRA_SLOW = 800;

// Page transition variants — smooth opacity crossfade
export const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const PAGE_TRANSITION = { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] } as const; // Smooth easing curve

// Staggered list container
export const STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
} as const;

// Staggered list item
export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0 },
} as const;
