'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

interface UseScrollRevealOptions {
  /** Fraction of the element that must be visible to trigger (0–1). */
  threshold?: number
  /** Reveal only once, then stop observing. */
  once?: boolean
  /** Scroll container to observe against. Defaults to the viewport. */
  root?: RefObject<Element | null> | null
  /** Margin around the root box (CSS-style). Negative bottom delays reveal slightly. */
  rootMargin?: string
}

/**
 * Reveal-on-scroll via IntersectionObserver. Returns a `ref` to attach and an
 * `isVisible` flag. Respects `prefers-reduced-motion` (reveals immediately) and
 * degrades gracefully when IntersectionObserver is unavailable.
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const {
    threshold = 0.15,
    once = true,
    root = null,
    rootMargin = '0px 0px -5% 0px',
  } = options

  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reduced motion or no IO support: show immediately, no offset/transition.
    if (
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setIsVisible(false)
          }
        }
      },
      { threshold, root: root?.current ?? null, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, once, root, rootMargin])

  return { ref, isVisible }
}
