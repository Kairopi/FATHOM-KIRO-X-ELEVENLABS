// Shared Framer Motion spring configs
// Reduced stiffness and increased damping for smoother, less bouncy animations
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 260, damping: 30 };
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 200, damping: 28 };
export const SPRING_SLOW = { type: "spring" as const, stiffness: 150, damping: 25 };

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

// Page transition variants — smooth opacity crossfade
// Industry standard: 400-500ms for page transitions (Material Design, iOS HIG)
export const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

// Using 450ms with smooth easing curve for polished feel
export const PAGE_TRANSITION = { 
  duration: 0.45, 
  ease: [0.25, 0.1, 0.25, 1.0] // Standard easeInOut cubic-bezier
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
