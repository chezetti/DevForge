'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

const EXAMPLE = `.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  margin: 0 auto;
  /* center content */
}

.card {
  font-size: 14px;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
}`

function minifyCss(input: string): string {
  let s = input.replace(/\/\*[\s\S]*?\*\//g, '')
  s = s.replace(/\s+/g, ' ')
  s = s.replace(/\s*([{}:;,>+~])\s*/g, '$1')
  s = s.replace(/;}/g, '}')
  s = s.replace(/^\s+|\s+$/g, '')
  return s.trim()
}

export function CssMinifier() {
  const tool = getToolById('css-minifier')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [stats, setStats] = useState({ original: 0, minified: 0 })

  const process = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        setStats({ original: 0, minified: 0 })
        return
      }
      try {
        const result = minifyCss(value)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        const enc = new TextEncoder()
        setStats({
          original: enc.encode(value).length,
          minified: enc.encode(result).length,
        })
        addToolHistory({ toolId: tool.id, input: value, output: result }, { source })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
        setStats({ original: 0, minified: 0 })
      }
    },
    [addToolHistory, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft ?? EXAMPLE
    setInput(initial)
    if (autoRun) process(initial, 'example')
  }, [getToolDraft, tool.id, autoRun, process])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) process(value)
    },
    [setToolDraft, tool.id, autoRun, process]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      process(historicalInput)
    },
    [setToolDraft, tool.id, process]
  )

  const saved = useMemo(() => {
    if (stats.original <= 0) return 0
    return stats.original - stats.minified
  }, [stats])

  const pct = useMemo(() => {
    if (stats.original <= 0) return 0
    return Math.round((1 - stats.minified / stats.original) * 100)
  }, [stats])

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="css"
          title="Input"
          placeholder="Paste CSS…"
          minHeight="400px"
        />
        <div className="flex flex-col gap-3 min-h-0">
          {stats.original > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
              <span>Original: {stats.original.toLocaleString()} bytes (UTF‑8)</span>
              <span>Minified: {stats.minified.toLocaleString()} bytes</span>
              <span className="text-success-foreground font-medium">
                Saved: {saved.toLocaleString()} bytes ({pct}%)
              </span>
            </div>
          )}
          <OutputPanel
            value={output}
            language="css"
            title="Minified"
            status={status}
            errorMessage={errorMessage}
            minHeight="400px"
          />
        </div>
      </div>
    </ToolShell>
  )
}
