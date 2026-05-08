'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const EXAMPLE = `.wrapper{display:flex;justify-content:center;align-items:center;padding:16px;margin:0 auto}.card{font-size:14px;color:#333;border:1px solid #ddd;border-radius:8px}`

function beautifyCss(css: string, indentSize: number): string {
  const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const ind = ' '.repeat(indentSize)
  let depth = 0
  let out = ''
  let i = 0
  const n = cssNoComments.length

  const skipWs = () => {
    while (i < n && /\s/.test(cssNoComments[i])) i++
  }

  while (i < n) {
    skipWs()
    if (i >= n) break

    const ch = cssNoComments[i]

    if (ch === '{') {
      out += ` {\n${ind.repeat(++depth)}`
      i++
      continue
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1)
      out = out.replace(/\s+$/, '')
      out += `\n${ind.repeat(depth)}}`
      i++
      if (i < n) {
        skipWs()
        if (i < n && cssNoComments[i] !== '}') out += '\n\n' + ind.repeat(depth)
      }
      continue
    }
    if (ch === ';') {
      out += ';'
      i++
      skipWs()
      if (i < n && cssNoComments[i] !== '}') out += `\n${ind.repeat(depth)}`
      continue
    }

    out += ch
    i++
  }

  return out.replace(/\n{3,}/g, '\n\n').trim()
}

export function CssBeautifier() {
  const tool = getToolById('css-beautifier')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState('2')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const process = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }
      try {
        const result = beautifyCss(value, parseInt(indent, 10))
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
    [addToolHistory, indent, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft ?? EXAMPLE
    setInput(initial)
    if (autoRun) process(initial, 'example')
    setIsInitialLoad(false)
  }, [getToolDraft, tool.id, autoRun, process])

  useEffect(() => {
    if (isInitialLoad) return
    if (autoRun && input.trim()) process(input)
  }, [indent, autoRun, input, process, isInitialLoad])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) process(value)
    },
    [setToolDraft, tool.id, autoRun, process]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      process(historicalInput)
    },
    [setToolDraft, tool.id, process]
  )

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        <Select value={indent} onValueChange={setIndent}>
          <SelectTrigger
            className="w-30 h-8 text-xs bg-background border-border"
            aria-label="Indent size"
          >
            <SelectValue placeholder="Indent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 spaces</SelectItem>
            <SelectItem value="4">4 spaces</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="css"
          title="Input"
          placeholder="Paste CSS…"
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="css"
          title="Beautified"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
