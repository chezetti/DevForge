'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CONTROL_NAMES: Record<number, string> = {
  0: 'NUL',
  1: 'SOH',
  2: 'STX',
  3: 'ETX',
  4: 'EOT',
  5: 'ENQ',
  6: 'ACK',
  7: 'BEL',
  8: 'BS',
  9: 'TAB',
  10: 'LF',
  11: 'VT',
  12: 'FF',
  13: 'CR',
  14: 'SO',
  15: 'SI',
  16: 'DLE',
  17: 'DC1',
  18: 'DC2',
  19: 'DC3',
  20: 'DC4',
  21: 'NAK',
  22: 'SYN',
  23: 'ETB',
  24: 'CAN',
  25: 'EM',
  26: 'SUB',
  27: 'ESC',
  28: 'FS',
  29: 'GS',
  30: 'RS',
  31: 'US',
  32: 'SP',
  127: 'DEL',
}

function charLabel(code: number): string {
  if (code <= 32 || code === 127) return CONTROL_NAMES[code] ?? 'CTL'
  return String.fromCharCode(code)
}

function isPrintable(code: number): boolean {
  return code >= 32 && code < 127
}

const ALL_CODES = Array.from({ length: 128 }, (_, i) => i)

export function AsciiTable() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_CODES
    return ALL_CODES.filter((code) => {
      if (String(code) === q) return true
      if (`0x${code.toString(16)}` === q || code.toString(16) === q) return true
      const name = CONTROL_NAMES[code]?.toLowerCase() ?? ''
      if (name.includes(q)) return true
      if (isPrintable(code)) {
        const ch = String.fromCharCode(code).toLowerCase()
        if (ch === q) return true
      }
      return false
    })
  }, [query])

  return (
    <ToolShell toolId="ascii-table" showHistory={false}>
      <div className="space-y-4 max-w-5xl">
        <div className="space-y-2">
          <Label htmlFor="ascii-search">Filter by code (dec/hex), control name, or character</Label>
          <Input
            id="ascii-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 65, 0x41, A, TAB"
          />
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/25 border border-emerald-500/40 mr-2 align-middle" />
            Printable (32–126)
          </span>
          <span>
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/40 mr-2 align-middle" />
            Control / non-printable
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
          {filtered.map((code) => {
            const printable = isPrintable(code)
            return (
              <div
                key={code}
                className={`rounded-md border px-2 py-2 text-xs font-mono space-y-1 ${
                  printable
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-amber-500/25 bg-amber-500/5'
                }`}
              >
                <div className="flex justify-between gap-1 text-[10px] text-muted-foreground">
                  <span className="tabular-nums">{code}</span>
                  <span>0x{code.toString(16).toUpperCase().padStart(2, '0')}</span>
                </div>
                <div className="text-sm font-semibold text-foreground truncate">
                  {charLabel(code)}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No characters match this filter.
          </p>
        )}
      </div>
    </ToolShell>
  )
}
