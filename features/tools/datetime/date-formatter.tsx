'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EXAMPLE_DATE = '2024-03-15T10:30:00Z'
const EXAMPLE_PATTERN = 'yyyy-MM-dd HH:mm:ss'

/** Pattern uses UTC calendar fields so ISO/Z inputs align with ISO 8601 output. */
function formatDatePattern(d: Date, pattern: string): string {
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date')
  const pad = (n: number, w: number) => String(n).padStart(w, '0')
  const y = d.getUTCFullYear()
  const M = d.getUTCMonth() + 1
  const D = d.getUTCDate()
  const H = d.getUTCHours()
  const mi = d.getUTCMinutes()
  const s = d.getUTCSeconds()
  const ms = d.getUTCMilliseconds()

  return pattern
    .replace(/yyyy/g, String(y))
    .replace(/yy/g, String(y).slice(-2))
    .replace(/SSS/g, pad(ms, 3))
    .replace(/MM/g, pad(M, 2))
    .replace(/dd/g, pad(D, 2))
    .replace(/HH/g, pad(H, 2))
    .replace(/mm/g, pad(mi, 2))
    .replace(/ss/g, pad(s, 2))
    .replace(/M/g, String(M))
    .replace(/d/g, String(D))
    .replace(/H/g, String(H))
    .replace(/m/g, String(mi))
    .replace(/s/g, String(s))
}

export function DateFormatter() {
  const [dateStr, setDateStr] = useState(EXAMPLE_DATE)
  const [pattern, setPattern] = useState(EXAMPLE_PATTERN)

  const parsed = useMemo(() => new Date(dateStr.trim()), [dateStr])

  const {
    custom,
    error,
    iso,
    utc,
    locale,
    dateOnly,
    timeOnly,
    unixSec,
  } = useMemo(() => {
    if (Number.isNaN(parsed.getTime())) {
      return {
        custom: '',
        error: 'Could not parse date',
        iso: '',
        utc: '',
        locale: '',
        dateOnly: '',
        timeOnly: '',
        unixSec: '',
      }
    }
    try {
      return {
        custom: formatDatePattern(parsed, pattern),
        error: null as string | null,
        iso: parsed.toISOString(),
        utc: parsed.toUTCString(),
        locale: parsed.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' }),
        dateOnly: parsed.toLocaleDateString(undefined, { dateStyle: 'full' }),
        timeOnly: parsed.toLocaleTimeString(undefined, { timeStyle: 'medium' }),
        unixSec: String(Math.floor(parsed.getTime() / 1000)),
      }
    } catch (e) {
      return {
        custom: '',
        error: (e as Error).message,
        iso: parsed.toISOString(),
        utc: parsed.toUTCString(),
        locale: parsed.toLocaleString(),
        dateOnly: parsed.toLocaleDateString(),
        timeOnly: parsed.toLocaleTimeString(),
        unixSec: String(Math.floor(parsed.getTime() / 1000)),
      }
    }
  }, [parsed, pattern])

  return (
    <ToolShell toolId="date-formatter">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="df-input">Date string</Label>
            <Input
              id="df-input"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              placeholder="2024-03-15T10:30:00Z"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Any value supported by the JavaScript <code className="font-mono">Date</code> parser.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="df-pattern">Format pattern</Label>
            <Input
              id="df-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="yyyy-MM-dd HH:mm:ss"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Tokens: <code className="font-mono">yyyy yy MM dd HH mm ss SSS</code> and single{' '}
              <code className="font-mono">M d H m s</code> (UTC).
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Custom pattern
            </p>
            <p className="font-mono text-sm break-all">{custom || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ISO 8601</p>
            <p className="font-mono text-sm break-all">{iso || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">UTC string</p>
            <p className="font-mono text-sm break-all">{utc || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Locale (full)</p>
            <p className="text-sm leading-relaxed">{locale || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date only</p>
            <p className="text-sm">{dateOnly || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time only</p>
            <p className="text-sm font-mono">{timeOnly || '—'}</p>
          </div>
          <div className="rounded-lg border border-border bg-background-secondary p-4 space-y-2 sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Unix timestamp (seconds)
            </p>
            <p className="font-mono text-sm tabular-nums">{unixSec || '—'}</p>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
