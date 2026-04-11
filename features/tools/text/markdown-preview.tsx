'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'

const EXAMPLE = `# Hello World

This is **bold** and *italic*.

- Item 1
- Item 2

\`\`\`js
console.log('hi')
\`\`\``

function renderMarkdown(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const codeBlocks: string[] = []
  let html = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`)
    return token
  })

  html = html
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(?:<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</p><p>')

  html = `<p>${html}</p>`
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`__CODE_BLOCK_${idx}__`, block)
  })

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Inter, sans-serif; color: #f4f4f5; background: #0d0d0d; margin: 0; padding: 16px; }
    h1,h2,h3 { margin: 0 0 12px; }
    p { margin: 0 0 10px; line-height: 1.5; }
    ul { margin: 0 0 12px 20px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    pre { background: #111; border: 1px solid #1f1f1f; padding: 12px; border-radius: 6px; overflow: auto; }
    a { color: #93c5fd; }
  </style>
</head>
<body>${html}</body>
</html>`
}

export function MarkdownPreview() {
  const [input, setInput] = useState(EXAMPLE)
  const srcDoc = useMemo(() => renderMarkdown(input), [input])

  return (
    <ToolShell toolId="markdown-preview" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="markdown"
          title="Input"
          minHeight="360px"
        />
        <div className="border border-border rounded bg-background-secondary min-h-[360px] overflow-hidden">
          <div className="px-3 py-2 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            Preview
          </div>
          <iframe title="Markdown preview" srcDoc={srcDoc} className="w-full h-[calc(100%-37px)] bg-background" />
        </div>
      </div>
    </ToolShell>
  )
}
