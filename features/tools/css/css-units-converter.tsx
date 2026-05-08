'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
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
import { getToolById } from '@/config/tool-registry'

type CssUnit = 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh' | 'pt'

const UNITS: CssUnit[] = ['px', 'rem', 'em', '%', 'vw', 'vh', 'pt']

/** Convert a length value to px for a fixed reference (root font, viewport). */
function toPx(
  value: number,
  unit: CssUnit,
  opts: { basePx: number; vwRef: number; vhRef: number }
): number | null {
  const { basePx, vwRef, vhRef } = opts
  switch (unit) {
    case 'px':
      return value
    case 'rem':
      return value * basePx
    case 'em':
      return value * basePx
    case '%':
      return (value / 100) * basePx
    case 'vw':
      return (value / 100) * vwRef
    case 'vh':
      return (value / 100) * vhRef
    case 'pt':
      return value * (96 / 72)
    default:
      return null
  }
}

function fromPx(px: number, unit: CssUnit, opts: { basePx: number; vwRef: number; vhRef: number }): number | null {
  const { basePx, vwRef, vhRef } = opts
  switch (unit) {
    case 'px':
      return px
    case 'rem':
    case 'em':
      return px / basePx
    case '%':
      return (px / basePx) * 100
    case 'vw':
      return (px / vwRef) * 100
    case 'vh':
      return (px / vhRef) * 100
    case 'pt':
      return px * (72 / 96)
    default:
      return null
  }
}

function formatFormula(
  value: number,
  from: CssUnit,
  to: CssUnit,
  opts: { basePx: number; vwRef: number; vhRef: number }
): string {
  const { basePx, vwRef, vhRef } = opts
  const lines: string[] = []

  if (from === to) {
    lines.push(`No conversion needed — both sides use ${from}.`)
    return lines.join('\n')
  }

  lines.push('1) Normalize to pixels (reference lengths):')
  lines.push(`   • Root font size: ${basePx}px (rem, em, % use this as reference)`)
  lines.push(`   • Viewport: ${vwRef}px × ${vhRef}px (vw / vh)`)

  switch (from) {
    case 'rem':
    case 'em':
      lines.push(`   • ${value}${from}: ${value} × ${basePx}px = ${toPx(value, from, opts)}px`)
      break
    case '%':
      lines.push(`   • ${value}%: (${value}/100) × ${basePx}px = ${toPx(value, from, opts)}px`)
      break
    case 'vw':
      lines.push(`   • ${value}vw: (${value}/100) × ${vwRef}px = ${toPx(value, from, opts)}px`)
      break
    case 'vh':
      lines.push(`   • ${value}vh: (${value}/100) × ${vhRef}px = ${toPx(value, from, opts)}px`)
      break
    case 'pt':
      lines.push(`   • ${value}pt: ${value} × (96÷72) px = ${toPx(value, from, opts)}px`)
      break
    case 'px':
      lines.push(`   • ${value}px: ${value}px`)
      break
    default:
      break
  }

  const px = toPx(value, from, opts)
  if (px == null) return lines.join('\n')

  lines.push('\n2) Convert pixels to target unit:')

  switch (to) {
    case 'rem':
    case 'em':
      lines.push(`   • ${px}px ÷ ${basePx}px = ${fromPx(px, to, opts)?.toFixed(6)}${to}`)
      break
    case '%':
      lines.push(`   • (${px}px ÷ ${basePx}px) × 100 = ${fromPx(px, to, opts)?.toFixed(6)}%`)
      break
    case 'vw':
      lines.push(`   • (${px}px ÷ ${vwRef}px) × 100 = ${fromPx(px, to, opts)?.toFixed(6)}vw`)
      break
    case 'vh':
      lines.push(`   • (${px}px ÷ ${vhRef}px) × 100 = ${fromPx(px, to, opts)?.toFixed(6)}vh`)
      break
    case 'pt':
      lines.push(`   • ${px}px × (72÷96) = ${fromPx(px, to, opts)?.toFixed(6)}pt`)
      break
    case 'px':
      lines.push(`   • Result: ${px}px`)
      break
    default:
      break
  }

  lines.push('\nNote: % and em are context-dependent on the real DOM; this tool treats them relative to the root font size you set above.')

  return lines.join('\n')
}

export function CssUnitsConverter() {
  const tool = getToolById('css-units-converter')!
  const [rawValue, setRawValue] = useState('16')
  const [fromUnit, setFromUnit] = useState<CssUnit>('px')
  const [toUnit, setToUnit] = useState<CssUnit>('rem')
  const [basePx, setBasePx] = useState('16')
  const [vwRef, setVwRef] = useState('1920')
  const [vhRef, setVhRef] = useState('1080')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const value = parseFloat(rawValue)
    if (Number.isNaN(value)) {
      return { numeric: null as number | null, formula: 'Enter a numeric value.', error: true }
    }
    const base = parseFloat(basePx)
    const vw = parseFloat(vwRef)
    const vh = parseFloat(vhRef)
    if ([base, vw, vh].some((n) => Number.isNaN(n) || n <= 0)) {
      return { numeric: null, formula: 'Base font size and viewport refs must be positive numbers.', error: true }
    }
    const opts = { basePx: base, vwRef: vw, vhRef: vh }
    const px = toPx(value, fromUnit, opts)
    if (px == null) return { numeric: null, formula: '', error: true }
    const out = fromPx(px, toUnit, opts)
    if (out == null) return { numeric: null, formula: '', error: true }
    const formula = formatFormula(value, fromUnit, toUnit, opts)
    return { numeric: out, formula, error: false }
  }, [rawValue, fromUnit, toUnit, basePx, vwRef, vhRef])

  const copySummary = useCallback(async () => {
    if (result.error || result.numeric == null) {
      toast.error('Nothing valid to copy')
      return
    }
    const display = `${result.numeric.toFixed(6).replace(/\.?0+$/, '')}${toUnit}`
    const text = `${display}\n\n${result.formula}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Result and formula copied')
    setTimeout(() => setCopied(false), 1500)
  }, [result, toUnit])

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="css-unit-value">Value</Label>
            <Input
              id="css-unit-value"
              type="text"
              inputMode="decimal"
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="from-unit">From</Label>
              <Select value={fromUnit} onValueChange={(v) => setFromUnit(v as CssUnit)}>
                <SelectTrigger id="from-unit" aria-label="From unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-unit">To</Label>
              <Select value={toUnit} onValueChange={(v) => setToUnit(v as CssUnit)}>
                <SelectTrigger id="to-unit" aria-label="To unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base-px">Root font size (px)</Label>
            <Input
              id="base-px"
              type="number"
              min={1}
              className="no-spin font-mono"
              value={basePx}
              onChange={(e) => setBasePx(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vw-ref">Viewport width ref (px)</Label>
            <Input
              id="vw-ref"
              type="number"
              min={1}
              className="no-spin font-mono"
              value={vwRef}
              onChange={(e) => setVwRef(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vh-ref">Viewport height ref (px)</Label>
            <Input
              id="vh-ref"
              type="number"
              min={1}
              className="no-spin font-mono"
              value={vhRef}
              onChange={(e) => setVhRef(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background-secondary p-4 sm:p-5 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 min-w-0 flex-1">
              <span className="text-sm text-muted-foreground shrink-0">Result</span>
              {result.numeric != null && !result.error ? (
                <output
                  className="text-lg font-mono font-semibold text-foreground tracking-tight"
                  aria-live="polite"
                >
                  {result.numeric.toFixed(6).replace(/\.?0+$/, '')}
                  <span className="text-muted-foreground font-normal ml-1">{toUnit}</span>
                </output>
              ) : (
                <p className="text-sm text-destructive-foreground">{result.formula}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 shrink-0 self-start"
              onClick={copySummary}
              disabled={result.error || result.numeric == null}
              aria-label="Copy conversion result and formula"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success-foreground" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy
            </Button>
          </div>
          {result.formula && !result.error && (
            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed border-t border-border pt-3 mt-2">
              {result.formula}
            </pre>
          )}
        </div>
      </div>
    </ToolShell>
  )
}
