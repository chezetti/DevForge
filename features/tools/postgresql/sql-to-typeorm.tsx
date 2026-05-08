'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  score NUMERIC(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
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
    const upper = rest.toUpperCase()

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
    const sqlType = typeM ? typeM[1].trim().toUpperCase() : upper.split(/\s+/)[0]

    columns.push({ name, sqlType, notNull, isPrimary, isUnique, defaultExpr })
  }

  return { table, columns }
}

function toClassName(table: string): string {
  return table
    .split(/[_-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('')
}

function mapTypeOrm(sqlType: string): { ts: string; columnType?: string; length?: number } {
  const base = sqlType.replace(/\s*\(.*\)/, '').toUpperCase()
  const lenM = sqlType.match(/\((\d+)\)/)
  const length = lenM ? parseInt(lenM[1], 10) : undefined

  if (/^(SERIAL|BIGSERIAL|SMALLSERIAL)/i.test(sqlType)) return { ts: 'number' }
  if (base === 'INTEGER' || base === 'INT' || base === 'INT4' || base === 'SMALLINT')
    return { ts: 'number' }
  if (base === 'BIGINT' || base === 'INT8') return { ts: 'string' }
  if (base === 'BOOLEAN' || base === 'BOOL') return { ts: 'boolean' }
  if (base.startsWith('TIMESTAMP') || base === 'DATE' || base === 'TIME') return { ts: 'Date' }
  if (base === 'NUMERIC' || base === 'DECIMAL' || base === 'REAL' || base === 'DOUBLE' || base === 'FLOAT')
    return { ts: 'number' }
  if (base === 'JSON' || base === 'JSONB') return { ts: 'Record<string, unknown>' }
  if (base.includes('CHAR') || base === 'TEXT' || base === 'CITEXT')
    return { ts: 'string', columnType: 'varchar', length }
  if (base === 'UUID') return { ts: 'string', columnType: 'uuid' }
  if (base === 'BYTEA') return { ts: 'Buffer' }
  return { ts: 'string' }
}

function generateTypeOrm(table: string, cols: ParsedCol[]): string {
  const cls = toClassName(table)
  const lines: string[] = []
  lines.push(`import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm'`)
  lines.push('')
  lines.push(`@Entity('${table}')`)
  lines.push(`export class ${cls} {`)

  for (const c of cols) {
    const prop =
      c.name.split('_').length > 1
        ? c.name
            .split('_')
            .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
            .join('')
        : c.name

    const { ts, columnType, length } = mapTypeOrm(c.sqlType)
    const parts: string[] = []

    if (c.isPrimary && /SERIAL|BIGSERIAL/i.test(c.sqlType)) {
      lines.push(`  @PrimaryGeneratedColumn()`)
      lines.push(`  ${prop}!: ${ts}`)
      lines.push('')
      continue
    }
    if (c.isPrimary) {
      lines.push(`  @PrimaryColumn()`)
      lines.push(`  ${prop}!: ${ts}`)
      lines.push('')
      continue
    }

    if (columnType === 'varchar' && length) {
      parts.push(`type: 'varchar', length: ${length}`)
    } else if (columnType === 'uuid') {
      parts.push(`type: 'uuid'`)
    } else if (/NUMERIC|DECIMAL/i.test(c.sqlType)) {
      parts.push(`type: 'decimal', precision: 10, scale: 2`)
    } else if (/BOOLEAN|BOOL/i.test(c.sqlType)) {
      parts.push(`type: 'boolean'`)
    } else if (/TIMESTAMP|DATE/i.test(c.sqlType)) {
      parts.push(`type: 'timestamp'`)
    } else if (/INTEGER|INT/i.test(c.sqlType) && !/SERIAL/i.test(c.sqlType)) {
      parts.push(`type: 'int'`)
    }

    if (c.isUnique) parts.push(`unique: true`)
    if (!c.notNull && !c.isPrimary) parts.push(`nullable: true`)
    if (c.defaultExpr && !/SERIAL|PRIMARY/i.test(c.sqlType)) {
      const d = c.defaultExpr
      if (/^NOW\(\)/i.test(d)) parts.push(`default: () => 'NOW()'`)
      else if (/^true$/i.test(d)) parts.push(`default: true`)
      else if (/^false$/i.test(d)) parts.push(`default: false`)
      else if (/^-?\d+(\.\d+)?$/.test(d)) parts.push(`default: ${d}`)
      else parts.push(`default: '${d.replace(/^'|'$/g, '')}'`)
    }

    const dec = parts.length ? `  @Column({ ${parts.join(', ')} })` : '  @Column()'
    lines.push(dec)
    lines.push(`  ${prop}${c.notNull || c.isPrimary ? '!' : '?'}: ${ts}`)
    lines.push('')
  }

  lines.push('}')
  return lines.join('\n')
}

export function SqlToTypeorm() {
  const [input, setInput] = useState(EXAMPLE)

  const { output, error } = useMemo(() => {
    try {
      const parsed = parseCreateTable(input)
      if (!parsed?.columns.length) {
        return { output: '', error: 'Could not parse CREATE TABLE — check SQL syntax.' }
      }
      return { output: generateTypeOrm(parsed.table, parsed.columns), error: null as string | null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="sql-to-typeorm">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel value={input} onChange={setInput} language="sql" title="CREATE TABLE" />
        <OutputPanel
          value={output}
          language="typescript"
          title="TypeORM entity"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
        />
      </div>
    </ToolShell>
  )
}
