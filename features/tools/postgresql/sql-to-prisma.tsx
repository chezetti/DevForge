'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  label VARCHAR(120),
  amount NUMERIC(12,2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  meta JSONB,
  placed_at TIMESTAMP NOT NULL DEFAULT NOW()
);`

type ParsedCol = {
  name: string
  sqlType: string
  notNull: boolean
  isPrimary: boolean
  isUnique: boolean
  defaultExpr: string | null
}

function splitCreateBody(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let buf = ''
  for (let i = 0; i < body.length; i++) {
    const c = body[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    if (c === ',' && depth === 0) {
      if (buf.trim()) out.push(buf.trim())
      buf = ''
    } else buf += c
  }
  if (buf.trim()) out.push(buf.trim())
  return out.filter((p) => {
    const u = p.toUpperCase()
    return (
      !u.startsWith('PRIMARY KEY') &&
      !u.startsWith('CONSTRAINT') &&
      !u.startsWith('FOREIGN KEY') &&
      !u.startsWith('UNIQUE KEY') &&
      !u.startsWith('KEY ')
    )
  })
}

function parseCreateTable(sql: string): { table: string; columns: ParsedCol[] } | null {
  const m = sql.match(
    /CREATE\s+TABLE\s+(?:[`"](\w+)[`"]|(\w+))\s*\(([\s\S]*)\)\s*;?/im
  )
  if (!m) return null
  const table = (m[1] || m[2]).trim()
  const parts = splitCreateBody(m[3])
  const columns: ParsedCol[] = []

  for (const line of parts) {
    const cleaned = line.replace(/^[`"]|[`"]$/g, '').trim()
    const nameMatch = cleaned.match(/^[`"]?(\w+)[`"]?\s+(.+)$/i)
    if (!nameMatch) continue
    const name = nameMatch[1]
    let rest = nameMatch[2]

    const isPrimary = /\bPRIMARY\s+KEY\b/i.test(rest)
    const isUnique = /\bUNIQUE\b/i.test(rest)
    const notNull = /\bNOT\s+NULL\b/i.test(rest)
    let defaultExpr: string | null = null
    const defM = rest.match(/\bDEFAULT\s+([^,)]+)/i)
    if (defM) defaultExpr = defM[1].trim()

    rest = rest
      .replace(/\bPRIMARY\s+KEY\b/gi, '')
      .replace(/\bUNIQUE\b/gi, '')
      .replace(/\bNOT\s+NULL\b/gi, '')
      .replace(/\bNULL\b/gi, '')
      .replace(/\bDEFAULT\s+[^,)]+/gi, '')
      .trim()

    const typeM = rest.match(/^([A-Z]+(?:\s*\([^)]+\))?)/i)
    const sqlType = typeM ? typeM[1].trim().toUpperCase() : rest.toUpperCase().split(/\s+/)[0]

    columns.push({ name, sqlType, notNull, isPrimary, isUnique, defaultExpr })
  }

  return { table, columns }
}

function toPascalModel(table: string): string {
  return table
    .split(/[_-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('')
}

function prismaFieldLine(c: ParsedCol): string {
  const fname = c.name
  const t = c.sqlType
  const base = t.replace(/\s*\(.*\)/, '').toUpperCase()
  const decM = t.match(/\((\d+)\s*(?:,\s*(\d+))?\)/)

  let prismaType = 'String'
  const attrs: string[] = []

  if (/SERIAL|BIGSERIAL/i.test(t) && c.isPrimary) {
    prismaType = 'Int'
    attrs.push('@id', '@default(autoincrement())')
  } else if (c.isPrimary && base === 'UUID') {
    prismaType = 'String'
    attrs.push('@id', '@default(uuid())', '@db.Uuid')
  } else if (c.isPrimary) {
    prismaType = 'Int'
    attrs.push('@id')
  } else if (base === 'INTEGER' || base === 'INT' || base === 'INT4' || base === 'SMALLINT') {
    prismaType = 'Int'
  } else if (base === 'BIGINT' || base === 'INT8') {
    prismaType = 'BigInt'
  } else if (base === 'BOOLEAN' || base === 'BOOL') {
    prismaType = 'Boolean'
  } else if (base.startsWith('TIMESTAMP') || base === 'DATE') {
    prismaType = 'DateTime'
  } else if (base === 'JSON' || base === 'JSONB') {
    prismaType = 'Json'
  } else if (base === 'UUID') {
    prismaType = 'String'
    attrs.push('@db.Uuid')
  } else if (base === 'NUMERIC' || base === 'DECIMAL') {
    prismaType = 'Decimal'
    const p = decM?.[1] ? parseInt(decM[1], 10) : 12
    const s = decM?.[2] ? parseInt(decM[2], 10) : 2
    attrs.push(`@db.Decimal(${p}, ${s})`)
  } else if (base === 'REAL' || base === 'FLOAT' || base === 'DOUBLE' || base === 'FLOAT8') {
    prismaType = 'Float'
  } else if (base === 'TEXT' || base.includes('CHAR')) {
    prismaType = 'String'
    if (decM?.[1]) attrs.push(`@db.VarChar(${parseInt(decM[1], 10)})`)
  }

  if (c.isUnique && !c.isPrimary) attrs.push('@unique')

  if (c.defaultExpr && !c.isPrimary) {
    const d = c.defaultExpr
    if (/^NOW\(\)/i.test(d)) attrs.push('@default(now())')
    else if (/^true$/i.test(d)) attrs.push('@default(true)')
    else if (/^false$/i.test(d)) attrs.push('@default(false)')
    else if (/^-?\d+(\.\d+)?$/.test(d)) attrs.push(`@default(${d})`)
    else attrs.push(`@default("${d.replace(/^'|'$/g, '')}")`)
  }

  const optional = !c.notNull && !c.isPrimary ? '?' : ''
  const tail = [prismaType, ...attrs].join(' ')
  return `  ${fname}${optional}  ${tail}`
}

function generatePrisma(table: string, cols: ParsedCol[]): string {
  const model = toPascalModel(table)
  const lines: string[] = [`model ${model} {`]
  for (const c of cols) {
    lines.push(prismaFieldLine(c))
  }
  lines.push('}')
  lines.push('')
  lines.push(`// Map to "${table}" with @@map if snake_case table names differ from model`)
  lines.push(`// @@map("${table}")`)
  return lines.join('\n')
}

export function SqlToPrisma() {
  const [input, setInput] = useState(EXAMPLE)

  const { output, error } = useMemo(() => {
    try {
      const parsed = parseCreateTable(input)
      if (!parsed?.columns.length) {
        return { output: '', error: 'Could not parse CREATE TABLE — check SQL syntax.' }
      }
      return { output: generatePrisma(parsed.table, parsed.columns), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="sql-to-prisma">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel value={input} onChange={setInput} language="sql" title="CREATE TABLE" />
        <OutputPanel
          value={output}
          language="plaintext"
          title="Prisma model"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
        />
      </div>
    </ToolShell>
  )
}
