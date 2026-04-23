# UX/UI Upgrade Design Document
## Fathom Audio Learning Engine - S-Tier Implementation

## Overview

This design document provides detailed component specifications, CSS implementations, and animation timings for upgrading Fathom's UX/UI to S-tier quality. All designs follow the critical rules: NO gradients, NO emojis in code, Geist Sans font only, spring physics for interactions, and border-based elevation.

---

## 1. Design System Foundation

### 1.1 Color Tokens

```css
/* Primary Accents */
--accent-primary: #8B5CF6;        /* Purple-500 - Main accent */
--accent-hover: #A78BFA;          /* Purple-400 - Hover state */
--accent-active: #7C3AED;         /* Purple-600 - Active/pressed */

/* Secondary Accents */
--accent-secondary: #F59E0B;      /* Amber-500 - Warm contrast */
--accent-secondary-hover: #FBBF24; /* Amber-400 - Secondary hover */

/* Lens Colors - Temperature System */
/* Warm Lenses */
--lens-storytelling: #F97316;     /* Orange-500 */
--lens-eli5: #F59E0B;             /* Amber-500 */
--lens-analogies: #FB923C;        /* Orange-400 */

/* Cool Lenses */
--lens-deepdive: #3B82F6;         /* Blue-500 */
--lens-socratic: #8B5CF6;         /* Purple-500 */
--lens-quicksummary: #6366F1;     /* Indigo-500 */

/* Neutral Lenses */
--lens-explainsimply: #10B981;    /* Emerald-500 */
--lens-debate: #6B7280;           /* Gray-500 */

/* Note: All lens colors maintain 60-70% HSL saturation for consistency */
/* Warm: ~65% saturation, Cool: ~70% saturation, Neutral: ~60% saturation */

/* Backgrounds (keep existing) */
--bg-primary: #09090B;
--bg-secondary: #18181B;
--bg-tertiary: #27272A;

/* Borders (keep existing) */
--border-primary: rgba(255, 255, 255, 0.08);
--border-secondary: rgba(255, 255, 255, 0.04);
--border-focus: rgba(139, 92, 246, 0.5); /* Updated to purple */

/* Text (keep existing) */
--text-primary: #FAFAFA;
--text-secondary: #A1A1AA;
--text-tertiary: #71717A;
```

### 1.2 Typography Scale

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

### 1.3 Spacing System

```css
/* Base units scale proportionally */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;   /* Mobile base */
--space-5: 20px;
--space-6: 24px;   /* Desktop base */
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### 1.4 Animation Constants

```typescript
// Spring Physics (import from @/lib/motion.ts)
export const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 400,
  damping: 17
};

export const SPRING_GENTLE = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25
};

// Stagger Timings
export const STAGGER_FAST = 0.02;  // 20ms - waveform bars
export const STAGGER_NORMAL = 0.04; // 40ms - list items, cards
export const STAGGER_SLOW = 0.06;   // 60ms - large sections

// Transition Durations
export const DURATION_INSTANT = 0;
export const DURATION_FAST = 150;
export const DURATION_NORMAL = 200;
export const DURATION_SLOW = 400;
export const DURATION_EXTRA_SLOW = 800;
```

---

## 2. Component Specifications

### 2.1 Hero Voice Input Button

**File:** `client/src/components/home/VoiceInputButton.tsx`

#### Visual Specifications
- **Size:** 140px × 140px (increased from 80px)
- **Border radius:** 50% (perfect circle)
- **Background:** `var(--accent-primary)` when idle, `var(--error)` when recording
- **Icon size:** 48px (Mic icon from lucide-react)
- **Position:** Centered horizontally on home screen

#### States & Animations

**Idle State:**
```tsx
// Pulsing animation
<motion.button
  animate={{
    scale: [1, 1.05, 1]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
  className="w-[140px] h-[140px] rounded-full bg-[var(--accent-primary)]"
>
  <Mic className="w-12 h-12 text-white" />
</motion.button>
```

**Hover State:**
```tsx
whileHover={{ scale: 1.05 }}
transition={SPRING_SNAPPY}
// Background: var(--accent-hover)
```

**Recording State:**
```tsx
// Animated ring around button
<span
  className="absolute inset-[-8px] rounded-full animate-[voice-ring_2s_linear_infinite]"
  style={{
    border: '4px solid var(--error)',
    opacity: 0.6
  }}
/>

// Keyframe animation
@keyframes voice-ring {
  0% { transform: rotate(0deg); opacity: 0.6; }
  100% { transform: rotate(360deg); opacity: 0.6; }
}
```

**Error State:**
```tsx
// Shake animation
animate={{ x: [-4, 4, -4, 4, 0] }}
transition={{ duration: 0.4 }}
```

**Ripple Effect on Press:**
```tsx
// Expanding circle that fades out
<motion.span
  initial={{ scale: 0, opacity: 0.5 }}
  animate={{ scale: 2, opacity: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="absolute inset-0 rounded-full bg-[var(--accent-primary)]"
/>
```

#### Accessibility
```tsx
<motion.button
  aria-label={isRecording ? 'Stop recording' : 'Speak your topic'}
  aria-pressed={isRecording}
  className="focus:outline-none focus:ring-3 focus:ring-[var(--border-focus)] focus:ring-offset-3"
>
```

#### Word-by-Word Transcription Reveal

```tsx
// Animate transcription text word by word
function TranscriptionReveal({ text }: { text: string }) {
  const words = text.split(' ');
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05 } // 50ms per word
        }
      }}
      className="text-sm text-[var(--text-primary)]"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0, y: 4 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.2 }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
```

#### Layout & Centering

```tsx
// Home screen layout with centered voice button
<div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
  <VoiceInputButton />
  {transcription && <TranscriptionReveal text={transcription} />}
</div>
```

---

### 2.2 S-Tier Waveform Player

**File:** `client/src/components/player/WaveformPlayer.tsx`

#### Visual Specifications
- **Bar width:** 2px
- **Bar gap:** 1px
- **Container height:** 80px (mobile), 120px (desktop)
- **Container border:** 1px solid `var(--border-secondary)`
- **Container background:** `var(--bg-tertiary)`
- **Bar color:** Current lens accent color (flat, no gradient)
- **Progress indicator:** 3px wide, accent color

#### Sine Wave Algorithm

```typescript
// Generate waveform bar heights using sine wave
function generateWaveformHeights(barCount: number): number[] {
  const baseHeight = 0.3;  // 30% of container
  const amplitude = 0.4;   // 40% variation
  const frequency = 0.1;   // Wave frequency
  
  return Array.from({ length: barCount }, (_, index) => {
    const height = baseHeight + amplitude * Math.sin(index * frequency);
    return Math.max(0.1, Math.min(1, height)); // Clamp between 10% and 100%
  });
}
```

#### Stagger Animation on Load

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: {
        staggerChildren: 0.002  // 2ms delay per bar
      }
    }
  }}
>
  {waveformBars.map((height, index) => (
    <motion.div
      key={index}
      variants={{
        hidden: { scaleY: 0 },
        visible: { scaleY: height }
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        width: '2px',
        height: '100%',
        backgroundColor: lensAccentColor,
        transformOrigin: 'bottom'
      }}
    />
  ))}
</motion.div>
```

#### Hover Interaction

```tsx
// Highlight bars under cursor
const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

<div
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const barIndex = Math.floor(x / 3); // 2px bar + 1px gap
    setHoveredIndex(barIndex);
  }}
  onMouseLeave={() => setHoveredIndex(null)}
>
  {waveformBars.map((height, index) => (
    <div
      style={{
        opacity: hoveredIndex === index ? 0.6 : 1,
        backgroundColor: lensAccentColor
      }}
    />
  ))}
</div>
```

#### Scrubbing Tooltip

```tsx
// Tooltip that follows cursor
{hoveredIndex !== null && (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    className="absolute bottom-full mb-2 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs"
    style={{
      left: `${(hoveredIndex * 3)}px`,
      transform: 'translateX(-50%)'
    }}
  >
    <span>{formatTime(hoveredTime)}</span>
    {/* Mini 3-bar waveform preview */}
    <div className="flex gap-[1px] mt-1">
      {[0.6, 1, 0.8].map((h, i) => (
        <div
          key={i}
          style={{
            width: '2px',
            height: `${h * 12}px`,
            backgroundColor: lensAccentColor
          }}
        />
      ))}
    </div>
  </motion.div>
)}
```

#### Morphing Play/Pause Button

```tsx
<motion.button
  layout  // Framer Motion layout animation
  transition={{ duration: 0.2, ...SPRING_SNAPPY }}
  className="w-12 h-12 rounded-[var(--radius-button)] bg-[var(--accent)] flex items-center justify-center"
>
  <AnimatePresence mode="wait">
    {isPlaying ? (
      <motion.div
        key="pause"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90 }}
        transition={SPRING_SNAPPY}
      >
        <Pause className="w-5 h-5" />
      </motion.div>
    ) : (
      <motion.div
        key="play"
        initial={{ scale: 0, rotate: 90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: -90 }}
        transition={SPRING_SNAPPY}
      >
        <Play className="w-5 h-5 ml-0.5" />
      </motion.div>
    )}
  </AnimatePresence>
</motion.button>
```

#### Skeleton Loading State

```tsx
// Lens-colored shimmer
<div className="relative overflow-hidden bg-[var(--bg-tertiary)] rounded-[var(--radius-button)]" style={{ height: 80 }}>
  <motion.div
    animate={{ x: ['-100%', '100%'] }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    className="absolute inset-0"
    style={{
      background: `linear-gradient(90deg, transparent, ${lensAccentColor}0D, transparent)`
    }}
  />
</div>
```

#### Playhead Progress Animation

```tsx
// Smooth playhead that follows audio progress
<motion.div
  animate={{ x: `${(currentTime / duration) * 100}%` }}
  transition={{ duration: 0.1, ease: "linear" }}
  className="absolute top-0 bottom-0 w-[3px] bg-[var(--accent-primary)]"
  style={{
    boxShadow: `0 0 8px ${lensAccentColor}66`
  }}
/>
```

#### Progressive Loading

```tsx
// Show skeleton while waveform data loads
{!waveformData ? (
  <div className="relative overflow-hidden bg-[var(--bg-tertiary)] rounded-[var(--radius-button)]" style={{ height: 80 }}>
    <motion.div
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0"
      style={{
        background: `linear-gradient(90deg, transparent, ${lensAccentColor}0D, transparent)`
      }}
    />
  </div>
) : (
  <WaveformBars data={waveformData} />
)}
```

---

### 2.3 Lens Cards with Unique Visual Identity

**File:** `client/src/components/home/LensPickerDialog.tsx`

#### Grid Layout

```tsx
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {ALL_LENSES.map((lens, index) => (
    <LensCard key={lens} lens={lens} index={index} />
  ))}
</div>
```

#### Card Base Styles

```tsx
<motion.div
  variants={{
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 }
  }}
  transition={{ ...SPRING_SNAPPY, delay: index * 0.04 }}
  whileHover={{ y: -4 }}
  className="relative p-6 rounded-[var(--radius-card)] cursor-pointer"
  style={{
    backgroundColor: `${lensAccentColor}0D`, // 5% opacity
    ...getBorderPattern(lens)
  }}
>
```

#### Unique Border Patterns

```typescript
function getBorderPattern(lens: string): React.CSSProperties {
  const accent = getLensMetadata(lens).accentColor;
  
  switch (lens) {
    case 'explain-simply':
      return {
        border: `2px dashed ${accent}`,
        borderRadius: '8px'
      };
    
    case 'deep-dive':
      return {
        border: `4px solid ${accent}`
      };
    
    case 'quick-summary':
      return {
        border: `2px solid ${accent}`,
        borderRadius: '24px'
      };
    
    case 'storytelling':
      // Decorative corners with pseudo-elements (optional)
      return {
        border: `2px solid ${accent}`,
        position: 'relative'
      };
      // Add ::before and ::after for corner squares
    
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
      return {
        border: `4px dashed ${accent}`
      };
    
    case 'eli5':
      return {
        border: `3px solid ${accent}`,
        borderRadius: '16px'
      };
    
    default:
      return {
        border: `2px solid ${accent}`
      };
  }
}
```

#### Card Hover Shadow

```tsx
whileHover={{
  y: -4,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
}}
transition={{ duration: 0.2, ease: "easeOut" }}
```

#### Selected State

```tsx
{isSelected && (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={SPRING_SNAPPY}
    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center"
  >
    <Check className="w-4 h-4 text-white" />
  </motion.div>
)}

// Selected state overrides border pattern with 4px accent border
{isSelected && (
  <div
    className="absolute inset-0 rounded-[var(--radius-card)] pointer-events-none"
    style={{
      border: `4px solid ${lensAccentColor}`
    }}
  />
)}
```

#### Lens Selection Background Transition

```tsx
// Smooth background color transition when lens changes
<motion.div
  animate={{
    backgroundColor: selectedLens ? `${getLensMetadata(selectedLens).accentColor}0D` : 'transparent'
  }}
  transition={{ duration: 0.8, ease: "easeInOut" }}
  className="fixed inset-0 pointer-events-none"
/>
```

#### Lens Icon & Text

```tsx
<div className="flex flex-col gap-3">
  {/* 48px emoji icon */}
  <span className="text-5xl leading-none">{lensMetadata.icon}</span>
  
  {/* Lens name */}
  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
    {lensMetadata.name}
  </h3>
  
  {/* Lens description */}
  <p className="text-sm text-[var(--text-secondary)] opacity-70">
    {lensMetadata.description}
  </p>
</div>
```

---

### 2.4 Loading & Feedback States

#### Skeleton Screen with Shimmer

```tsx
function SkeletonCard({ lensAccent }: { lensAccent?: string }) {
  return (
    <div className="relative overflow-hidden bg-[var(--bg-secondary)] rounded-[var(--radius-card)] h-32">
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          background: lensAccent
            ? `linear-gradient(90deg, transparent, ${lensAccent}0D, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
        }}
      />
    </div>
  );
}
```

#### Success Checkmark Animation

```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: [0, 1.2, 1] }}
  transition={SPRING_SNAPPY}
  className="w-16 h-16 rounded-full bg-[var(--success)] flex items-center justify-center"
>
  <Check className="w-8 h-8 text-white" />
</motion.div>
```

#### Empty State with Pulsing CTA

```tsx
<div className="flex flex-col items-center gap-4 py-12">
  <p className="text-[var(--text-secondary)]">No tracks yet</p>
  <motion.button
    animate={{ scale: [1, 1.02, 1] }}
    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-[var(--radius-button)]"
  >
    Create your first track
  </motion.button>
</div>
```

#### Generation Progress with Phase Updates

```tsx
<AnimatePresence mode="wait">
  <motion.p
    key={generationPhase}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.2 }}
    className="text-sm text-[var(--text-secondary)]"
  >
    {generationPhase}
  </motion.p>
</AnimatePresence>
```

#### Error State with Retry

```tsx
// Error state with retry button
{error && (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-card)]"
  >
    <p className="text-sm text-[var(--error)]">{error.message}</p>
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={SPRING_SNAPPY}
      onClick={handleRetry}
      className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-[var(--radius-button)] text-sm"
    >
      Retry
    </motion.button>
  </motion.div>
)}
```

#### Network Error / Offline Indicator

```tsx
// Offline indicator with reconnect button
function OfflineIndicator({ onReconnect }: { onReconnect: () => void }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] shadow-lg"
    >
      <div className="w-2 h-2 rounded-full bg-[var(--error)] animate-pulse" />
      <span className="text-sm text-[var(--text-secondary)]">You're offline</span>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onReconnect}
        className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
      >
        Reconnect
      </motion.button>
    </motion.div>
  );
}
```

---

### 2.5 Micro-Interactions

#### Button 4-State System

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={SPRING_SNAPPY}
  disabled={isDisabled}
  className={cn(
    "px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium transition-colors",
    "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white",
    "focus:outline-none focus:ring-3 focus:ring-[var(--border-focus)] focus:ring-offset-2",
    isDisabled && "opacity-40 cursor-not-allowed"
  )}
>
  {children}
</motion.button>
```

#### Form Input Focus Animation

```tsx
<motion.input
  whileFocus={{ scale: 1.01 }}
  transition={{ duration: 0.15 }}
  className={cn(
    "px-3 py-2 rounded-[var(--radius-button)] text-sm",
    "bg-[var(--bg-tertiary)] border border-[var(--border-primary)]",
    "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
    "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent",
    "transition-colors"
  )}
/>
```

#### Stagger List Reveal

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: {
      transition: { staggerChildren: 0.04 }
    }
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={SPRING_SNAPPY}
    >
      {/* Item content */}
    </motion.div>
  ))}
</motion.div>
```

---

### 2.6 Responsive Breakpoints

#### Fluid Breakpoints

```css
/* Mobile: 320-639px */
@media (min-width: 320px) {
  :root {
    --content-padding: 16px;
    --base-spacing: 16px;
  }
}

/* Tablet: 640-1023px */
@media (min-width: 640px) {
  :root {
    --content-max-width: 640px;
    --base-spacing: 20px;
  }
}

/* Desktop: 1024-1439px */
@media (min-width: 1024px) {
  :root {
    --content-max-width: 800px;
    --base-spacing: 24px;
  }
}

/* Wide: 1440px+ */
@media (min-width: 1440px) {
  :root {
    --content-max-width: 960px;
  }
}
```

#### Touch Targets (Mobile)

```tsx
// Minimum 48px touch targets
<button className="min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px]">
```

#### Aspect Ratio for Media Stability

```tsx
// Use aspect-ratio CSS property for images and media
<img
  src={thumbnailUrl}
  alt={trackTitle}
  className="w-full rounded-[var(--radius-card)]"
  style={{ aspectRatio: '16 / 9' }}
  loading="lazy"
/>

// For video or audio waveform containers
<div
  className="w-full bg-[var(--bg-tertiary)] rounded-[var(--radius-card)]"
  style={{ aspectRatio: '21 / 9' }}
>
  {/* Waveform content */}
</div>
```

#### Bottom Sheet Modal (Mobile)

```tsx
<Drawer.Root open={open} onOpenChange={onOpenChange}>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
    <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[var(--radius-card)] bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
      {/* Drag handle */}
      <div className="mx-auto w-12 h-1 rounded-full bg-[var(--border-primary)] mt-4" />
      {children}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

---

### 2.7 Accessibility

#### Focus Indicators

```css
*:focus-visible {
  outline: 3px solid var(--border-focus);
  outline-offset: 3px;
}
```

#### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### ARIA Labels

```tsx
<button
  aria-label="Play audio"
  aria-pressed={isPlaying}
  aria-disabled={!isReady}
>
```

#### Screen Reader Announcements

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {isGenerating && generationPhase}
</div>
```

#### Lazy Loading with Placeholder

```tsx
// Lazy load images with blur-up placeholder
function LazyImage({ src, alt, placeholder }: { src: string; alt: string; placeholder?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
  }, [src]);
  
  return (
    <motion.img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      animate={{ opacity: isLoaded ? 1 : 0.5 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-[var(--radius-card)]"
      style={{
        filter: isLoaded ? 'none' : 'blur(10px)',
        aspectRatio: '16 / 9'
      }}
    />
  );
}

// Usage
<LazyImage
  src="/audio/tracks/track-123.jpg"
  alt="Track thumbnail"
  placeholder="/audio/previews/track-123-blur.jpg"
/>
```

---

## 3. Implementation Checklist

### Phase 1: Foundation (8.5 hours)
- [ ] Update CSS variables with new color tokens
- [ ] Implement fluid typography scale with clamp()
- [ ] Add spring physics constants to motion.ts
- [ ] Create skeleton loading components
- [ ] Implement lens-colored shimmer variants

### Phase 2: Hero Features (13 hours)
- [ ] Upgrade VoiceInputButton to 140px with pulsing animation
- [ ] Implement sine wave waveform algorithm
- [ ] Add waveform stagger animation on load
- [ ] Create scrubbing tooltip with mini preview
- [ ] Implement morphing play/pause button
- [ ] Create 8 unique lens card border patterns
- [ ] Add lens card hover and entrance animations

### Phase 3: Polish (15 hours)
- [ ] Apply 4-state button system to all buttons
- [ ] Add stagger animations to all lists
- [ ] Implement form input focus animations
- [ ] Add success checkmark animations
- [ ] Implement fluid breakpoints
- [ ] Create bottom-sheet modals for mobile
- [ ] Add 3px focus indicators
- [ ] Test with screen readers
- [ ] Verify WCAG AA contrast ratios
- [ ] Test prefers-reduced-motion support

---

## 4. Performance Targets

- **Animation Frame Budget:** < 16ms per frame (60fps)
- **Lighthouse Accessibility Score:** 95+ (aim for 100)
- **Color Contrast:** WCAG AA (4.5:1 minimum)
- **Touch Targets:** 48px minimum on mobile
- **Layout Shift (CLS):** < 0.1

---

## 5. Testing Checklist

### Visual Testing
- [ ] All colors are flat (no gradients)
- [ ] Typography scales smoothly across breakpoints
- [ ] Animations run at 60fps on mid-range devices
- [ ] Lens cards have distinct visual patterns
- [ ] Waveform bars are dense (2px width, 1px gap)
- [ ] Voice button is prominent (140px diameter)

### Interaction Testing
- [ ] All buttons have 4 states (rest, hover, active, disabled)
- [ ] Spring physics feel snappy (stiffness: 400, damping: 17)
- [ ] Stagger animations have correct timing (40ms delay)
- [ ] Hover states appear within 50ms
- [ ] Loading states use skeletons (not spinners)

### Responsive Testing
- [ ] Touch targets are 48px minimum on mobile
- [ ] Modals use bottom-sheet pattern on mobile
- [ ] Typography scales fluidly with clamp()
- [ ] Layout doesn't shift (CLS < 0.1)
- [ ] Content max-width adjusts per breakpoint

### Accessibility Testing
- [ ] Focus indicators are 3px thick with 3px offset
- [ ] All interactive elements have visible focus
- [ ] Screen readers announce state changes
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Animations respect prefers-reduced-motion
- [ ] Keyboard navigation works on all elements

---

**Design Document Complete** - Ready for task breakdown and implementation.
