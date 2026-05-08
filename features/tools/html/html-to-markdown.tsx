'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

const EXAMPLE = `<h1>Title</h1>
<p>This is a <strong>paragraph</strong> with an <em>emphasis</em> and a <a href="https://example.com">link</a>.</p>
<ul><li>Item 1</li><li>Item 2</li></ul>
<ol><li>First</li><li>Second</li></ol>
<img src="/hero.jpg" alt="Hero" />
<p>Inline <code>code</code> here.</p>
<pre><code>const x = 1
console.log(x)</code></pre>
<p>Line one<br/>Line two</p>
<hr/>
<blockquote>Note this.</blockquote>`

function inlineFromContainer(el: Element): string {
  let out = ''
  for (const node of Array.from(el.childNodes)) {
    out += nodeToMarkdown(node, { listDepth: 0, orderedIndex: 0 })
  }
  return out.replace(/\n+/g, ' ').trim()
}

function nodeToMarkdown(node: Node, ctx: { listDepth: number; orderedIndex: number }): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(/\s+/g, ' ')
  }
  if (node.nodeType === Node.COMMENT_NODE) return ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const tag = el.tagName.toLowerCase()

  if (tag === 'strong' || tag === 'b') {
    return `**${inlineFromContainer(el)}**`
  }
  if (tag === 'em' || tag === 'i') {
    return `*${inlineFromContainer(el)}*`
  }
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? ''
    const text = inlineFromContainer(el)
    return `[${text}](${href})`
  }
  if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
    const t = el.textContent ?? ''
    return '`' + t.replace(/`/g, '\\`') + '`'
  }
  if (tag === 'br') return '\n'

  const innerBlock = (): string => {
    let s = ''
    for (const ch of Array.from(el.childNodes)) {
      s += nodeToMarkdown(ch, ctx)
    }
    return s
  }

  switch (tag) {
    case 'h1':
      return `\n# ${innerBlock().trim()}\n\n`
    case 'h2':
      return `\n## ${innerBlock().trim()}\n\n`
    case 'h3':
      return `\n### ${innerBlock().trim()}\n\n`
    case 'h4':
      return `\n#### ${innerBlock().trim()}\n\n`
    case 'h5':
      return `\n##### ${innerBlock().trim()}\n\n`
    case 'h6':
      return `\n###### ${innerBlock().trim()}\n\n`
    case 'p':
      return `\n${innerBlock().trim()}\n\n`
    case 'hr':
      return '\n---\n\n'
    case 'blockquote':
      return `\n${innerBlock()
        .split('\n')
        .map((l) => (l.trim() ? `> ${l.trim()}` : '>'))
        .join('\n')}\n\n`
    case 'ul': {
      let s = '\n'
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const prefix = '  '.repeat(ctx.listDepth) + '- '
        const itemCtx = { listDepth: ctx.listDepth + 1, orderedIndex: 0 }
        let body = ''
        for (const ch of Array.from(li.childNodes)) {
          body += nodeToMarkdown(ch, itemCtx)
        }
        s += `${prefix}${body.trim().replace(/\n/g, `\n${'  '.repeat(ctx.listDepth)}  `)}\n`
      }
      return `${s}\n`
    }
    case 'ol': {
      let s = '\n'
      let i = 1
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const prefix = '  '.repeat(ctx.listDepth) + `${i}. `
        const itemCtx = { listDepth: ctx.listDepth + 1, orderedIndex: i }
        let body = ''
        for (const ch of Array.from(li.childNodes)) {
          body += nodeToMarkdown(ch, itemCtx)
        }
        s += `${prefix}${body.trim().replace(/\n/g, `\n${'  '.repeat(ctx.listDepth)}   `)}\n`
        i++
      }
      return `${s}\n`
    }
    case 'li':
      return innerBlock()
    case 'img': {
      const src = el.getAttribute('src') ?? ''
      const alt = el.getAttribute('alt') ?? ''
      return `![${alt}](${src})`
    }
    case 'pre': {
      const code = el.querySelector('code')
      const raw = code ? code.textContent ?? '' : el.textContent ?? ''
      return `\n\`\`\`\n${raw.replace(/\n+$/, '')}\n\`\`\`\n\n`
    }
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'span':
      return innerBlock()
    default:
      return innerBlock()
  }
}

function htmlToMarkdown(html: string): string {
  const wrapped = `<body>${html}</body>`
  const doc = new DOMParser().parseFromString(wrapped, 'text/html')
  const body = doc.body
  if (!body) throw new Error('Could not parse HTML')
  let out = ''
  for (const ch of Array.from(body.childNodes)) {
    out += nodeToMarkdown(ch, { listDepth: 0, orderedIndex: 0 })
  }
  return out.replace(/\n{3,}/g, '\n\n').trim()
}

export function HtmlToMarkdown() {
  const tool = getToolById('html-to-markdown')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const process = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }
      try {
        const result = htmlToMarkdown(value)
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

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="html"
          title="HTML"
          placeholder="Paste HTML…"
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="markdown"
          title="Markdown"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
