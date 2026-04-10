'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { DualEditorPanel } from '@/components/tools/dual-editor-panel'
import { DiffViewer } from '@/components/tools/diff-viewer'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { beautifyJson, validateJson } from '@/utils/parsers/json'

export function JsonDiff() {
  const tool = getToolById('json-diff')!
  const { getToolDraft, setToolDraft, getToolDraftSecondary, setToolDraftSecondary } =
    useAppStore()
  const LEFT_EXAMPLE = `{
  "id": 7,
  "name": "Project Alpha",
  "status": "draft",
  "members": 3
}`
  const RIGHT_EXAMPLE = `{
  "id": 7,
  "name": "Project Alpha",
  "status": "published",
  "members": 5
}`

  const [leftInput, setLeftInput] = useState(LEFT_EXAMPLE)
  const [rightInput, setRightInput] = useState(RIGHT_EXAMPLE)

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

  const { leftFormatted, rightFormatted, error } = useMemo(() => {
    let left = ''
    let right = ''
    let nextError = ''

    if (leftInput.trim()) {
      const validation = validateJson(leftInput)
      if (validation.valid) {
        try {
          left = beautifyJson(leftInput)
        } catch {
          left = leftInput
        }
      } else {
        left = leftInput
        if (!rightInput.trim() || validateJson(rightInput).valid) {
          nextError = 'Left input is not valid JSON'
        }
      }
    }

    if (rightInput.trim()) {
      const validation = validateJson(rightInput)
      if (validation.valid) {
        try {
          right = beautifyJson(rightInput)
        } catch {
          right = rightInput
        }
      } else {
        right = rightInput
        if (!leftInput.trim() || validateJson(leftInput).valid) {
          nextError = 'Right input is not valid JSON'
        }
      }
    }

    return { leftFormatted: left, rightFormatted: right, error: nextError }
  }, [leftInput, rightInput])

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="flex flex-col gap-4">
        <DualEditorPanel
          leftValue={leftInput}
          rightValue={rightInput}
          onLeftChange={handleLeftChange}
          onRightChange={handleRightChange}
          leftTitle="Original"
          rightTitle="Modified"
          leftPlaceholder="Paste first JSON here..."
          rightPlaceholder="Paste second JSON here..."
        />
        {error && (
          <p className="text-sm text-destructive-foreground px-1">{error}</p>
        )}
        <DiffViewer
          left={leftFormatted}
          right={rightFormatted}
          leftTitle="Original"
          rightTitle="Modified"
        />
      </div>
    </ToolShell>
  )
}
