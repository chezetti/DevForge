'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { minifyJson, validateJson } from '@/utils/parsers/json'

export function JsonMinifier() {
  const tool = getToolById('json-minifier')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [stats, setStats] = useState({ original: 0, minified: 0 })

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    if (draft) setInput(draft)
  }, [getToolDraft, tool.id])

  const processJson = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        setStats({ original: 0, minified: 0 })
        return
      }

      const validation = validateJson(value)
      if (!validation.valid) {
        setStatus('error')
        setErrorMessage(
          validation.line
            ? `Line ${validation.line}, Column ${validation.column}: ${validation.error}`
            : validation.error || 'Invalid JSON'
        )
        setOutput('')
        return
      }

      try {
        const result = minifyJson(value)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        setStats({ original: value.length, minified: result.length })
        addToolHistory({ toolId: tool.id, input: value, output: result })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
      }
    },
    [addToolHistory, tool.id]
  )

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) {
        processJson(value)
      }
    },
    [setToolDraft, tool.id, autoRun, processJson]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      processJson(historicalInput)
    },
    [setToolDraft, tool.id, processJson]
  )

  const savings = stats.original > 0
    ? Math.round((1 - stats.minified / stats.original) * 100)
    : 0

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="json"
          title="Input"
          placeholder="Paste your JSON here..."
          minHeight="400px"
        />
        <div className="flex flex-col gap-4">
          {stats.original > 0 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
              <span>Original: {stats.original.toLocaleString()} chars</span>
              <span>Minified: {stats.minified.toLocaleString()} chars</span>
              <span className="text-success-foreground">Saved: {savings}%</span>
            </div>
          )}
          <OutputPanel
            value={output}
            language="json"
            title="Output"
            status={status}
            errorMessage={errorMessage}
            minHeight="400px"
          />
        </div>
      </div>
    </ToolShell>
  )
}
