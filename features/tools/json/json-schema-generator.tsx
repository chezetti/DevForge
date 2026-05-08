'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `{
  "id": 101,
  "profile": { "name": "Mila", "email": "mila@example.com" },
  "meta": { "active": true, "tags": ["core", "beta"] }
}`

function inferSchema(value: unknown): Record<string, unknown> {
  if (value === null) {
    return { type: 'null' }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { type: 'array', items: {} }
    }
    const itemSchemas = value.map((item) => inferSchema(item))
    const types = new Set(itemSchemas.map((s) => JSON.stringify(s)))
    if (types.size === 1) {
      return { type: 'array', items: itemSchemas[0] }
    }
    return { type: 'array', items: { anyOf: itemSchemas } }
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const [k, v] of Object.entries(obj)) {
      properties[k] = inferSchema(v)
      required.push(k)
    }
    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    }
  }
  if (typeof value === 'string') {
    return { type: 'string' }
  }
  if (typeof value === 'boolean') {
    return { type: 'boolean' }
  }
  if (typeof value === 'number') {
    return isIntJson(value) ? { type: 'integer' } : { type: 'number' }
  }
  return {}
}

function isIntJson(n: number): boolean {
  return Number.isFinite(n) && Math.floor(n) === n
}

export function JsonSchemaGenerator() {
  const [input, setInput] = useState(EXAMPLE)

  const { output, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(input)
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'Generated schema',
        ...inferSchema(parsed),
      }
      return { output: JSON.stringify(schema, null, 2), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="json-schema-generator">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel value={input} onChange={setInput} language="json" title="Sample JSON" />
        <OutputPanel
          value={output}
          language="json"
          title="JSON Schema (draft-07)"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
        />
      </div>
    </ToolShell>
  )
}
