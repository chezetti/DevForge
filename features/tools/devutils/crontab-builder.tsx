'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
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
import { parseCronExpression, getNextCronRuns } from '@/utils/datetime'

type FieldKind = 'any' | 'step' | 'single' | 'range'

type CronField = {
  kind: FieldKind
  step: number
  single: number
  rangeFrom: number
  rangeTo: number
}

const defaultField = (single: number): CronField => ({
  kind: 'single',
  step: 5,
  single,
  rangeFrom: 1,
  rangeTo: 5,
})

const INITIAL_FIELDS: [CronField, CronField, CronField, CronField, CronField] = [
  { kind: 'single', step: 5, single: 0, rangeFrom: 1, rangeTo: 5 },
  { kind: 'single', step: 5, single: 9, rangeFrom: 1, rangeTo: 5 },
  { kind: 'any', step: 5, single: 1, rangeFrom: 1, rangeTo: 5 },
  { kind: 'any', step: 5, single: 1, rangeFrom: 1, rangeTo: 5 },
  { kind: 'range', step: 5, single: 1, rangeFrom: 1, rangeTo: 5 },
]

const LIMITS: [number, number][] = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
]

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function buildPart(f: CronField, index: number): string {
  const [lo, hi] = LIMITS[index]
  switch (f.kind) {
    case 'any':
      return '*'
    case 'step': {
      const n = clamp(Math.round(f.step), 1, hi - lo + 1)
      return `*/${n}`
    }
    case 'single': {
      const v = clamp(Math.round(f.single), lo, hi)
      return String(v)
    }
    case 'range': {
      let a = clamp(Math.round(f.rangeFrom), lo, hi)
      let b = clamp(Math.round(f.rangeTo), lo, hi)
      if (a > b) [a, b] = [b, a]
      return `${a}-${b}`
    }
    default:
      return '*'
  }
}

const PRESETS: { label: string; expr: string }[] = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Hourly', expr: '0 * * * *' },
  { label: 'Daily (midnight)', expr: '0 0 * * *' },
  { label: 'Weekly (Sun 00:00)', expr: '0 0 * * 0' },
  { label: 'Monthly (1st)', expr: '0 0 1 * *' },
]

/** Very small parser for presets back into builder (best-effort). */
function applyExpressionToFields(expr: string): [CronField, CronField, CronField, CronField, CronField] | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  const parseOne = (s: string, idx: number): CronField => {
    const [lo, hi] = LIMITS[idx]
    const base = defaultField(lo)
    if (s === '*') {
      base.kind = 'any'
      return base
    }
    if (s.startsWith('*/')) {
      const n = parseInt(s.slice(2), 10)
      if (!Number.isNaN(n)) {
        base.kind = 'step'
        base.step = n
      }
      return base
    }
    if (s.includes('-') && !s.includes(',')) {
      const [a, b] = s.split('-').map((x) => parseInt(x, 10))
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        base.kind = 'range'
        base.rangeFrom = a
        base.rangeTo = b
      }
      return base
    }
    const v = parseInt(s, 10)
    if (!Number.isNaN(v)) {
      base.kind = 'single'
      base.single = clamp(v, lo, hi)
    }
    return base
  }
  return [
    parseOne(parts[0], 0),
    parseOne(parts[1], 1),
    parseOne(parts[2], 2),
    parseOne(parts[3], 3),
    parseOne(parts[4], 4),
  ]
}

const FIELD_LABELS = ['Minute', 'Hour', 'Day (month)', 'Month', 'Day (week)']

export function CrontabBuilder() {
  const [fields, setFields] = useState(INITIAL_FIELDS)

  const expression = useMemo(() => fields.map((f, i) => buildPart(f, i)).join(' '), [fields])

  const parsed = useMemo(() => parseCronExpression(expression), [expression])
  const nextRuns = useMemo(() => {
    if (!parsed.isValid) return []
    return getNextCronRuns(expression, 5)
  }, [expression, parsed.isValid])

  const setField = (index: number, patch: Partial<CronField>) => {
    setFields((prev) => {
      const next = [...prev] as typeof prev
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const applyPreset = useCallback((expr: string) => {
    const f = applyExpressionToFields(expr)
    if (f) setFields(f)
    else toast.error('Could not load preset into builder')
  }, [])

  const copyExpr = async () => {
    await navigator.clipboard.writeText(expression)
    toast.success('Cron expression copied')
  }

  return (
    <ToolShell toolId="crontab-builder">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.expr} type="button" variant="outline" size="sm" onClick={() => applyPreset(p.expr)}>
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4">
          {fields.map((f, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border p-4 grid sm:grid-cols-[1fr_2fr] gap-4 bg-background-secondary/30"
            >
              <div>
                <Label className="text-xs uppercase text-muted-foreground tracking-wide">
                  {FIELD_LABELS[idx]}
                </Label>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Range {LIMITS[idx][0]}–{LIMITS[idx][1]}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Select
                  value={f.kind}
                  onValueChange={(v) => setField(idx, { kind: v as FieldKind })}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Every (*)</SelectItem>
                    <SelectItem value="step">Every N (step)</SelectItem>
                    <SelectItem value="single">Specific value</SelectItem>
                    <SelectItem value="range">Range (from–to)</SelectItem>
                  </SelectContent>
                </Select>
                {f.kind === 'step' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">Step N</Label>
                    <Input
                      type="number"
                      className="font-mono w-24 h-8"
                      min={1}
                      value={f.step}
                      onChange={(e) => setField(idx, { step: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                )}
                {f.kind === 'single' && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">Value</Label>
                    <Input
                      type="number"
                      className="font-mono w-24 h-8"
                      min={LIMITS[idx][0]}
                      max={LIMITS[idx][1]}
                      value={f.single}
                      onChange={(e) =>
                        setField(idx, { single: parseInt(e.target.value, 10) || LIMITS[idx][0] })
                      }
                    />
                  </div>
                )}
                {f.kind === 'range' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      className="font-mono w-20 h-8"
                      min={LIMITS[idx][0]}
                      max={LIMITS[idx][1]}
                      value={f.rangeFrom}
                      onChange={(e) =>
                        setField(idx, { rangeFrom: parseInt(e.target.value, 10) || LIMITS[idx][0] })
                      }
                      aria-label={`${FIELD_LABELS[idx]} range start`}
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="number"
                      className="font-mono w-20 h-8"
                      min={LIMITS[idx][0]}
                      max={LIMITS[idx][1]}
                      value={f.rangeTo}
                      onChange={(e) =>
                        setField(idx, { rangeTo: parseInt(e.target.value, 10) || LIMITS[idx][1] })
                      }
                      aria-label={`${FIELD_LABELS[idx]} range end`}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <Label className="text-sm font-medium">Cron expression</Label>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={copyExpr}>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <code className="block font-mono text-lg tracking-wide">{expression}</code>
          {!parsed.isValid ? (
            <p className="text-sm text-destructive">{parsed.error ?? 'Invalid expression'}</p>
          ) : (
            <>
              <div className="rounded-md bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Human-readable</p>
                <p className="text-sm font-medium">{parsed.humanReadable}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Next 5 runs (local time)</p>
                <ul className="space-y-1 text-sm font-mono">
                  {nextRuns.map((d, i) => (
                    <li key={i}>
                      {i + 1}. {d.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolShell>
  )
}
