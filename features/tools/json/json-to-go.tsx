'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "score": 98.5,
  "active": true,
  "tags": ["admin", "user"],
  "profile": {
    "bio": "Engineer",
    "country": "CA",
    "years": 5
  }
}`

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (_, c: string) => c.toUpperCase())
}

function isIntJson(n: number): boolean {
  return Number.isFinite(n) && Math.floor(n) === n
}

function goPrimitiveType(v: unknown): string {
  if (v === null) return 'interface{}'
  if (typeof v === 'string') return 'string'
  if (typeof v === 'boolean') return 'bool'
  if (typeof v === 'number') return isIntJson(v) ? 'int' : 'float64'
  return 'interface{}'
}

function jsonToGo(json: unknown, rootStructName: string): string {
  const structs: { name: string; lines: string[] }[] = []
  const sigToName = new Map<string, string>()

  function structSignature(obj: Record<string, unknown>): string {
    return JSON.stringify(
      Object.keys(obj)
        .sort()
        .map((k) => [k, shapeToken(obj[k])])
    )
  }

  function shapeToken(v: unknown): string {
    if (v === null) return 'null'
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]'
      return `[${v.map((item) => shapeToken(item)).sort().join('|')}]`
    }
    if (typeof v === 'object') return `{${structSignature(v as Record<string, unknown>)}}`
    return goPrimitiveType(v)
  }

  function goTypeForValue(v: unknown, suggestedName: string): string {
    if (v === null) return 'interface{}'
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]interface{}'
      const elemTypes = new Set(v.map((item) => goTypeForValue(item, `${suggestedName}Elem`)))
      if (elemTypes.size === 1) return `[]${Array.from(elemTypes)[0]}`
      return '[]interface{}'
    }
    if (typeof v === 'object') {
      return emitStruct(suggestedName, v as Record<string, unknown>)
    }
    return goPrimitiveType(v)
  }

  function emitStruct(name: string, obj: Record<string, unknown>): string {
    const sig = structSignature(obj)
    const existing = sigToName.get(sig)
    if (existing) return existing
    sigToName.set(sig, name)

    const lines: string[] = []
    for (const [key, value] of Object.entries(obj)) {
      const field = toPascalCase(key)
      const tag = `\`json:"${key}"\``
      const nestedName = `${name}${field}`
      const goType = goTypeForValue(value, nestedName)
      lines.push(`\t${field} ${goType.padEnd(14)} ${tag}`)
    }
    structs.push({ name, lines })
    return name
  }

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('Root must be a JSON object')
  }

  emitStruct(rootStructName, json as Record<string, unknown>)

  return structs.map((s) => `type ${s.name} struct {\n${s.lines.join('\n')}\n}\n`).join('\n')
}

export function JsonToGo() {
  const [input, setInput] = useState(EXAMPLE)
  const [rootName, setRootName] = useState('Root')

  const { output, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input)
      const name = /^[A-Za-z_][A-Za-z0-9_]*$/.test(rootName.trim()) ? rootName.trim() : 'Root'
      return { output: jsonToGo(parsed, name), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, rootName])

  return (
    <ToolShell toolId="json-to-go">
      <div className="flex flex-col gap-3 h-full min-h-0">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="go-root-name" className="text-muted-foreground">
            Struct name
          </label>
          <input
            id="go-root-name"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            className="h-8 rounded border border-border bg-background px-2 text-sm w-36 font-mono"
            spellCheck={false}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <EditorPanel value={input} onChange={setInput} language="json" title="JSON input" />
          <OutputPanel
            value={output}
            language="go"
            title="Go struct"
            status={error ? 'error' : output ? 'success' : 'idle'}
            errorMessage={error || undefined}
          />
        </div>
      </div>
    </ToolShell>
  )
}
