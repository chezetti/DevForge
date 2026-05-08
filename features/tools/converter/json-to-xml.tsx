'use client'

import { useMemo, useState, useCallback } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EXAMPLE = `{"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}`

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function safeTag(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, '_')
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned || 'item'
}

function valueToXml(key: string, value: unknown, depth: number): string {
  const pad = '  '.repeat(depth)
  const tag = safeTag(key)

  if (value === null || value === undefined) {
    return `${pad}<${tag} />`
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${pad}<${tag}>${escapeXml(String(value))}</${tag}>`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${pad}<${tag}></${tag}>`
    }
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const inner = Object.entries(item as Record<string, unknown>)
            .map(([k, v]) => valueToXml(k, v, depth + 2))
            .join('\n')
          return `${pad}<${tag}>\n${inner}\n${pad}</${tag}>`
        }
        return valueToXml(tag, item, depth)
      })
      .join('\n')
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) {
    return `${pad}<${tag}></${tag}>`
  }
  const inner = entries.map(([k, v]) => valueToXml(k, v, depth + 1)).join('\n')
  return `${pad}<${tag}>\n${inner}\n${pad}</${tag}>`
}

function jsonToXml(jsonText: string, rootName: string): string {
  const trimmed = jsonText.trim()
  if (!trimmed) return ''
  const data = JSON.parse(trimmed) as unknown
  const root = safeTag(rootName || 'root')
  if (Array.isArray(data)) {
    const body = data
      .map((item) => valueToXml('item', item, 1))
      .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${body}\n</${root}>`
  }
  if (data !== null && typeof data === 'object') {
    const inner = Object.entries(data as Record<string, unknown>)
      .map(([k, v]) => valueToXml(k, v, 1))
      .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${inner}\n</${root}>`
  }
  const inner = valueToXml('value', data, 1)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${inner}\n</${root}>`
}

export function JsonToXml() {
  const [input, setInput] = useState(EXAMPLE)
  const [rootName, setRootName] = useState('root')

  const { output, status, errorMessage } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', status: 'idle' as const, errorMessage: '' }
    }
    try {
      const xml = jsonToXml(input, rootName.trim() || 'root')
      return { output: xml, status: 'success' as const, errorMessage: '' }
    } catch (e) {
      return {
        output: '',
        status: 'error' as const,
        errorMessage: e instanceof Error ? e.message : 'Invalid JSON',
      }
    }
  }, [input, rootName])

  const handleFormat = useCallback(() => {
    try {
      const obj = JSON.parse(input)
      setInput(JSON.stringify(obj, null, 2))
    } catch {
      /* ignore */
    }
  }, [input])

  return (
    <ToolShell toolId="json-to-xml">
      <div className="flex flex-col gap-4 h-full min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label htmlFor="xml-root-name">Root element name</Label>
            <Input
              id="xml-root-name"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="root"
              className="font-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <EditorPanel
            value={input}
            onChange={setInput}
            language="json"
            title="JSON"
            placeholder="Paste JSON…"
            minHeight="400px"
            onFormat={handleFormat}
          />
          <OutputPanel
            value={output}
            language="xml"
            title="XML"
            status={status}
            errorMessage={errorMessage}
            minHeight="400px"
            emptyHint="Enter valid JSON to generate XML"
          />
        </div>
      </div>
    </ToolShell>
  )
}
