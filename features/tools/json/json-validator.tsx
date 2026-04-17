'use client'

import { useState, useCallback, useEffect } from 'react'
import { CheckCircle2, XCircle, Play } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { Button } from '@/components/ui/button'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { validateJson } from '@/utils/parsers/json'

export function JsonValidator() {
  const tool = getToolById('json-validator')!
  const { getToolDraft, setToolDraft, autoRun } = useAppStore()
  const EXAMPLE = `{
  "name": "Alice",
  "roles": ["admin", "editor"],
  "active": true
}`

  const [input, setInput] = useState(EXAMPLE)
  const [validation, setValidation] = useState<{
    valid: boolean
    error?: string
    line?: number
    column?: number
  } | null>(null)

  const validate = useCallback((value: string) => {
    if (!value.trim()) {
      setValidation(null)
      return
    }
    setValidation(validateJson(value))
  }, [])

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft || EXAMPLE
    setInput(initial)
    validate(initial)
  }, [getToolDraft, tool.id, validate])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) {
        validate(value)
      }
    },
    [setToolDraft, tool.id, autoRun, validate]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      validate(historicalInput)
    },
    [setToolDraft, tool.id, validate]
  )

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        !autoRun ? (
          <Button size="sm" onClick={() => validate(input)} className="h-8 px-3 text-xs gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Validate
          </Button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="json"
          title="Input"
          placeholder="Paste your JSON here to validate..."
          minHeight="400px"
        />
        <div className="border border-border rounded bg-background-secondary flex flex-col">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Result
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8" role="status" aria-live="polite">
            {validation === null ? (
              <p className="text-muted-foreground text-sm">
                Enter JSON to validate
              </p>
            ) : validation.valid ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-success-foreground" />
                <div>
                  <p className="text-lg font-medium text-foreground">Valid JSON</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The input is well-formed JSON
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center max-w-md" role="alert">
                <XCircle className="h-12 w-12 text-destructive-foreground" />
                <div>
                  <p className="text-lg font-medium text-foreground">Invalid JSON</p>
                  {validation.line && validation.column && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Error at line {validation.line}, column {validation.column}
                    </p>
                  )}
                  <p className="text-sm text-destructive-foreground mt-2 font-mono">
                    {validation.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
