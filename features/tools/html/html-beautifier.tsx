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

const EXAMPLE = `<div class="container"><h1>Hello World</h1><p>This is a paragraph.</p><ul><li>One</li><li>Two</li></ul></div>`

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function tokenizeHtml(html: string): string[] {
  const tokens: string[] = []
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?]]>|<\/?[^>]+>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) {
      const text = html.slice(last, m.index)
      if (text) tokens.push(text)
    }
    tokens.push(m[0])
    last = m.index + m[0].length
  }
  if (last < html.length) {
    const text = html.slice(last)
    if (text) tokens.push(text)
  }
  return tokens
}

function tagNameFromOpenTag(tag: string): string | null {
  const m = /^<\s*\/?\s*([a-zA-Z0-9:-]+)/.exec(tag)
  return m ? m[1].toLowerCase() : null
}

function isClosingTag(token: string): boolean {
  return /^<\s*\/[^>]+>/.test(token)
}

function isOpeningTag(token: string): boolean {
  if (!/^<[^!?/]/.test(token)) return false
  if (/\/\s*>$/.test(token)) return false
  const name = tagNameFromOpenTag(token)
  return !!(name && !VOID_TAGS.has(name))
}

function isSelfClosingTag(token: string): boolean {
  if (!/^<[^!]/.test(token)) return false
  if (/\/\s*>$/.test(token)) return true
  const name = tagNameFromOpenTag(token)
  return !!(name && VOID_TAGS.has(name))
}

function beautifyHtml(html: string, indentSize: number): string {
  const indentStr = ' '.repeat(indentSize)
  const tokens = tokenizeHtml(html)
  const lines: string[] = []
  let depth = 0

  const pushLine = (content: string) => {
    if (!content.trim()) return
    lines.push(indentStr.repeat(Math.max(0, depth)) + content.trim())
  }

  for (const raw of tokens) {
    if (raw.startsWith('<!--') || raw.startsWith('<![')) {
      pushLine(raw.trim())
      continue
    }

    if (raw.startsWith('<')) {
      if (isClosingTag(raw)) {
        depth = Math.max(0, depth - 1)
        pushLine(raw.trim())
      } else if (isSelfClosingTag(raw)) {
        pushLine(raw.trim())
      } else if (isOpeningTag(raw)) {
        pushLine(raw.trim())
        depth++
      } else {
        pushLine(raw.trim())
      }
      continue
    }

    const chunks = raw.split(/\n+/)
    for (const chunk of chunks) {
      const t = chunk.trim()
      if (!t) continue
      pushLine(t)
    }
  }

  return lines.join('\n').trim()
}

export function HtmlBeautifier() {
  const tool = getToolById('html-beautifier')!
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
        const result = beautifyHtml(value, parseInt(indent, 10))
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
          language="html"
          title="Input"
          placeholder="Paste HTML…"
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="html"
          title="Beautified"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
