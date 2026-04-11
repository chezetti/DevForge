'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean().default(true),
})`

function zodExprToTs(expr: string): { type: string; optional: boolean } {
  const optional = expr.includes('.optional()')
  if (expr.includes('z.string')) return { type: 'string', optional }
  if (expr.includes('z.number')) return { type: 'number', optional }
  if (expr.includes('z.boolean')) return { type: 'boolean', optional }
  if (expr.includes('z.date')) return { type: 'Date', optional }
  if (expr.includes('z.any')) return { type: 'any', optional }
  if (expr.includes('z.unknown')) return { type: 'unknown', optional }
  if (expr.includes('z.array(')) {
    const inner = expr.match(/z\.array\(([\s\S]+)\)/)?.[1]?.trim() || 'z.unknown()'
    return { type: `${zodExprToTs(inner).type}[]`, optional }
  }
  const enumMatch = expr.match(/z\.enum\(\[([^\]]+)\]\)/)
  if (enumMatch) {
    const values = enumMatch[1]
      .split(',')
      .map((v) => v.trim().replace(/^['"`]|['"`]$/g, ''))
      .filter(Boolean)
      .map((v) => `'${v}'`)
    if (values.length > 0) return { type: values.join(' | '), optional }
  }
  return { type: 'unknown', optional }
}

function zodToInterface(source: string, interfaceName: string): string {
  const objectMatch = source.match(/z\.object\s*\(\s*\{([\s\S]*?)\}\s*\)/m)
  if (!objectMatch) {
    return `// Could not find z.object({ ... }) in input\nexport interface ${interfaceName} {\n  // Add your fields\n}`
  }

  const body = objectMatch[1]
  const lines = body.split('\n').map((line) => line.trim()).filter(Boolean)
  const fields: string[] = []

  for (const line of lines) {
    const normalized = line.replace(/,$/, '')
    const sep = normalized.indexOf(':')
    if (sep < 0) continue

    const name = normalized.slice(0, sep).trim()
    const expr = normalized.slice(sep + 1).trim()
    if (!name) continue

    const { type, optional } = zodExprToTs(expr)
    fields.push(`  ${name}${optional ? '?' : ''}: ${type}`)
  }

  return `export interface ${interfaceName} {\n${fields.join('\n')}\n}`
}

export function ZodToTs() {
  const [input, setInput] = useState(EXAMPLE)
  const [interfaceName, setInterfaceName] = useState('User')

  const output = useMemo(() => {
    return zodToInterface(input, interfaceName || 'User')
  }, [input, interfaceName])

  return (
    <ToolShell toolId="zod-to-ts" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="typescript"
          title="Input (Zod Schema)"
          minHeight="360px"
        />
        <div className="flex flex-col gap-3">
          <label className="text-xs text-muted-foreground">Interface name</label>
          <input
            value={interfaceName}
            onChange={(e) => setInterfaceName(e.target.value)}
            className="h-9 rounded border border-border bg-background px-3 text-sm"
          />
          <OutputPanel
            value={output}
            language="typescript"
            title="Output (TypeScript)"
            status={output ? 'success' : 'idle'}
            minHeight="312px"
          />
        </div>
      </div>
    </ToolShell>
  )
}
