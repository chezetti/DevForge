'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a debounced version of `callback`. The latest call within `delay`ms wins.
 * Used to throttle live (autoRun) transforms so heavy work (Monaco, large JSON)
 * doesn't run on every keystroke and jank the main thread.
 *
 * The returned function is stable; `flush` runs the pending call immediately,
 * `cancel` drops it (e.g. on unmount or when switching to manual run).
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 200
): ((...args: Args) => void) & { cancel: () => void; flush: () => void } {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastArgsRef = useRef<Args | null>(null)

  // Always call the freshest callback without resetting the timer.
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    lastArgsRef.current = null
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      const args = lastArgsRef.current
      lastArgsRef.current = null
      callbackRef.current(...args)
    }
  }, [])

  // Clear any pending timer on unmount.
  useEffect(() => cancel, [cancel])

  const debounced = useCallback(
    (...args: Args) => {
      lastArgsRef.current = args
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        lastArgsRef.current = null
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as ((...args: Args) => void) & { cancel: () => void; flush: () => void }

  debounced.cancel = cancel
  debounced.flush = flush
  return debounced
}
