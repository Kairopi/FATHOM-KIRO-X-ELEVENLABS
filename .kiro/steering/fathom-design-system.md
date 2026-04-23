---
inclusion: auto
---

# Fathom Design System — Mandatory Rules

Every React component and CSS in this project MUST follow these rules. No exceptions.

## Color Rules
- Use ONLY CSS variables from `client/src/index.css`. Never hardcode hex colors.
- Backgrounds: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-tertiary)`
- Text: `var(--text-primary)` for headings, `var(--text-secondary)` for body, `var(--text-tertiary)` for muted, `var(--text-muted)` for barely visible
- Accent: `var(--accent)` ONLY for primary action buttons and active indicators. Never use it decoratively.
- Borders: `var(--border-primary)` for visible borders, `var(--border-secondary)` for subtle dividers

## ZERO Gradients Policy
- NEVER use `linear-gradient` or `radial-gradient` on any UI element
- The ONLY exception: a barely-visible radial wash at 3% opacity on Player and Auth backgrounds
- Lens identity = subtle tint background (accent color at 8-12% opacity) + emoji + text. NOT gradients.

## Typography
- Font: Geist Sans via `var(--font-sans)`. Already set on `body`.
- Headings: tight negative letter-spacing is already set in `index.css` (h1: -0.025em, h2: -0.02em, h3: -0.015em)
- Labels: use `.label` class (uppercase, 500 weight, +0.01em spacing)
- Never override font-family on individual components

## Border Radius
- Cards/modals: `var(--radius-card)` = 10px
- Buttons/inputs: `var(--radius-button)` = 6px
- Pills: `var(--radius-pill)` = 9999px
- Tags/badges: `var(--radius-small)` = 4px

## Elevation (Borders Create Depth)
- Level 0 (page): `var(--bg-primary)`, no border
- Level 1 (cards): `var(--bg-secondary)`, `border: 1px solid var(--border-primary)`
- Level 2 (modals): `var(--bg-secondary)`, `border: 1px solid var(--border-primary)`, `box-shadow: 0 16px 48px rgba(0,0,0,0.4)`
- Level 3 (popovers): `var(--bg-tertiary)`, `border: 1px solid var(--border-primary)`, `box-shadow: 0 8px 24px rgba(0,0,0,0.3)`

## Spacing
- All spacing in multiples of 4px: 4, 8, 12, 16, 20, 24, 32, 48
- Use Tailwind classes: `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px)

## Animation (Spring Physics Only)
- Import from shared constants: `SPRING_SNAPPY`, `SPRING_GENTLE`, `SPRING_SLOW`
- Button press: `whileTap={{ scale: 0.98 }}` with SPRING_SNAPPY
- Card hover: `whileHover={{ y: -1 }}` with SPRING_SNAPPY
- Dialog open: `initial={{ opacity: 0, scale: 0.98 }}` → `animate={{ opacity: 1, scale: 1 }}` with SPRING_GENTLE
- List stagger: 30ms apart, `opacity: 0 → 1`, `y: 4 → 0`
- Page transitions: opacity crossfade ONLY (200ms). NO slide animations.
- NEVER use bounce, elastic, or decorative animations
- Always wrap animated routes in `<AnimatePresence mode="wait">`

## Accessibility
- Every icon-only button needs `aria-label`
- All dialogs use shadcn Dialog (handles focus trapping)
- Visible focus rings: `outline: 2px solid var(--border-focus)`, `outline-offset: 2px`
- Respect `prefers-reduced-motion` (already in index.css)

## Component Patterns
- Use shadcn/ui components from `@/components/ui/` as base
- Import types from `@/types` (Track, LearningLens, VoicePair, etc.)
- Import store from `@/store`
- Import API client from `@/lib/api`
- Import `cn` utility from `@/lib/utils` for conditional classes
- All components are functional with TypeScript, no class components
