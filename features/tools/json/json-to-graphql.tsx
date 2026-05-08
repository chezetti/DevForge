'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `{
  "query": {
    "user": {
      "id": "usr_9x2",
      "name": "Amina Khan",
      "active": true,
      "score": 12.5,
      "tags": ["beta", "design"],
      "profile": {
        "email": "amina@example.com",
        "signupAt": 1715000000
      }
    }
  }
}`

function toPascalPart(s: string): string {
  if (!s) return 'Field'
  const cleaned = s.replace(/[^a-zA-Z0-9]+/g, ' ')
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

function inferScalar(v: unknown): string {
  if (v === null) return 'String'
  if (typeof v === 'string') {
    if (/^[a-zA-Z0-9_-]{8,}$/.test(v) && !/\s/.test(v)) return 'ID'
    return 'String'
  }
  if (typeof v === 'number') return Number.isInteger(v) ? 'Int' : 'Float'
  if (typeof v === 'boolean') return 'Boolean'
  return 'String'
}

function buildGraphqlFromJson(root: Record<string, unknown>): string {
  const typeFields = new Map<string, Record<string, string>>()
  const seen = new WeakMap<object, string>()

  function ensureName(base: string): string {
    let n = toPascalPart(base) || 'Type'
    if (!/^[A-Z]/.test(n)) n = `T${n}`
    let candidate = n
    let i = 2
    while ([...typeFields.keys()].includes(candidate)) {
      candidate = `${n}${i++}`
    }
    return candidate
  }

  function visit(value: unknown, suggestName: string): string {
    if (value === null) return 'String'
    if (Array.isArray(value)) {
      if (value.length === 0) return '[String]'
      const first = value[0]
      if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
        const inner = defineObject(first as Record<string, unknown>, `${suggestName}Item`)
        return `[${inner}]`
      }
      return `[${inferScalar(first)}]`
    }
    if (typeof value === 'object') {
      return defineObject(value as Record<string, unknown>, suggestName)
    }
    return inferScalar(value)
  }

  function defineObject(obj: Record<string, unknown>, suggestName: string): string {
    if (seen.has(obj)) return seen.get(obj)!
    const name = ensureName(suggestName)
    seen.set(obj, name)
    const fields: Record<string, string> = {}
    for (const [k, v] of Object.entries(obj)) {
      fields[k] = visit(v, `${name}_${k}`)
    }
    typeFields.set(name, fields)
    return name
  }

  const queryFields: Record<string, string> = {}
  for (const [k, v] of Object.entries(root)) {
    queryFields[k] = visit(v, k)
  }

  const lines: string[] = [
    '# Generated from sample JSON — adjust names and nullability as needed.',
    '',
  ]

  const orderedTypes = [...typeFields.entries()].sort(([a], [b]) => a.localeCompare(b))
  for (const [name, fields] of orderedTypes) {
    lines.push(`type ${name} {`)
    for (const [fk, ft] of Object.entries(fields)) {
      lines.push(`  ${fk}: ${ft}`)
    }
    lines.push('}', '')
  }

  lines.push('type Query {')
  for (const [k, t] of Object.entries(queryFields)) {
    lines.push(`  ${k}: ${t}`)
  }
  lines.push('}', '')
  lines.push(
    '# Example resolver map (pseudo-code):',
    '# Query = {',
    ...Object.keys(queryFields).map((k) => `  #   ${k}: () => root.${k},`),
    '# }',
  )

  return lines.join('\n')
}

export function JsonToGraphql() {
  const [input, setInput] = useState(EXAMPLE)
  const [error, setError] = useState<string | undefined>()
  const [out, setOut] = useState('')

  const run = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('JSON root must be a non-array object')
      }
      setOut(buildGraphqlFromJson(parsed as Record<string, unknown>))
      setError(undefined)
    } catch (e) {
      setError((e as Error).message)
      setOut('')
    }
  }, [input])

  useEffect(() => {
    run()
  }, [run])

  return (
    <ToolShell toolId="json-to-graphql">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          title="JSON"
          value={input}
          onChange={setInput}
          language="json"
          minHeight="320px"
        />
        <OutputPanel
          title="GraphQL"
          value={out}
          language="plaintext"
          status={error ? 'error' : 'success'}
          errorMessage={error}
          minHeight="320px"
        />
      </div>
    </ToolShell>
  )
}
