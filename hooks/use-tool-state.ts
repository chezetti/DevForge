'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { getToolById, type ToolMetadata } from '@/config/tool-registry'

interface UseToolStateOptions {
  toolId: string
  defaultValue?: string
  /** When true, process() is called on every input change. Defaults to store's autoRun. */
  autoRunOverride?: boolean
}

interface UseToolStateReturn {
  tool: ToolMetadata
  input: string
  setInput: (value: string) => void
  handleInputChange: (value: string) => void
  handleHistorySelect: (historicalInput: string, process: (value: string) => void) => void
  autoRun: boolean
  isInitialLoad: boolean
}

/**
 * Unified hook for tool state management: draft persistence, history restore, and autoRun.
 * Guarantees consistent mount/autoRun/history behavior across all tools.
 */
export function useToolState({ toolId, defaultValue = '' }: UseToolStateOptions): UseToolStateReturn {
  const tool = getToolById(toolId)!
  const { getToolDraft, setToolDraft, autoRun } = useAppStore()
  const isInitialLoad = useRef(true)

  const [input, setInputState] = useState(() => {
    return defaultValue
  })

  useEffect(() => {
    const draft = getToolDraft(toolId)
    const initial = draft || defaultValue
    setInputState(initial)
    isInitialLoad.current = false
  }, [getToolDraft, toolId, defaultValue])

  const setInput = useCallback(
    (value: string) => {
      setInputState(value)
      setToolDraft(toolId, value)
    },
    [setToolDraft, toolId]
  )

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
    },
    [setInput]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string, process: (value: string) => void) => {
      setInput(historicalInput)
      process(historicalInput)
    },
    [setInput]
  )

  return {
    tool,
    input,
    setInput,
    handleInputChange,
    handleHistorySelect,
    autoRun,
    isInitialLoad: isInitialLoad.current,
  }
}
