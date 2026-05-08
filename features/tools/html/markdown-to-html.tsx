'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

const EXAMPLE = `# Title

This is a **paragraph** with *italic* and a [link](https://example.com).

![Diagram](https://example.com/diagram.png)

- Item 1
- Item 2

1. First ordered
2. Second ordered

Inline \`code\` here.

\`\`\`js
const n = 42
console.log(n)
\`\`\`

---

> A short blockquote
> spanning two lines.
`

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;')
}

function processInline(raw: string): string {
  const codes: string[] = []
  let s = raw.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code)
    return `\0CODE${codes.length - 1}\0`
  })

  const imgs: { alt: string; src: string }[] = []
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    imgs.push({ alt, src })
    return `\0IMG${imgs.length - 1}\0`
  })

  const links: { text: string; href: string }[] = []
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    links.push({ text, href })
    return `\0LINK${links.length - 1}\0`
  })

  s = escapeHtml(s)

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  s = s.replace(/\0IMG(\d+)\0/g, (_, i) => {
    const { alt, src } = imgs[Number(i)]
    return `<img alt="${escapeAttr(alt)}" src="${escapeAttr(src)}" />`
  })
  s = s.replace(/\0LINK(\d+)\0/g, (_, i) => {
    const { text, href } = links[Number(i)]
    return `<a href="${escapeAttr(href)}">${escapeHtml(text)}</a>`
  })
  s = s.replace(/\0CODE(\d+)\0/g, (_, i) => `<code>${escapeHtml(codes[Number(i)])}</code>`)

  return s
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let i = 0
  let inFence = false
  let fenceBuf: string[] = []

  const flushParagraph = (buf: string[]) => {
    const t = buf.join('\n').trim()
    if (t) blocks.push(`<p>${processInline(t)}</p>`)
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      if (inFence) {
        blocks.push(`<pre><code>${escapeHtml(fenceBuf.join('\n'))}</code></pre>`)
        fenceBuf = []
        inFence = false
      } else {
        inFence = true
      }
      i++
      continue
    }
    if (inFence) {
      fenceBuf.push(line)
      i++
      continue
    }

    if (/^(\*{3}|-{3})(\s*)$/.test(line.trim())) {
      blocks.push('<hr />')
      i++
      continue
    }

    const hm = line.match(/^(#{1,6})\s+(.*)$/)
    if (hm) {
      const level = hm[1].length
      blocks.push(`<h${level}>${processInline(hm[2].trim())}</h${level}>`)
      i++
      continue
    }

    if (line.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        q.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const body = q.map((l) => processInline(l.trim())).join('<br />\n')
      blocks.push(`<blockquote><p>${body}</p></blockquote>`)
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(processInline(lines[i].replace(/^[-*]\s+/, '')))
        i++
      }
      blocks.push(`<ul>${items.map((c) => `<li>${c}</li>`).join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(processInline(lines[i].replace(/^\d+\.\s+/, '')))
        i++
      }
      blocks.push(`<ol>${items.map((c) => `<li>${c}</li>`).join('')}</ol>`)
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const pBuf: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('```') && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^(\*{3}|-{3})(\s*)$/.test(lines[i].trim())) {
      pBuf.push(lines[i])
      i++
    }
    flushParagraph(pBuf)
  }

  return blocks.join('\n')
}

export function MarkdownToHtml() {
  const tool = getToolById('markdown-to-html')!
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
        const result = markdownToHtml(value)
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
          language="markdown"
          title="Markdown"
          placeholder="Paste Markdown…"
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="html"
          title="HTML"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
