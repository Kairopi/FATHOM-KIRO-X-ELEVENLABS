---
inclusion: fileMatch
fileMatchPattern: "client/src/**"
---

# Fathom Component Patterns — Frontend Reference

## React Component Template
Every component follows this pattern:

```tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
// import types from @/types as needed

interface Props {
  // typed props
}

export function ComponentName({ ...props }: Props) {
  // hooks first
  // derived state
  // handlers
  // render
  return (
    <div className={cn("base-classes", conditionalClass && "conditional")}>
      {/* content */}
    </div>
  );
}
```

## Lens Tint Background Pattern
When showing a lens-colored element (cards, pills, thumbnails):

```tsx
// Get the accent color from lens config
const accentColor = lensConfig.accentColor; // e.g., '#8B5CF6'

// Card background: 8% opacity tint
style={{ backgroundColor: `${accentColor}14` }}  // 14 = ~8% hex opacity

// Thumbnail background: 12% opacity tint
style={{ backgroundColor: `${accentColor}1F` }}  // 1F = ~12% hex opacity

// Left border accent
style={{ borderLeft: `2px solid ${accentColor}` }}

// Selected ring: 50% opacity
style={{ boxShadow: `0 0 0 1px ${accentColor}80` }}  // 80 = 50% hex opacity
```

NEVER use CSS gradients for lens identity. Always use opacity tints.

## Framer Motion Patterns

### Spring Constants (import from shared file)
```tsx
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 500, damping: 30 };
export const SPRING_GENTLE = { type: "spring" as const, stiffness: 300, damping: 25 };
export const SPRING_SLOW = { type: "spring" as const, stiffness: 200, damping: 20 };
```

### Button with press animation
```tsx
<motion.button
  whileTap={{ scale: 0.98 }}
  transition={SPRING_SNAPPY}
  className="..."
>
  {children}
</motion.button>
```

### Card with hover
```tsx
<motion.div
  whileHover={{ y: -1 }}
  transition={SPRING_SNAPPY}
  className="..."
>
  {children}
</motion.div>
```

### Dialog animation
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.98 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.98 }}
  transition={SPRING_GENTLE}
>
  {/* dialog content */}
</motion.div>
```

### Staggered list
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.03 } },
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 4 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={SPRING_SNAPPY}
    >
      {/* item content */}
    </motion.div>
  ))}
</motion.div>
```

## Tailwind Class Patterns

### Card (Elevation Level 1)
```
bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-card)]
```

### Button Primary
```
bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium
```

### Button Secondary/Ghost
```
bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] px-4 py-2 text-sm
```

### Input
```
bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]
```

### Pill
```
rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium
```

## Toast Pattern (Sonner)
```tsx
import { toast } from 'sonner';

// Success
toast.success('Track generated');

// Error
toast.error('Something went wrong');

// Configure Toaster in App.tsx:
<Toaster
  position="top-center"
  toastOptions={{
    style: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      color: 'var(--text-primary)',
    },
  }}
/>
```

## API Call Pattern
```tsx
import { api } from '@/lib/api';

// GET
const tracks = await api.get<Track[]>('/api/tracks');

// POST
const track = await api.post<Track>('/api/generate', { content, lens, voiceConfig });

// The api wrapper handles X-User-Id header and error toasts automatically
```
