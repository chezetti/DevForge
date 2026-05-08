'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `export const greet=(name:string)=>{return \`Hello, \${name}\`};const x=a+b`

function formatTypeScript(src: string): string {
  let s = src.replace(/\s+/g, ' ').trim()
  if (!s) return ''

  s = s.replace(/\s*([{}();,:+\-*/%=<>!&|?])\s*/g, '$1')
  s = s.replace(/;(?![^`]*`)/g, ';\n')
  s = s.replace(/,\s*/g, ', ')
  s = s.replace(/:\s*/g, ': ')
  s = s.replace(/\s*=>\s*/g, ' => ')
  s = s.replace(/\s*=\s*/g, ' = ')

  let depth = 0
  const lines: string[] = []
  let buf = ''
  const indent = () => '  '.repeat(Math.max(0, depth))

  const flushLine = () => {
    const t = buf.trim()
    if (t) lines.push(indent() + t)
    buf = ''
  }

  let i = 0
  let inStr: '"' | "'" | '`' | null = null
  let escape = false

  while (i < s.length) {
    const ch = s[i]
    if (inStr) {
      buf += ch
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
      } else if (ch === inStr) {
        inStr = null
      }
      i++
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      buf += ch
      inStr = ch
      i++
      continue
    }
    if (ch === '{') {
      flushLine()
      lines.push(`${indent()}{`)
      depth++
      i++
      continue
    }
    if (ch === '}') {
      flushLine()
      depth = Math.max(0, depth - 1)
      lines.push(`${indent()}}`)
      i++
      continue
    }
    if (ch === ';') {
      buf += ch
      flushLine()
      i++
      continue
    }
    buf += ch
    i++
  }
  flushLine()

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

export function TsFormatter() {
  const [input, setInput] = useState(EXAMPLE)

  const { output, error } = useMemo(() => {
    try {
      return { output: formatTypeScript(input), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="ts-formatter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="typescript"
          title="TypeScript input"
        />
        <OutputPanel
          value={output}
          language="typescript"
          title="Formatted"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
        />
      </div>
    </ToolShell>
  )
}
