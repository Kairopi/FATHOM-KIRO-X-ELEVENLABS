// Shared Framer Motion configs - NO SPRINGS (they bounce and feel glitchy)
// Use simple tween animations for smooth, predictable motion
export const TWEEN_FAST = { duration: 0.15, ease: "easeOut" as const };
export const TWEEN_NORMAL = { duration: 0.2, ease: "easeOut" as const };
export const TWEEN_SLOW = { duration: 0.3, ease: "easeInOut" as const };

// Legacy spring constants (kept for backward compatibility, but use cubic-bezier instead)
// These are actually tween configs, not springs - springs were removed for being too bouncy
export const SPRING_SNAPPY = { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const };
export const SPRING_GENTLE = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };
export const SPRING_SLOW = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

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

// Page transition - simple, fast, no bounce
export const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const PAGE_TRANSITION = { 
  duration: 0.3, 
  ease: "easeInOut"
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
