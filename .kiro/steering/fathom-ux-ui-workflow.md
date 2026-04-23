---
inclusion: auto
---

# Fathom UX/UI Upgrade — Implementation Workflow

**Purpose**: This document guides the step-by-step implementation of the S-tier UX/UI upgrade. Follow this workflow for every task.

## Before Starting Any Task

1. **Read the spec files**:
   - `.kiro/specs/fathom-ux-ui-upgrade/requirements.md` — What we're building and why
   - `.kiro/specs/fathom-ux-ui-upgrade/design.md` — Detailed component specs
   - `.kiro/specs/fathom-ux-ui-upgrade/tasks.md` — Task breakdown

2. **Check existing code**:
   - Read the file you're about to modify
   - Understand current implementation
   - Identify what needs to change

3. **Verify dependencies**:
   - Check if required constants exist in `@/lib/motion`
   - Check if required CSS variables exist in `client/src/index.css`
   - Check if required components exist in `@/components/ui/`

## During Implementation

### Step 1: Update Task Status
```bash
# Mark task as in_progress before starting
taskStatus(task: "X.X.X Task name", status: "in_progress")
```

### Step 2: Implement Changes
Follow this order:
1. **Import required dependencies** (motion constants, components, types)
2. **Add TypeScript interfaces** (if needed)
3. **Implement core functionality**
4. **Add animations** (SPRING_SNAPPY, stagger, etc.)
5. **Add accessibility** (aria-labels, focus states)
6. **Add responsive behavior** (mobile/desktop variants)

### Step 3: Verify Implementation
Check against requirements:
- [ ] NO gradients (except shimmer animations)
- [ ] All colors use CSS variables
- [ ] Typography uses clamp() or CSS classes
- [ ] Buttons have 4-state system
- [ ] Animations use SPRING_SNAPPY
- [ ] Skeleton screens (not spinners)
- [ ] Lens-colored shimmer when applicable
- [ ] 48px touch targets on mobile
- [ ] 3px focus indicators
- [ ] ARIA labels on icon buttons

### Step 4: Test Changes
```bash
# Run TypeScript check
npm run type-check

# Run tests (if applicable)
npm test

# Start dev server and visually verify
npm run dev
```

### Step 5: Mark Task Complete
```bash
# Only mark complete when ALL requirements met
taskStatus(task: "X.X.X Task name", status: "completed")
```

## Component Implementation Pattern

### Example: Implementing a Button Component
```tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY } from '@/lib/motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className
}: ButtonProps) {
  return (
    <motion.button
      // 4-State System
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING_SNAPPY}
      
      // Accessibility
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
      
      // Styling
      className={cn(
        // Base styles
        'px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium',
        'min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px]', // Touch targets
        'focus:outline-none focus:ring-3 focus:ring-[var(--border-focus)] focus:ring-offset-3',
        
        // Variant styles
        variant === 'primary' && [
          'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white'
        ],
        variant === 'secondary' && [
          'bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
          'border border-[var(--border-primary)]'
        ],
        
        // Disabled state
        disabled && 'opacity-40 cursor-not-allowed',
        
        // Custom classes
        className
      )}
    >
      {children}
    </motion.button>
  );
}
```

### Example: Implementing Waveform Component
```tsx
import { motion } from 'framer-motion';
import { STAGGER_FAST } from '@/lib/motion';
import { SkeletonWaveform } from '@/components/ui/skeleton';

interface WaveformPlayerProps {
  audioUrl: string;
  lensAccent: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function WaveformPlayer({
  audioUrl,
  lensAccent,
  isPlaying,
  onTogglePlay
}: WaveformPlayerProps) {
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  
  // Generate sine wave heights
  const generateWaveformHeights = (barCount: number): number[] => {
    const baseHeight = 0.3;
    const amplitude = 0.4;
    const frequency = 0.1;
    
    return Array.from({ length: barCount }, (_, index) => {
      const height = baseHeight + amplitude * Math.sin(index * frequency);
      return Math.max(0.1, Math.min(1, height));
    });
  };
  
  useEffect(() => {
    // Simulate loading waveform data
    setTimeout(() => {
      setWaveformData(generateWaveformHeights(200));
    }, 500);
  }, [audioUrl]);
  
  // Show skeleton while loading
  if (!waveformData) {
    return <SkeletonWaveform lensAccent={lensAccent} />;
  }
  
  return (
    <div className="relative w-full h-20 md:h-[120px] bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-button)]">
      {/* Waveform bars */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: STAGGER_FAST } }
        }}
        className="flex items-end justify-center h-full gap-[1px] px-4"
      >
        {waveformData.map((height, index) => (
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
              backgroundColor: lensAccent, // Flat color, NO gradient
              transformOrigin: 'bottom'
            }}
          />
        ))}
      </motion.div>
      
      {/* Play/Pause button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        transition={SPRING_SNAPPY}
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        aria-pressed={isPlaying}
        className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] flex items-center justify-center"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </motion.button>
    </div>
  );
}
```

## Common Implementation Patterns

### Pattern 1: Lens-Colored Shimmer Skeleton
```tsx
import { SkeletonCard } from '@/components/ui/skeleton';

// In your component
{isLoading ? (
  <SkeletonCard lensAccent={currentLens.accentColor} className="h-32" />
) : (
  <ActualContent />
)}
```

### Pattern 2: Stagger List Animation
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: STAGGER_NORMAL } }
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

### Pattern 3: Responsive Touch Targets
```tsx
<button className="min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px]">
  {/* Button content */}
</button>
```

### Pattern 4: Focus Indicators
```tsx
<button className="focus:outline-none focus:ring-3 focus:ring-[var(--border-focus)] focus:ring-offset-3">
  {/* Button content */}
</button>
```

### Pattern 5: Lens Background Tint
```tsx
<div
  style={{
    backgroundColor: `${lensAccent}0D` // 5% opacity
  }}
  className="p-6 rounded-[var(--radius-card)]"
>
  {/* Card content */}
</div>
```

## Quality Checklist (Before Marking Complete)

### Visual Quality
- [ ] NO gradients (except shimmer animations)
- [ ] All colors are flat and solid
- [ ] Typography scales smoothly across breakpoints
- [ ] Animations run at 60fps
- [ ] Lens cards have distinct visual patterns
- [ ] Waveform bars are dense (2px width, 1px gap)
- [ ] Voice button is prominent (140px diameter)

### Interaction Quality
- [ ] All buttons have 4 states (rest, hover, active, disabled)
- [ ] Spring physics feel snappy (stiffness: 400, damping: 17)
- [ ] Stagger animations have correct timing
- [ ] Hover states appear within 50ms
- [ ] Loading states use skeletons (not spinners)

### Responsive Quality
- [ ] Touch targets are 48px minimum on mobile
- [ ] Modals use bottom-sheet pattern on mobile
- [ ] Typography scales fluidly with clamp()
- [ ] Layout doesn't shift (CLS < 0.1)
- [ ] Content max-width adjusts per breakpoint

### Accessibility Quality
- [ ] Focus indicators are 3px thick with 3px offset
- [ ] All interactive elements have visible focus
- [ ] Screen readers announce state changes
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Animations respect prefers-reduced-motion
- [ ] Keyboard navigation works on all elements

### Performance Quality
- [ ] All animations use transform/opacity only
- [ ] No layout-triggering properties (left, top, width, height)
- [ ] Images use lazy loading
- [ ] Skeleton screens prevent layout shifts
- [ ] Frame budget < 16ms (60fps)

## Troubleshooting

### Issue: Animations feel sluggish
**Solution**: Verify using SPRING_SNAPPY (stiffness: 400, damping: 17), not SPRING_GENTLE

### Issue: Waveform looks chunky
**Solution**: Verify bar width is 2px (not 4px) and gap is 1px (not 2px)

### Issue: Voice button too small
**Solution**: Verify diameter is 140px (w-[140px] h-[140px]), not 80px

### Issue: Lens cards look the same
**Solution**: Implement unique border patterns per lens (see design.md section 2.3)

### Issue: Loading states look generic
**Solution**: Use SkeletonCard/SkeletonWaveform with lensAccent prop

### Issue: Mobile buttons too small
**Solution**: Add min-h-[48px] min-w-[48px] classes

### Issue: Focus indicators invisible
**Solution**: Verify 3px outline with 3px offset, not 2px

### Issue: Gradients appearing
**Solution**: Remove ALL gradients except shimmer animations

## Success Criteria

**You know you've achieved S-tier when:**
- Judges remember the waveform (dense, smooth, distinctive)
- Voice button is impossible to miss (140px, pulsing)
- Each lens feels unique (border patterns, colors)
- Animations feel snappy and polished (spring physics)
- Loading states feel intentional (lens-colored shimmers)
- Mobile experience feels native (48px touch targets)
- Everything is accessible (WCAG AA, keyboard nav)
- Performance is smooth (60fps, no jank)

**NOT S-tier if:**
- Waveform looks generic (chunky bars, random heights)
- Voice button is small (80px)
- Lens cards all look the same
- Spinners instead of skeletons
- Fixed font sizes
- Gradients everywhere
- Missing hover states
- Poor mobile experience

---

**Remember: S-tier is in the details. Every pixel, every animation, every interaction matters.**
