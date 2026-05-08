'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `{
  "id": 101,
  "name": "Alice",
  "roles": ["admin", "editor"],
  "active": true,
  "meta": { "lastLogin": "2024-01-01", "score": 12.5 }
}`

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase())
}

function jsonToTypeAliases(json: unknown, rootName: string): string {
  const types: { name: string; def: string }[] = []
  const seen = new Map<string, string>()

  function signature(obj: Record<string, unknown>): string {
    return JSON.stringify(Object.keys(obj).sort())
  }

  function refType(value: unknown, suggestedName: string): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]'
      const inner = new Set(value.map((item) => refType(item, `${suggestedName}Item`)))
      if (inner.size === 1) return `${Array.from(inner)[0]}[]`
      return `(${Array.from(inner).join(' | ')})[]`
    }
    if (typeof value === 'object') {
      return emitType(suggestedName, value as Record<string, unknown>)
    }
    if (typeof value === 'string') return 'string'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'number' : 'number'
    }
    return 'unknown'
  }

  function emitType(name: string, obj: Record<string, unknown>): string {
    const sig = signature(obj)
    const existing = seen.get(sig)
    if (existing) return existing

    const safeName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `T${seen.size}`
    seen.set(sig, safeName)

    const fields = Object.entries(obj).map(([key, value]) => {
      const tsKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`
      const nested = `${safeName}${toPascalCase(key)}`
      const t = refType(value, nested)
      return `  ${tsKey}: ${t};`
    })

    const def = `{\n${fields.join('\n')}\n}`
    types.push({ name: safeName, def })
    return safeName
  }

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('Root JSON must be an object')
  }

  emitType(rootName, json as Record<string, unknown>)

  return types.map((t) => `export type ${t.name} = ${t.def}`).join('\n\n')
}

export function TypeGenerator() {
  const [input, setInput] = useState(EXAMPLE)
  const [rootName, setRootName] = useState('Root')

  const { output, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input)
      const name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(rootName.trim()) ? rootName.trim() : 'Root'
      return { output: jsonToTypeAliases(parsed, name), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, rootName])

  return (
    <ToolShell toolId="type-generator">
      <div className="flex flex-col gap-3 h-full min-h-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="ts-root-type" className="text-muted-foreground">
            Root type name
          </label>
          <input
            id="ts-root-type"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="h-8 rounded border border-border bg-background px-2 text-sm w-36 font-mono"
            spellCheck={false}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <EditorPanel value={input} onChange={setInput} language="json" title="JSON" />
          <OutputPanel
            value={output}
            language="typescript"
            title="TypeScript types"
            status={error ? 'error' : output ? 'success' : 'idle'}
            errorMessage={error || undefined}
          />
        </div>
      </div>
    </ToolShell>
  )
}
