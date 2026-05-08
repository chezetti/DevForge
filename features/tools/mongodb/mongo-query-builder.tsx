'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { OutputPanel } from '@/components/tools/output-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const OPS = ['$eq', '$gt', '$lt', '$gte', '$lte', '$ne', '$in', '$regex'] as const
type Op = (typeof OPS)[number]

type Condition = { id: string; field: string; op: Op; value: string }

function coerceValue(op: Op, raw: string): unknown {
  const t = raw.trim()
  if (op === '$in') {
    return t.split(',').map((p) => {
      const s = p.trim()
      if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
      const unq = s.replace(/^['"]|['"]$/g, '')
      return unq
    })
  }
  if (op === '$regex') {
    return t.replace(/^['"]|['"]$/g, '')
  }
  if (t === 'true') return true
  if (t === 'false') return false
  if (t === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return t.replace(/^['"]|['"]$/g, '')
}

function buildInner(conditions: Condition[]): Record<string, unknown> {
  const fields = new Map<string, { eq?: unknown; ops: Record<string, unknown> }>()
  for (const c of conditions) {
    const f = c.field.trim()
    if (!f) continue
    const v = coerceValue(c.op, c.value)
    if (!fields.has(f)) fields.set(f, { ops: {} })
    const entry = fields.get(f)!
    if (c.op === '$eq') entry.eq = v
    else entry.ops[c.op] = v
  }

  const out: Record<string, unknown> = {}
  for (const [f, { eq, ops }] of fields) {
    const opKeys = Object.keys(ops)
    if (eq !== undefined && opKeys.length === 0) {
      out[f] = eq
    } else if (eq !== undefined) {
      out[f] = { $eq: eq, ...ops }
    } else if (opKeys.length > 0) {
      out[f] = ops
    }
  }
  return out
}

export function MongoQueryBuilder() {
  const [collection, setCollection] = useState('users')
  const [conditions, setConditions] = useState<Condition[]>([
    { id: '1', field: 'status', op: '$eq', value: 'active' },
    { id: '2', field: 'age', op: '$gte', value: '18' },
  ])

  const output = useMemo(() => {
    const filter = buildInner(conditions)
    return JSON.stringify(filter, null, 2)
  }, [conditions])

  const findCmd = useMemo(() => {
    const c = collection.trim() || 'collection'
    const f = buildInner(conditions)
    return `db.${c}.find(${JSON.stringify(f, null, 2)})`
  }, [collection, conditions])

  const addRow = () => {
    setConditions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: '', op: '$eq', value: '' },
    ])
  }

  const removeRow = (id: string) => {
    setConditions((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)))
  }

  const patch = (id: string, patch: Partial<Condition>) => {
    setConditions((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <ToolShell toolId="mongo-query-builder">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
        <div className="space-y-4 min-h-0">
          <div className="space-y-2">
            <Label htmlFor="mongo-coll">Collection</Label>
            <Input
              id="mongo-coll"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="users"
              className="font-mono max-w-md"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {conditions.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 rounded-lg border border-border bg-background-secondary"
                >
                  <div className="sm:col-span-4 space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Field</span>
                    <Input
                      value={row.field}
                      onChange={(e) => patch(row.id, { field: e.target.value })}
                      placeholder="fieldName"
                      className="font-mono h-9"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Operator</span>
                    <Select
                      value={row.op}
                      onValueChange={(v) => patch(row.id, { op: v as Op })}
                    >
                      <SelectTrigger className="h-9 w-full font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPS.map((op) => (
                          <SelectItem key={op} value={op} className="font-mono">
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Value</span>
                    <Input
                      value={row.value}
                      onChange={(e) => patch(row.id, { value: e.target.value })}
                      placeholder={row.op === '$in' ? 'a, b, 3' : 'value'}
                      className="font-mono h-9"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end pb-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground shrink-0"
                      onClick={() => removeRow(row.id)}
                      disabled={conditions.length <= 1}
                      aria-label="Remove condition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Use <code className="font-mono">$in</code> with comma-separated values. Strings can be quoted.
            <code className="font-mono ml-2">$regex</code> expects a pattern string.
          </p>
        </div>

        <div className="flex flex-col gap-4 min-h-0">
          <OutputPanel value={output} language="json" title="Filter (JSON)" />
          <OutputPanel value={findCmd} language="javascript" title="mongo shell" />
        </div>
      </div>
    </ToolShell>
  )
}
