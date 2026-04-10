'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import { formatSql } from '@/utils/sql'

export function SqlFormatter() {
  const tool = getToolById('sql-formatter')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const EXAMPLE = 'select u.id,u.email,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=true group by u.id,u.email order by orders desc limit 10;'

  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const format = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }

      try {
        const result = formatSql(value)
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
    [addToolHistory, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft || EXAMPLE
    setInput(initial)
    if (autoRun) {
      format(initial, 'example')
    }
  }, [getToolDraft, tool.id, autoRun, format])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) {
        format(value)
      }
    },
    [setToolDraft, tool.id, autoRun, format]
  )

  const handleFormat = useCallback(() => {
    format(input)
  }, [format, input])

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      format(historicalInput)
    },
    [setToolDraft, tool.id, format]
  )

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="sql"
          title="SQL Input"
          placeholder="Paste your SQL query here..."
          onFormat={handleFormat}
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="sql"
          title="Formatted SQL"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
