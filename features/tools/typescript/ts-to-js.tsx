'use client'

import { useState, useCallback, useEffect } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import * as ts from 'typescript'

export function TsToJs() {
  const tool = getToolById('ts-to-js')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const EXAMPLE = `type User = {
  id: number
  name: string
  isActive: boolean
}

export const greetUser = (user: User): string => {
  return \`Hello, \${user.name}! Active: \${user.isActive}\`
}`

  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const transpile = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }

      try {
        const result = ts.transpileModule(value, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.Preserve,
            removeComments: false,
            esModuleInterop: true,
          },
        })
        setOutput(result.outputText)
        setStatus('success')
        setErrorMessage('')
        addToolHistory({ toolId: tool.id, input: value, output: result.outputText }, { source })
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
      transpile(initial, 'example')
    }
  }, [getToolDraft, tool.id, autoRun, transpile])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) {
        transpile(value)
      }
    },
    [setToolDraft, tool.id, autoRun, transpile]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      transpile(historicalInput)
    },
    [setToolDraft, tool.id, transpile]
  )

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="typescript"
          title="TypeScript Input"
          placeholder="Paste your TypeScript code here..."
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="javascript"
          title="JavaScript Output"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
