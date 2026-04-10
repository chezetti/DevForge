'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { validateJson, jsonToCsv } from '@/utils/parsers/json'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function JsonToCsv() {
  const tool = getToolById('json-to-csv')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    if (draft) setInput(draft)
  }, [getToolDraft, tool.id])

  const processJson = useCallback(
    (value: string, headers: boolean = includeHeaders) => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }

      const validation = validateJson(value)
      if (!validation.valid) {
        setStatus('error')
        setErrorMessage(validation.error || 'Invalid JSON')
        setOutput('')
        return
      }

      try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed)) {
          setStatus('error')
          setErrorMessage('JSON must be an array of objects')
          setOutput('')
          return
        }
        const result = jsonToCsv(parsed, headers)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        addToolHistory({ toolId: tool.id, input: value, output: result })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
      }
    },
    [includeHeaders, addToolHistory, tool.id]
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

  const handleHeadersChange = useCallback(
    (checked: boolean) => {
      setIncludeHeaders(checked)
      if (autoRun && input) {
        processJson(input, checked)
      }
    },
    [autoRun, input, processJson]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      processJson(historicalInput)
    },
    [setToolDraft, tool.id, processJson]
  )

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        <div className="flex items-center gap-2">
          <Switch
            id="include-headers"
            checked={includeHeaders}
            onCheckedChange={handleHeadersChange}
          />
          <Label htmlFor="include-headers" className="text-xs text-muted-foreground">
            Include headers
          </Label>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="json"
          title="JSON Input"
          placeholder='Paste your JSON array here... e.g. [{"name": "John", "age": 30}]'
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="plaintext"
          title="CSV Output"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
