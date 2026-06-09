'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

export type RevealDirection = 'left' | 'right' | 'top'

interface ScrollRevealProps {
  children: ReactNode
  /** Entry direction: left/right slide in horizontally, top slides down from above. */
  direction?: RevealDirection
  /** Delay before the transition starts once visible (ms) — use for stagger. */
  delay?: number
  className?: string
}

/**
 * Wraps content and reveals it (fade + directional slide) when it scrolls into view.
 * Transform/opacity only (GPU-friendly). The reveal lives on this wrapper, so any
 * hover transform on the child stays independent and conflict-free.
 */
export function ScrollReveal({
  children,
  direction = 'top',
  delay = 0,
  className,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      data-reveal={direction}
      data-revealed={isVisible}
      style={isVisible && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn('reveal', className)}
    >
      {children}
    </div>
  )
}
