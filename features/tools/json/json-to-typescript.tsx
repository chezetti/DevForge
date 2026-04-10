'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { validateJson, jsonToTypeScript } from '@/utils/parsers/json'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function JsonToTypeScript() {
  const tool = getToolById('json-to-typescript')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [rootName, setRootName] = useState('Root')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    if (draft) setInput(draft)
  }, [getToolDraft, tool.id])

  const processJson = useCallback(
    (value: string, name: string = rootName) => {
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
        const result = jsonToTypeScript(parsed, name)
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
    [rootName, addToolHistory, tool.id]
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

  const handleRootNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value || 'Root'
      setRootName(name)
      if (autoRun && input) {
        processJson(input, name)
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
          <Label htmlFor="rootName" className="text-xs text-muted-foreground">
            Interface name:
          </Label>
          <Input
            id="rootName"
            value={rootName}
            onChange={handleRootNameChange}
            className="h-8 w-32 text-sm bg-background border-border"
            placeholder="Root"
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="json"
          title="JSON Input"
          placeholder="Paste your JSON here..."
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="typescript"
          title="TypeScript Output"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
