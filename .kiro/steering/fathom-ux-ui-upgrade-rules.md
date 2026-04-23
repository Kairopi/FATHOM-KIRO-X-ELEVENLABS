---
inclusion: auto
---

# Fathom UX/UI Upgrade — S-Tier Implementation Rules

**CRITICAL**: These rules apply to ALL work on the UX/UI upgrade spec. Every component, animation, and style MUST follow these standards.

## Core Design Principles

### 1. NO GRADIENTS Rule (Absolute)
- **ZERO gradients** on any UI element (backgrounds, borders, text)
- **ONLY exception**: Shimmer animations use gradients for MOTION effect only
- Shimmer pattern: `linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`
- Lens-colored shimmer: `linear-gradient(90deg, transparent, ${lensAccent}0D, transparent)`
- All other colors MUST be flat and solid
- If you see a gradient that's not a shimmer animation, REMOVE IT

### 2. Color System — Temperature-Based Lens Colors
```css
/* Primary Accents */
--accent-primary: #8B5CF6;        /* Purple-500 - Main accent */
--accent-hover: #A78BFA;          /* Purple-400 - Hover state */
--accent-active: #7C3AED;         /* Purple-600 - Active/pressed */

/* Secondary Accents */
--accent-secondary: #F59E0B;      /* Amber-500 - Warm contrast */
--accent-secondary-hover: #FBBF24; /* Amber-400 - Secondary hover */

/* Lens Colors - Temperature System */
/* Warm Lenses (Orange/Amber family) */
--lens-storytelling: #F97316;     /* Orange-500 */
--lens-eli5: #F59E0B;             /* Amber-500 */
--lens-analogies: #FB923C;        /* Orange-400 */

/* Cool Lenses (Blue/Purple family) */
--lens-deepdive: #3B82F6;         /* Blue-500 */
--lens-socratic: #8B5CF6;         /* Purple-500 */
--lens-quicksummary: #6366F1;     /* Indigo-500 */

/* Neutral Lenses (Green/Gray family) */
--lens-explainsimply: #10B981;    /* Emerald-500 */
--lens-debate: #6B7280;           /* Gray-500 */
```

**All lens colors maintain 60-70% HSL saturation for consistency**

### 3. Typography — Fluid Scaling with clamp()
```css
/* Display - Hero headings */
.text-display {
  font-size: clamp(36px, 4vw, 48px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.2;
}

/* H1 - Page titles */
.text-h1 {
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

/* H2 - Section titles */
.text-h2 {
  font-size: clamp(22px, 2.5vw, 32px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* H3 - Subsection titles */
.text-h3 {
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.3;
}

/* Body - Main content */
.text-body {
  font-size: clamp(14px, 1vw, 15px);
  font-weight: 400;
  letter-spacing: -0.011em;
  line-height: 1.5;
}

/* Caption - Small labels */
.text-caption {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  line-height: 1.4;
}
```

**NEVER use fixed font sizes. ALWAYS use clamp() for responsive scaling.**

### 4. Spring Physics — Snappy Interactions
```typescript
// Import from @/lib/motion
export const SPRING_SNAPPY = { type: "spring", stiffness: 400, damping: 17 };
export const SPRING_GENTLE = { type: "spring", stiffness: 300, damping: 25 };

// Stagger Timings
export const STAGGER_FAST = 0.002;  // 2ms - waveform bars
export const STAGGER_NORMAL = 0.04; // 40ms - list items, cards
export const STAGGER_SLOW = 0.06;   // 60ms - large sections

// Transition Durations
export const DURATION_FAST = 150;
export const DURATION_NORMAL = 200;
export const DURATION_SLOW = 400;
export const DURATION_EXTRA_SLOW = 800;
```

**ALL interactions MUST use SPRING_SNAPPY (stiffness: 400, damping: 17)**

### 5. Button 4-State System (Mandatory)
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={SPRING_SNAPPY}
  disabled={isDisabled}
  className={cn(
    "px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium",
    "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white",
    "focus:outline-none focus:ring-3 focus:ring-[var(--border-focus)] focus:ring-offset-3",
    isDisabled && "opacity-40 cursor-not-allowed"
  )}
>
```

**Every button MUST have:**
1. Rest state (base style)
2. Hover state (scale: 1.02, 150ms ease-out)
3. Active state (scale: 0.98, SPRING_SNAPPY)
4. Disabled state (opacity: 0.4, cursor: not-allowed)

### 6. Waveform Specifications (S-Tier Quality)
```typescript
// Bar dimensions
const BAR_WIDTH = 2;  // 2px (NOT 4px)
const BAR_GAP = 1;    // 1px (NOT 2px)

// Sine wave height algorithm
function generateWaveformHeights(barCount: number): number[] {
  const baseHeight = 0.3;  // 30% of container
  const amplitude = 0.4;   // 40% variation
  const frequency = 0.1;   // Wave frequency
  
  return Array.from({ length: barCount }, (_, index) => {
    const height = baseHeight + amplitude * Math.sin(index * frequency);
    return Math.max(0.1, Math.min(1, height)); // Clamp 10%-100%
  });
}

// Stagger animation on load
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.002 } } // 2ms delay
  }}
>
  {bars.map((height, i) => (
    <motion.div
      key={i}
      variants={{
        hidden: { scaleY: 0 },
        visible: { scaleY: height }
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        width: '2px',
        backgroundColor: lensAccentColor, // Flat color, NO gradient
        transformOrigin: 'bottom'
      }}
    />
  ))}
</motion.div>
```

**Waveform MUST:**
- Use 2px bars with 1px gap (dense Apple Music style)
- Use sine wave algorithm (NOT random heights)
- Animate in with 2ms stagger
- Use flat lens accent color (NO gradients)
- Show lens-colored shimmer skeleton while loading

### 7. Lens Card Unique Patterns (Required)
Each lens MUST have a unique border pattern:

```typescript
function getBorderPattern(lens: string): React.CSSProperties {
  const accent = getLensMetadata(lens).accentColor;
  
  switch (lens) {
    case 'explain-simply':
      return { border: `2px dashed ${accent}`, borderRadius: '8px' };
    
    case 'deep-dive':
      return { border: `4px solid ${accent}` };
    
    case 'quick-summary':
      return { border: `2px solid ${accent}`, borderRadius: '24px' };
    
    case 'storytelling':
      return { border: `2px solid ${accent}` };
    
    case 'debate':
      return {
        border: `2px solid ${accent}`,
        outline: `2px solid ${accent}80`,
        outlineOffset: '2px'
      };
    
    case 'socratic':
      return {
        border: `2px solid ${accent}`,
        boxShadow: `0 0 12px ${accent}66, inset 0 0 12px ${accent}1A`
      };
    
    case 'analogies':
      return { border: `4px dashed ${accent}` };
    
    case 'eli5':
      return { border: `3px solid ${accent}`, borderRadius: '16px' };
  }
}
```

**Lens cards MUST:**
- Have unique border pattern per lens
- Use 48px emoji icons (NOT 24px)
- Have 5% opacity background (`${accent}0D`)
- Hover: translateY(-4px) with shadow
- Selected: 4px solid border override + checkmark
- Stagger entrance: 40ms delay per card

### 8. Voice Input Button — Hero Feature
```tsx
// 140px diameter (NOT 80px)
<motion.button
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.98 }}
  className="w-[140px] h-[140px] rounded-full bg-[var(--accent-primary)]"
>
  <Mic className="w-12 h-12 text-white" /> {/* 48px icon */}
</motion.button>
```

**Voice button MUST:**
- Be 140px diameter (increased from 80px)
- Have pulsing animation when idle (scale: 1 → 1.05 → 1, 2s loop)
- Show animated ring when recording (4px stroke, rotating)
- Have 48px microphone icon
- Show word-by-word transcription reveal (50ms stagger)

### 9. Skeleton Loading States (Required)
```tsx
// Lens-colored shimmer
<div className="relative overflow-hidden bg-[var(--bg-secondary)] rounded-[var(--radius-card)]">
  <motion.div
    animate={{ x: ['-100%', '100%'] }}
    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    className="absolute inset-0"
    style={{
      background: lensAccent
        ? `linear-gradient(90deg, transparent, ${lensAccent}0D, transparent)`
        : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
    }}
  />
</div>
```

**ALL loading states MUST:**
- Use skeleton screens (NOT spinners)
- Use lens-colored shimmer when lens context available
- Animate shimmer: translateX(-100% → 100%), 2s infinite
- Fade in content with stagger when loaded

### 10. Responsive Design — Mobile-First
```css
/* Fluid Breakpoints */
@media (min-width: 320px) {  /* Mobile */
  --content-padding: 16px;
  --base-spacing: 16px;
}

@media (min-width: 640px) {  /* Tablet */
  --content-max-width: 640px;
  --base-spacing: 20px;
}

@media (min-width: 1024px) { /* Desktop */
  --content-max-width: 800px;
  --base-spacing: 24px;
}

@media (min-width: 1440px) { /* Wide */
  --content-max-width: 960px;
}
```

**Responsive MUST:**
- Use fluid breakpoints (NOT hard 768px)
- Touch targets: 48px minimum on mobile
- Modals: bottom-sheet pattern on mobile (<768px)
- Typography: clamp() for all text sizes
- Waveform: 80px mobile, 120px desktop

### 11. Accessibility — WCAG AA Compliance
```css
/* Focus indicators: 3px thick, 3px offset */
*:focus-visible {
  outline: 3px solid var(--border-focus);
  outline-offset: 3px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Accessibility MUST:**
- Focus indicators: 3px thick with 3px offset
- ARIA labels on all icon-only buttons
- Screen reader announcements for state changes
- Color contrast: WCAG AA (4.5:1 minimum)
- Respect prefers-reduced-motion
- Keyboard navigation on all interactive elements

### 12. Performance — 60fps Target
```typescript
// GPU-accelerated properties ONLY
// ✅ GOOD: transform, opacity
// ❌ BAD: left, top, width, height, margin, padding

// Example: Move element
<motion.div
  animate={{ x: 100 }}  // ✅ Uses transform: translateX()
  // NOT: animate={{ left: 100 }}  // ❌ Triggers layout
/>
```

**Performance MUST:**
- Use transform and opacity ONLY for animations
- Target: 60fps on mid-range devices
- Frame budget: < 16ms per frame
- Lazy load images with blur-up placeholder
- Layout shifts: CLS < 0.1

## Implementation Checklist

Before marking ANY task complete, verify:

- [ ] NO gradients (except shimmer animations)
- [ ] All colors use CSS variables
- [ ] Typography uses clamp() functions
- [ ] Buttons have 4-state system
- [ ] Animations use SPRING_SNAPPY
- [ ] Waveform uses 2px bars, 1px gap, sine wave
- [ ] Lens cards have unique border patterns
- [ ] Voice button is 140px diameter
- [ ] Skeleton screens use lens-colored shimmer
- [ ] Touch targets are 48px on mobile
- [ ] Focus indicators are 3px thick
- [ ] Color contrast meets WCAG AA
- [ ] Animations use transform/opacity only

## Common Mistakes to Avoid

1. ❌ Using fixed font sizes instead of clamp()
2. ❌ Adding gradients to backgrounds or borders
3. ❌ Using generic border patterns for all lens cards
4. ❌ Making voice button 80px instead of 140px
5. ❌ Using 4px waveform bars instead of 2px
6. ❌ Random waveform heights instead of sine wave
7. ❌ Forgetting lens-colored shimmer on skeletons
8. ❌ Using spinners instead of skeleton screens
9. ❌ Hard-coding 768px breakpoint instead of fluid
10. ❌ 2px focus indicators instead of 3px
11. ❌ Animating left/top instead of transform
12. ❌ Missing hover/active states on buttons

## Quality Standards

**S-Tier means:**
- Clean, professional, memorable
- Fast (60fps animations)
- Accessible (WCAG AA)
- Mobile-optimized (48px touch targets)
- Unique (distinctive waveform, lens patterns, voice button)
- Polished (spring physics, stagger animations, lens-colored shimmers)

**NOT S-Tier:**
- Generic chunky waveforms
- Small voice button (80px)
- Same border pattern for all lenses
- Spinners instead of skeletons
- Fixed font sizes
- Gradients everywhere
- Missing hover states
- Poor mobile experience

---

**Remember: Every detail matters. S-tier is in the polish.**
