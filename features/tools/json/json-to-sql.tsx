'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { validateJson, jsonToSql } from '@/utils/parsers/json'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function JsonToSql() {
  const tool = getToolById('json-to-sql')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const EXAMPLE = `[
  { "id": 1, "name": "Alice", "country": "DE", "active": true },
  { "id": 2, "name": "Bob", "country": "US", "active": false }
]`

  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [tableName, setTableName] = useState('data')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const processJson = useCallback(
    (value: string, table: string = tableName, source: 'user' | 'example' = 'user') => {
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
        const result = jsonToSql(parsed, table)
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
    [tableName, addToolHistory, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft || EXAMPLE
    setInput(initial)
    if (autoRun) {
      processJson(initial, tableName, 'example')
    }
  }, [getToolDraft, tool.id, autoRun, processJson, tableName])

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

  const handleTableNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value || 'data'
      setTableName(name)
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
          <Label htmlFor="tableName" className="text-xs text-muted-foreground">
            Table name:
          </Label>
          <Input
            id="tableName"
            value={tableName}
            onChange={handleTableNameChange}
            className="h-8 w-32 text-sm bg-background border-border"
            placeholder="data"
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
          placeholder='Paste your JSON here... e.g. [{"id": 1, "name": "John"}]'
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="sql"
          title="SQL Output"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
