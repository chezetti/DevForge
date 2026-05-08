'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

const EXAMPLE = `<div class="container">
  <h1>Hello World</h1>
  <!-- sidebar -->
  <p>This is a paragraph with <strong>bold</strong> text.</p>
  <pre>  spaced
  lines  </pre>
</div>`

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

const PRESERVE_CONTENT_PARENTS = new Set(['pre', 'textarea', 'script', 'style'])

function escapeAttrValue(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function minifyHtmlRegex(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/>\s+</g, '><')
  s = s.replace(/\s+/g, ' ')
  return s.trim()
}

/** Compact HTML while keeping meaningful space in pre/textarea/script/style. */
function minifyHtmlDom(html: string): string {
  const wrapped = `<body>${html}</body>`
  const doc = new DOMParser().parseFromString(wrapped, 'text/html')
  const body = doc.body
  if (!body) return minifyHtmlRegex(html)

  function serializeNode(node: Node): string {
    if (node.nodeType === Node.COMMENT_NODE) return ''

    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement
      const tag = parent?.tagName.toLowerCase() ?? ''
      if (parent && PRESERVE_CONTENT_PARENTS.has(tag)) {
        return node.textContent ?? ''
      }
      const t = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
      return t
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return ''

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const isVoid = VOID_TAGS.has(tag)

    let attrs = ''
    for (const attr of Array.from(el.attributes)) {
      attrs += ` ${attr.name}="${escapeAttrValue(attr.value)}"`
    }

    if (isVoid) {
      return `<${tag}${attrs}>`
    }

    let inner = ''
    for (const child of Array.from(el.childNodes)) {
      inner += serializeNode(child)
    }

    if (PRESERVE_CONTENT_PARENTS.has(tag)) {
      return `<${tag}${attrs}>${inner}</${tag}>`
    }

    inner = inner.replace(/\s+/g, ' ').trim()
    return `<${tag}${attrs}>${inner}</${tag}>`
  }

  return Array.from(body.childNodes)
    .map((n) => serializeNode(n))
    .join('')
    .replace(/>\s+</g, '><')
    .trim()
}

export function HtmlMinifier() {
  const tool = getToolById('html-minifier')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [stats, setStats] = useState({ original: 0, minified: 0 })

  const process = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        setStats({ original: 0, minified: 0 })
        return
      }
      try {
        const result = minifyHtmlDom(value)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        const enc = new TextEncoder()
        setStats({
          original: enc.encode(value).length,
          minified: enc.encode(result).length,
        })
        addToolHistory({ toolId: tool.id, input: value, output: result }, { source })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
        setStats({ original: 0, minified: 0 })
      }
    },
    [addToolHistory, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft ?? EXAMPLE
    setInput(initial)
    if (autoRun) process(initial, 'example')
  }, [getToolDraft, tool.id, autoRun, process])

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

  const saved = useMemo(() => {
    if (stats.original <= 0) return 0
    return stats.original - stats.minified
  }, [stats])

  const pct = useMemo(() => {
    if (stats.original <= 0) return 0
    return Math.round((1 - stats.minified / stats.original) * 100)
  }, [stats])

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="html"
          title="Input"
          placeholder="Paste HTML…"
          minHeight="400px"
        />
        <div className="flex flex-col gap-3 min-h-0">
          {stats.original > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
              <span>Original: {stats.original.toLocaleString()} bytes (UTF‑8)</span>
              <span>Minified: {stats.minified.toLocaleString()} bytes</span>
              <span className="text-success-foreground font-medium">
                Saved: {saved.toLocaleString()} bytes ({pct}%)
              </span>
            </div>
          )}
          <OutputPanel
            value={output}
            language="html"
            title="Minified"
            status={status}
            errorMessage={errorMessage}
            minHeight="400px"
          />
        </div>
      </div>
    </ToolShell>
  )
}
