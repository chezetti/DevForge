'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { beautifyJson, validateJson } from '@/utils/parsers/json'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function JsonBeautifier() {
  const tool = getToolById('json-beautifier')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState('2')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Load draft on mount
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
        const result = beautifyJson(value, parseInt(indent))
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
    [indent, addToolHistory, tool.id]
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

  const handleFormat = useCallback(() => {
    processJson(input)
  }, [processJson, input])

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      processJson(historicalInput)
    },
    [setToolDraft, tool.id, processJson]
  )

  useEffect(() => {
    if (autoRun && input) {
      processJson(input)
    }
  }, [indent])

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        <Select value={indent} onValueChange={setIndent}>
          <SelectTrigger className="w-24 h-8 text-xs bg-background border-border">
            <SelectValue placeholder="Indent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 spaces</SelectItem>
            <SelectItem value="4">4 spaces</SelectItem>
            <SelectItem value="1">1 tab</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="json"
          title="Input"
          placeholder="Paste your JSON here..."
          onFormat={handleFormat}
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="json"
          title="Output"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
