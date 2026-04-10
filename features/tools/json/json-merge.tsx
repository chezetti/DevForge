'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { DualEditorPanel } from '@/components/tools/dual-editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { validateJson, mergeJson, beautifyJson } from '@/utils/parsers/json'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function JsonMerge() {
  const tool = getToolById('json-merge')!
  const { getToolDraft, setToolDraft, getToolDraftSecondary, setToolDraftSecondary, autoRun } =
    useAppStore()
  const LEFT_EXAMPLE = `{
  "user": { "id": 1, "name": "Alice" },
  "permissions": ["read"],
  "theme": "dark"
}`
  const RIGHT_EXAMPLE = `{
  "user": { "email": "alice@example.com" },
  "permissions": ["read", "write"],
  "timezone": "Europe/Berlin"
}`

  const [leftInput, setLeftInput] = useState(LEFT_EXAMPLE)
  const [rightInput, setRightInput] = useState(RIGHT_EXAMPLE)
  const [deepMerge, setDeepMerge] = useState(true)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const draftSecondary = getToolDraftSecondary(tool.id)
    setLeftInput(draft || LEFT_EXAMPLE)
    setRightInput(draftSecondary || RIGHT_EXAMPLE)
  }, [getToolDraft, getToolDraftSecondary, tool.id])

  const handleLeftChange = useCallback(
    (value: string) => {
      setLeftInput(value)
      setToolDraft(tool.id, value)
    },
    [setToolDraft, tool.id]
  )

  const handleRightChange = useCallback(
    (value: string) => {
      setRightInput(value)
      setToolDraftSecondary(tool.id, value)
    },
    [setToolDraftSecondary, tool.id]
  )

  const output = useMemo(() => {
    if (!leftInput.trim() || !rightInput.trim()) {
      setStatus('idle')
      setErrorMessage('')
      return ''
    }

    const leftValidation = validateJson(leftInput)
    if (!leftValidation.valid) {
      setStatus('error')
      setErrorMessage(`Left input: ${leftValidation.error}`)
      return ''
    }

    const rightValidation = validateJson(rightInput)
    if (!rightValidation.valid) {
      setStatus('error')
      setErrorMessage(`Right input: ${rightValidation.error}`)
      return ''
    }

    try {
      const left = JSON.parse(leftInput)
      const right = JSON.parse(rightInput)

      if (typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) {
        setStatus('error')
        setErrorMessage('Both inputs must be JSON objects (not arrays)')
        return ''
      }

      const merged = mergeJson(left, right, deepMerge)
      setStatus('success')
      setErrorMessage('')
      return beautifyJson(JSON.stringify(merged))
    } catch (e) {
      setStatus('error')
      setErrorMessage((e as Error).message)
      return ''
    }
  }, [leftInput, rightInput, deepMerge])

  return (
    <ToolShell
      tool={tool}
      showHistory={false}
      actions={
        <div className="flex items-center gap-2">
          <Switch
            id="deep-merge"
            checked={deepMerge}
            onCheckedChange={setDeepMerge}
          />
          <Label htmlFor="deep-merge" className="text-xs text-muted-foreground">
            Deep merge
          </Label>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <DualEditorPanel
          leftValue={leftInput}
          rightValue={rightInput}
          onLeftChange={handleLeftChange}
          onRightChange={handleRightChange}
          leftTitle="Base Object"
          rightTitle="Object to Merge"
          leftPlaceholder="Paste base JSON object here..."
          rightPlaceholder="Paste JSON object to merge..."
        />
        <OutputPanel
          value={output}
          language="json"
          title="Merged Result"
          status={status}
          errorMessage={errorMessage}
          minHeight="300px"
        />
      </div>
    </ToolShell>
  )
}
