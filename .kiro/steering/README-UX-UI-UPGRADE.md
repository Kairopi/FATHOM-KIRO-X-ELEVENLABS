---
inclusion: manual
---

# Fathom UX/UI Upgrade — Expert Implementation Guide

## 📋 Overview

This directory contains expert-level steering documentation and agent hooks for the S-tier UX/UI upgrade. These resources ensure end-to-end quality and consistency throughout implementation.

## 📚 Steering Documents

### 1. **fathom-ux-ui-upgrade-rules.md** (Auto-included)
**Purpose**: Mandatory implementation rules for all UX/UI work
**Key Topics**:
- NO GRADIENTS rule (absolute)
- Temperature-based lens color system
- Fluid typography with clamp()
- Spring physics (stiffness: 400, damping: 17)
- Button 4-state system
- Waveform specifications (2px bars, sine wave)
- Lens card unique patterns
- Voice button hero specs (140px)
- Skeleton loading states
- Responsive design (mobile-first)
- Accessibility (WCAG AA)
- Performance (60fps target)

### 2. **fathom-ux-ui-workflow.md** (Auto-included)
**Purpose**: Step-by-step implementation workflow
**Key Topics**:
- Before starting any task
- During implementation (5-step process)
- Component implementation patterns
- Common patterns (shimmer, stagger, touch targets)
- Quality checklist
- Troubleshooting guide
- Success criteria

### 3. **fathom-design-system.md** (Auto-included)
**Purpose**: Core design system rules (existing)
**Key Topics**:
- Color variables
- Typography system
- Border radius tokens
- Elevation system
- Animation constants
- Accessibility standards

### 4. **fathom-component-patterns.md** (Auto-included)
**Purpose**: React component patterns (existing)
**Key Topics**:
- Component template
- Lens tint backgrounds
- Framer Motion patterns
- Tailwind class patterns
- API call patterns

### 5. **fathom-architecture.md** (Auto-included)
**Purpose**: Project architecture and coding standards (existing)
**Key Topics**:
- Project structure
- Frontend patterns
- Backend patterns
- Database patterns
- API integrations

## 🪝 Agent Hooks

### Quality Enforcement Hooks (Auto-run on file save)

1. **ux-ui-gradient-check.kiro.hook**
   - Prevents gradients from being added
   - Runs on: CSS, TSX, TS file edits
   - Action: Removes gradients, keeps only shimmer animations

2. **ux-ui-animation-performance.kiro.hook**
   - Ensures GPU-accelerated animations
   - Runs on: TSX, TS file edits
   - Action: Refactors layout-triggering animations to transform/opacity

3. **ux-ui-accessibility-check.kiro.hook**
   - Verifies accessibility requirements
   - Runs on: TSX file edits
   - Action: Adds missing ARIA labels, focus states

4. **ux-ui-button-states.kiro.hook**
   - Enforces 4-state button system
   - Runs on: TSX file edits
   - Action: Adds missing hover/tap/disabled states

5. **ux-ui-typography-check.kiro.hook**
   - Ensures fluid typography scaling
   - Runs on: CSS, TSX file edits
   - Action: Replaces fixed font sizes with clamp()

6. **ux-ui-lens-colors.kiro.hook**
   - Validates lens color usage
   - Runs on: TSX, TS, CSS file edits
   - Action: Fixes hardcoded colors, wrong variable names

7. **ux-ui-waveform-specs.kiro.hook**
   - Validates waveform implementation
   - Runs on: WaveformPlayer.tsx edits
   - Action: Fixes bar dimensions, algorithm, colors

8. **ux-ui-voice-button-specs.kiro.hook**
   - Validates voice button specs
   - Runs on: VoiceInputButton.tsx edits
   - Action: Fixes size, icon, animations

9. **ux-ui-skeleton-loading.kiro.hook**
   - Enforces skeleton screens
   - Runs on: TSX file edits
   - Action: Replaces spinners with skeletons

10. **ux-ui-mobile-touch-targets.kiro.hook**
    - Validates touch target sizes
    - Runs on: TSX file edits
    - Action: Adds min-h/min-w classes for mobile

11. **ts-check-on-save.kiro.hook** (Existing)
    - TypeScript error checking
    - Runs on: TS, TSX file edits
    - Action: Fixes type errors

### Manual Validation Hooks (User-triggered)

12. **ux-ui-pre-commit-check.kiro.hook**
    - Comprehensive quality check
    - Trigger: Manual (before committing)
    - Action: Runs all 12 validation checks, reports issues

13. **ux-ui-task-completion-check.kiro.hook**
    - Task completion validation
    - Trigger: Before marking task complete
    - Action: Validates all requirements met

## 🎯 How to Use This System

### For New Tasks

1. **Read the spec files**:
   ```
   .kiro/specs/fathom-ux-ui-upgrade/requirements.md
   .kiro/specs/fathom-ux-ui-upgrade/design.md
   .kiro/specs/fathom-ux-ui-upgrade/tasks.md
   ```

2. **Follow the workflow** (fathom-ux-ui-workflow.md):
   - Mark task as in_progress
   - Implement changes
   - Verify implementation
   - Test changes
   - Mark task as completed

3. **Let hooks enforce quality**:
   - Hooks auto-run on file save
   - Fix issues as they're detected
   - Don't fight the hooks—they ensure S-tier quality

### For Quality Checks

1. **Before committing**:
   ```
   Trigger: ux-ui-pre-commit-check hook
   ```

2. **Before marking task complete**:
   ```
   The ux-ui-task-completion-check hook runs automatically
   ```

3. **Manual verification**:
   - Check tasks.md for completion status
   - Run `npm run type-check`
   - Run `npm run dev` and visually verify
   - Test on mobile (responsive design tools)

## 🚀 Quick Reference

### Critical Rules (Never Break These)
1. ❌ NO GRADIENTS (except shimmer animations)
2. ✅ All colors use CSS variables
3. ✅ Typography uses clamp() functions
4. ✅ Buttons have 4-state system
5. ✅ Animations use SPRING_SNAPPY
6. ✅ Waveform: 2px bars, 1px gap, sine wave
7. ✅ Voice button: 140px diameter, 48px icon
8. ✅ Lens cards: unique border patterns
9. ✅ Skeletons: lens-colored shimmer
10. ✅ Mobile: 48px touch targets
11. ✅ Accessibility: 3px focus indicators
12. ✅ Performance: transform/opacity only

### Common Patterns

**Lens-colored shimmer**:
```tsx
<SkeletonCard lensAccent={lensColor} />
```

**Button 4-state**:
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={SPRING_SNAPPY}
  disabled={isDisabled}
/>
```

**Stagger animation**:
```tsx
<motion.div
  variants={{
    visible: { transition: { staggerChildren: STAGGER_NORMAL } }
  }}
/>
```

**Responsive touch targets**:
```tsx
className="min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px]"
```

## 📊 Quality Metrics

### S-Tier Standards
- ✅ NO gradients (except shimmer)
- ✅ 60fps animations
- ✅ WCAG AA contrast (4.5:1)
- ✅ 48px mobile touch targets
- ✅ 3px focus indicators
- ✅ < 16ms frame budget
- ✅ CLS < 0.1 (layout shifts)
- ✅ Lighthouse accessibility 95+

### Implementation Phases
- **Phase 1: Foundation** (8.5h) — Design system, skeletons, feedback
- **Phase 2: Hero Features** (13h) — Voice button, waveform, lens cards
- **Phase 3: Polish** (15h) — Buttons, lists, responsive, accessibility

## 🔧 Troubleshooting

### Hook Not Running?
- Check `.kiro/hooks/` directory
- Verify `"enabled": true` in hook file
- Check file pattern matches edited file

### Validation Failing?
- Read the hook's error message
- Check steering docs for correct implementation
- Fix issues and save again

### Task Won't Mark Complete?
- Run ux-ui-task-completion-check hook
- Fix all reported issues
- Verify all requirements met

## 📝 Notes

- All steering docs are auto-included (no need to reference manually)
- Hooks run automatically on file save (no manual trigger needed)
- Pre-commit and task-completion hooks are manual triggers
- Follow the workflow document for step-by-step guidance
- When in doubt, check the design.md for detailed specs

---

**Remember: These tools exist to help you achieve S-tier quality. Work with them, not against them.**
