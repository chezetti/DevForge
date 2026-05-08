'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE_SQL = `SELECT name, email, age FROM users WHERE age > 18 AND status = 'active' ORDER BY name ASC LIMIT 10`

function stripQuotes(s: string): string | number {
  const t = s.trim()
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1)
  }
  const n = Number(t)
  if (!Number.isNaN(n) && t !== '') return n
  return t
}

function parseCondition(cond: string): string | null {
  const c = cond.trim()
  let m: RegExpMatchArray | null

  m = c.match(/^(\w+)\s+IS\s+NULL$/i)
  if (m) return `${JSON.stringify(m[1])}: null`

  m = c.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i)
  if (m) return `${JSON.stringify(m[1])}: { $exists: true, $ne: null }`

  m = c.match(/^(\w+)\s*=\s*(.+)$/i)
  if (m) {
    const val = stripQuotes(m[2]!)
    return `${JSON.stringify(m[1])}: ${JSON.stringify(val)}`
  }

  m = c.match(/^(\w+)\s*!=\s*(.+)$/i)
  if (m) {
    const val = stripQuotes(m[2]!)
    return `${JSON.stringify(m[1])}: { $ne: ${JSON.stringify(val)} }`
  }

  m = c.match(/^(\w+)\s*>=\s*(.+)$/i)
  if (m) {
    const val = stripQuotes(m[2]!)
    return `${JSON.stringify(m[1])}: { $gte: ${JSON.stringify(val)} }`
  }
  m = c.match(/^(\w+)\s*<=\s*(.+)$/i)
  if (m) {
    const val = stripQuotes(m[2]!)
    return `${JSON.stringify(m[1])}: { $lte: ${JSON.stringify(val)} }`
  }
  m = c.match(/^(\w+)\s*>\s*(.+)$/i)
  if (m) {
    const val = stripQuotes(m[2]!)
    return `${JSON.stringify(m[1])}: { $gt: ${JSON.stringify(val)} }`
  }
  m = c.match(/^(\w+)\s*<\s*(.+)$/i)
  if (m) {
    const val = stripQuotes(m[2]!)
    return `${JSON.stringify(m[1])}: { $lt: ${JSON.stringify(val)} }`
  }

  m = c.match(/^(\w+)\s+LIKE\s+('[^']*'|"[^"]*")$/i)
  if (m) {
    let pat = String(stripQuotes(m[2]!))
    const anchoredStart = pat.startsWith('%') ? '' : '^'
    const anchoredEnd = pat.endsWith('%') ? '' : '$'
    pat = pat.replace(/^%+/g, '').replace(/%+$/g, '')
    const body = pat.replace(/%/g, '.*').replace(/_/g, '.')
    return `${JSON.stringify(m[1])}: { $regex: ${JSON.stringify(anchoredStart + body + anchoredEnd)}, $options: 'i' }`
  }

  m = c.match(/^(\w+)\s+IN\s*\(([^)]+)\)$/i)
  if (m) {
    const parts = m[2]!.split(',').map((p) => stripQuotes(p.trim()))
    return `${JSON.stringify(m[1])}: { $in: ${JSON.stringify(parts)} }`
  }

  m = c.match(/^(\w+)\s+BETWEEN\s+(.+)\s+AND\s+(.+)$/i)
  if (m) {
    const lo = stripQuotes(m[2]!)
    const hi = stripQuotes(m[3]!)
    return `${JSON.stringify(m[1])}: { $gte: ${JSON.stringify(lo)}, $lte: ${JSON.stringify(hi)} }`
  }

  return null
}

function parseWhere(whereStr: string): { filter: string; notes: string[] } {
  const parts = whereStr.split(/\s+AND\s+/i).map((s) => s.trim())
  const pairs: string[] = []
  const notes: string[] = []
  for (const p of parts) {
    const conv = parseCondition(p)
    if (!conv) notes.push(`Unsupported predicate: ${p}`)
    else pairs.push(conv)
  }
  return { filter: `{ ${pairs.join(', ')} }`, notes }
}

function sortFromOrderClause(orderClause: string): Record<string, 1 | -1> {
  const out: Record<string, 1 | -1> = {}
  for (const raw of orderClause.split(',')) {
    const seg = raw.trim()
    const m = seg.match(/^(\w+)(?:\s+(ASC|DESC))?$/i)
    if (!m) continue
    out[m[1]!] = (m[2] ?? 'ASC').toUpperCase() === 'DESC' ? -1 : 1
  }
  return out
}

export function sqlToMongoCode(sqlRaw: string): { code: string; error?: string } {
  try {
    const sql = sqlRaw.trim().replace(/;\s*$/, '')
    const selectMatch = sql.match(
      /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z_][\w]*)(?:\s+(?:AS\s+)?([a-zA-Z_][\w]*))?/i,
    )
    if (!selectMatch) {
      return {
        code: '',
        error: 'Expected: SELECT ... FROM table ... (optional WHERE / ORDER BY / LIMIT / JOIN / GROUP BY)',
      }
    }

    const selectList = selectMatch[1]!.trim()
    const collection = selectMatch[2]!.toLowerCase()
    let rest = sql.slice(selectMatch[0].length).trim()

    let lookupStages = ''
    const joinMatch = rest.match(
      /^\s*(?:(?:INNER|LEFT|RIGHT)\s+)?JOIN\s+([a-zA-Z_][\w]*)(?:\s+(?:AS\s+)?([a-zA-Z_][\w]*))?\s+ON\s+([\s\S]+?)(?=\s+\bWHERE\b|\s+\bGROUP\b|\s+\bORDER\b|\s+\bLIMIT\b|\s+\bJOIN\b|$)/i,
    )
    if (joinMatch) {
      const right = joinMatch[1]!.toLowerCase()
      const onClause = joinMatch[3]!.trim()
      lookupStages += `  // JOIN — map ON (${onClause}) to localField/foreignField\n  {\n    $lookup: {\n      from: ${JSON.stringify(right)},\n      localField: "_id",\n      foreignField: "userId",\n      as: ${JSON.stringify(`${right}_linked`)},\n    },\n  },\n`
      rest = rest.replace(joinMatch[0], '').trim()
    }

    let filterObj = '{}'
    const noteLines: string[] = []
    const whereM = rest.match(/\bWHERE\s+([\s\S]+?)(?=\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/i)
    if (whereM) {
      const pw = parseWhere(whereM[1]!.trim())
      filterObj = pw.filter
      noteLines.push(...pw.notes)
      rest = rest.replace(/\bWHERE\s+[\s\S]+?(?=\bGROUP BY\b|\bORDER BY\b|\bLIMIT\b|$)/i, '').trim()
    }

    let groupStages = ''
    const groupM = rest.match(/\bGROUP BY\s+([\s\S]+?)(?=\bORDER BY\b|\bLIMIT\b|$)/i)
    if (groupM) {
      const cols = groupM[1]!.split(',').map((c) => c.trim().split(/\s+/)[0]!)
      const idExpr: Record<string, string> = {}
      for (const col of cols) idExpr[col] = `$${col}`
      groupStages += `  {\n    $group: {\n      _id: ${JSON.stringify(idExpr)},\n    },\n  },\n`
      rest = rest.replace(/\bGROUP BY\s+[\s\S]+?(?=\bORDER BY\b|\bLIMIT\b|$)/i, '').trim()
    }

    let sortObj: Record<string, 1 | -1> = {}
    const orderM = rest.match(/\bORDER BY\s+(.+?)(?=\bLIMIT\b|$)/i)
    if (orderM) {
      sortObj = sortFromOrderClause(orderM[1]!)
      rest = rest.replace(/\bORDER BY\s+.+?(?=\bLIMIT\b|$)/i, '').trim()
    }

    let limitN: string | undefined
    let offsetN: string | undefined
    const limitM = rest.match(/\bLIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i)
    if (limitM) {
      limitN = limitM[1]!
      offsetN = limitM[2] ?? undefined
    }

    let projectStage = ''
    const isStar = /^\*/.test(selectList) || selectList === '*'
    if (!isStar) {
      const proj: Record<string, number> = {}
      for (const raw of selectList.split(',')) {
        const col = raw.trim().split(/\s+/)[0]!
        proj[col] = 1
      }
      projectStage = `  { $project: ${JSON.stringify(proj)} },\n`
    }

    const hasAgg = Boolean(lookupStages || groupStages)

    const sortJson = JSON.stringify(sortObj)
    const sortNeeded = Object.keys(sortObj).length > 0

    const notesHeader =
      noteLines.length > 0
        ? `// Parse notes:\n${noteLines.map((n) => `// - ${n}`).join('\n')}\n\n`
        : ''

    if (!hasAgg) {
      const proj: Record<string, number> = {}
      if (!isStar) {
        for (const raw of selectList.split(',')) {
          const col = raw.trim().split(/\s+/)[0]!
          proj[col] = 1
        }
        proj._id = 0
      }
      const projArg = !isStar ? `, ${JSON.stringify(proj)}` : ''
      let code = `${notesHeader}db.${collection}.find(\n  ${filterObj}${projArg}\n)`
      if (sortNeeded) code += `.sort(${sortJson})`
      if (limitN) code += `.limit(${limitN})`
      if (offsetN) code += `.skip(${offsetN})`
      code += ';\n'
      return { code }
    }

    const stages: string[] = [`  { $match: ${filterObj} },\n`]
    if (lookupStages) stages.push(lookupStages)
    if (groupStages) stages.push(groupStages)
    if (projectStage) stages.push(projectStage)
    if (sortNeeded) stages.push(`  { $sort: ${sortJson} },\n`)
    if (offsetN) stages.push(`  { $skip: ${offsetN} },\n`)
    if (limitN) stages.push(`  { $limit: ${limitN} },\n`)
    return { code: `${notesHeader}db.${collection}.aggregate([\n${stages.join('')}]);\n` }
  } catch (e) {
    return { code: '', error: (e as Error).message }
  }
}

export function SqlToMongodb() {
  const [sql, setSql] = useState(EXAMPLE_SQL)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>()

  const run = useCallback(() => {
    const r = sqlToMongoCode(sql)
    setCode(r.code)
    setError(r.error)
  }, [sql])

  useEffect(() => {
    run()
  }, [run])

  return (
    <ToolShell toolId="sql-to-mongodb">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel title="SQL" value={sql} onChange={setSql} language="sql" minHeight="320px" />
        <OutputPanel
          title="MongoDB shell"
          value={code}
          language="javascript"
          status={error ? 'error' : 'success'}
          errorMessage={error}
          minHeight="320px"
        />
      </div>
    </ToolShell>
  )
}
