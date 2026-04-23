import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { motion } from "framer-motion"
import { SPRING_SNAPPY } from "@/lib/motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--border-focus)] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]",
        ghost:
          "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[48px] h-12 sm:h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "min-h-[48px] h-12 sm:h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-[48px] h-12 sm:h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "min-h-[48px] h-12 sm:h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "min-h-[48px] min-w-[48px] size-12 sm:size-9",
        "icon-xs": "min-h-[48px] min-w-[48px] size-12 sm:size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "min-h-[48px] min-w-[48px] size-12 sm:size-8",
        "icon-lg": "min-h-[48px] min-w-[48px] size-12 sm:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
  "aria-live": ariaLive,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    "aria-label"?: string
    "aria-pressed"?: boolean | "true" | "false" | "mixed"
    "aria-live"?: "off" | "polite" | "assertive"
  }) {
  const Comp = asChild ? Slot.Root : "button"

  // 4-state button system: rest, hover (1.02), active (0.98), disabled (0.4 opacity)
  const MotionComp = motion(Comp)

  // Warn in dev if icon-only button is missing aria-label
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const isIconButton = size?.includes("icon")
      if (isIconButton && !ariaLabel && !asChild) {
        console.warn(
          "Button: Icon-only buttons should have an aria-label for accessibility."
        )
      }
    }
  }, [size, ariaLabel, asChild])

  return (
    <MotionComp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={SPRING_SNAPPY}
      className={cn(buttonVariants({ variant, size, className }))}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-live={ariaLive}
      {...(props as any)}
      {...(asChild ? {} : { disabled })}
    />
  )
}

export { Button, buttonVariants }
