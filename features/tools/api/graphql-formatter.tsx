'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `query GetUser($id:ID!){user(id:$id){name email posts(limit:3){title body}}}`

function formatGraphQL(input: string): string {
  const s = input.replace(/\s+/g, ' ').trim()
  if (!s) return ''

  let out = ''
  let indent = 0
  let i = 0
  let inStr: '"' | "'" | null = null
  let escape = false

  const newline = () => {
    out = out.trimEnd()
    out += '\n' + '  '.repeat(Math.max(0, indent))
  }

  while (i < s.length) {
    const ch = s[i]
    if (inStr) {
      out += ch
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === inStr) inStr = null
      i++
      continue
    }
    if (ch === '#' ) {
      while (i < s.length && s[i] !== '\n') {
        out += s[i]
        i++
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      out += ch
      inStr = ch
      i++
      continue
    }
    if (ch === '(') {
      out += '('
      indent++
      newline()
      i++
      continue
    }
    if (ch === ')') {
      indent = Math.max(0, indent - 1)
      newline()
      out += ')'
      i++
      if (i < s.length && s[i] && s[i] !== '}' && s[i] !== ')' && s[i] !== ']') newline()
      continue
    }
    if (ch === '{') {
      out += ' {'
      indent++
      newline()
      i++
      continue
    }
    if (ch === '}') {
      indent = Math.max(0, indent - 1)
      newline()
      out += '}'
      i++
      if (i < s.length && s[i] && s[i] !== '}' && s[i] !== ')') newline()
      continue
    }
    if (ch === ' ') {
      i++
      continue
    }
    out += ch
    i++
  }

  return out.trim() + '\n'
}

export function GraphqlFormatter() {
  const [input, setInput] = useState(EXAMPLE)

  const { output, error } = useMemo(() => {
    try {
      return { output: formatGraphQL(input), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="graphql-formatter">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title="GraphQL"
          placeholder="Paste query, mutation, or schema snippet..."
        />
        <OutputPanel
          value={output}
          language="plaintext"
          title="Formatted"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
        />
      </div>
    </ToolShell>
  )
}
