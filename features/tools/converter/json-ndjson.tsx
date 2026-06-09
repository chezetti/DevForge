'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Button } from '@/components/ui/button'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { jsonToNdjson, ndjsonToJson } from '@/utils/converters/ndjson'

type Direction = 'json-to-ndjson' | 'ndjson-to-json'

const EXAMPLE = `[
  { "id": 1, "name": "Alice", "active": true },
  { "id": 2, "name": "Bob", "active": false }
]`

export function JsonNdjson() {
  const tool = getToolById('json-ndjson')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()

  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [direction, setDirection] = useState<Direction>('json-to-ndjson')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const process = useCallback(
    (value: string, dir: Direction, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }
      try {
        const result = dir === 'json-to-ndjson' ? jsonToNdjson(value) : ndjsonToJson(value)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        addToolHistory({ toolId: tool.id, input: value, output: result }, { source })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
      }
    },
    [addToolHistory, tool.id],
  )

  const debouncedProcess = useDebouncedCallback(
    (value: string, dir: Direction) => process(value, dir),
    200,
  )

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) debouncedProcess(value, direction)
    },
    [setToolDraft, tool.id, autoRun, debouncedProcess, direction],
  )

  const handleSwap = useCallback(() => {
    const next: Direction = direction === 'json-to-ndjson' ? 'ndjson-to-json' : 'json-to-ndjson'
    // Feed current output back as input so swapping round-trips naturally.
    const nextInput = output || input
    setDirection(next)
    setInput(nextInput)
    setToolDraft(tool.id, nextInput)
    process(nextInput, next)
  }, [direction, output, input, process, setToolDraft, tool.id])

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      process(historicalInput, direction)
    },
    [setToolDraft, tool.id, process, direction],
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft || EXAMPLE
    setInput(initial)
    process(initial, 'json-to-ndjson', 'example')
    setIsInitialLoad(false)
  }, [getToolDraft, tool.id, process])

  useEffect(() => {
    if (isInitialLoad) return
    if (autoRun && input) debouncedProcess(input, direction)
  }, [direction, autoRun, input, debouncedProcess, isInitialLoad])

  const inputLang = direction === 'json-to-ndjson' ? 'json' : 'text'
  const outputLang = direction === 'json-to-ndjson' ? 'text' : 'json'

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        <Button variant="outline" size="sm" onClick={handleSwap} className="gap-2">
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
          {direction === 'json-to-ndjson' ? 'JSON → NDJSON' : 'NDJSON → JSON'}
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language={inputLang}
          title={direction === 'json-to-ndjson' ? 'JSON' : 'NDJSON'}
          placeholder={direction === 'json-to-ndjson' ? 'Paste a JSON array...' : 'Paste NDJSON lines...'}
          minHeight="100%"
        />
        <OutputPanel
          value={output}
          language={outputLang}
          title={direction === 'json-to-ndjson' ? 'NDJSON' : 'JSON'}
          status={status}
          errorMessage={errorMessage}
          minHeight="100%"
        />
      </div>
    </ToolShell>
  )
}
