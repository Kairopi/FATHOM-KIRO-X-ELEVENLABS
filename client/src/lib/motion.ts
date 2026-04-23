// Shared Framer Motion spring configs
// Ultra-smooth, minimal bounce for luxury feel
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 150, damping: 30 };
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 120, damping: 28 };
export const SPRING_SLOW = { type: "spring" as const, stiffness: 100, damping: 26 };

// Stagger Timings
export const STAGGER_FAST = 0.002;  // 2ms - waveform bars
export const STAGGER_NORMAL = 0.04; // 40ms - list items, cards
export const STAGGER_SLOW = 0.06;   // 60ms - large sections

// Transition Durations (in milliseconds)
export const DURATION_INSTANT = 0;
export const DURATION_FAST = 250;      // Increased from 150ms
export const DURATION_NORMAL = 350;    // Increased from 200ms  
export const DURATION_SLOW = 450;      // Increased from 400ms
export const DURATION_EXTRA_SLOW = 800;

// Page transition variants — ultra-smooth opacity crossfade with overlap
// Extended duration for buttery smooth feel
export const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

// Using 800ms for ultra-smooth, luxury app feel
export const PAGE_TRANSITION = { 
  duration: 0.8, 
  ease: [0.22, 1, 0.36, 1] // Smooth ease-out with gentle deceleration
} as const;

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
