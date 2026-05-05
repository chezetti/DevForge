'use client'

import { useEffect } from 'react'

interface ShortcutHandlers {
  onRun?: () => void
  onCopyOutput?: () => void
}

export function useKeyboardShortcuts({ onRun, onCopyOutput }: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey

      if (isCtrlOrMeta && e.key === 'Enter') {
        e.preventDefault()
        onRun?.()
      }

      if (isCtrlOrMeta && e.key === 's') {
        e.preventDefault()
        onCopyOutput?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRun, onCopyOutput])
}
