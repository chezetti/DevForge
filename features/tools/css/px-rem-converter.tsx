'use client'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ArrowLeftRight, Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PRESET_PX = [8, 10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 80, 96]

export function PxRemConverter() {
  const [base, setBase] = useState(16)
  const [pxToRem, setPxToRem] = useState(true)
  const [pxStr, setPxStr] = useState('16')
  const [remStr, setRemStr] = useState('1')

  const safeBase = base > 0 ? base : 16

  const syncFromPx = useCallback(
    (px: number) => {
      const rem = px / safeBase
      setPxStr(String(px))
      setRemStr(rem === 0 ? '0' : rem.toFixed(4).replace(/\.?0+$/, '') || '0')
    },
    [safeBase],
  )

  const syncFromRem = useCallback(
    (rem: number) => {
      const px = rem * safeBase
      setRemStr(rem === 0 ? '0' : String(rem))
      setPxStr(Number.isInteger(px) ? String(px) : px.toFixed(3).replace(/\.?0+$/, ''))
    },
    [safeBase],
  )

  const onPxInput = (raw: string) => {
    setPxStr(raw)
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) {
      const rem = n / safeBase
      setRemStr(rem === 0 ? '0' : rem.toFixed(4).replace(/\.?0+$/, '') || '0')
    }
  }

  const onRemInput = (raw: string) => {
    setRemStr(raw)
    const n = parseFloat(raw)
    if (!Number.isNaN(n)) {
      const px = n * safeBase
      setPxStr(Number.isInteger(px) ? String(px) : px.toFixed(3).replace(/\.?0+$/, ''))
    }
  }

  const primarySummary = useMemo(() => {
    const px = parseFloat(pxStr)
    const rem = parseFloat(remStr)
    if (pxToRem && !Number.isNaN(px)) {
      const r = px / safeBase
      return `${px}px → ${r.toFixed(4).replace(/\.?0+$/, '')}rem (base ${safeBase}px)`
    }
    if (!pxToRem && !Number.isNaN(rem)) {
      const p = rem * safeBase
      return `${rem}rem → ${Number.isInteger(p) ? p : p.toFixed(2)}px (base ${safeBase}px)`
    }
    return 'Enter a value'
  }, [pxStr, remStr, pxToRem, safeBase])

  const copySummary = async () => {
    const line =
      pxToRem && !Number.isNaN(parseFloat(pxStr))
        ? `${parseFloat(pxStr) / safeBase}rem`
        : !pxToRem && !Number.isNaN(parseFloat(remStr))
          ? `${parseFloat(remStr) * safeBase}px`
          : ''
    if (!line) return
    await navigator.clipboard.writeText(line)
    toast.success('Copied')
  }

  return (
    <ToolShell toolId="px-rem-converter">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="base-font">Base font size (px)</Label>
            <Input
              id="base-font"
              type="number"
              min={1}
              value={base}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                setBase(Number.isNaN(v) ? 16 : v)
                const px = parseFloat(pxStr)
                if (!Number.isNaN(px)) syncFromPx(px)
                else {
                  const r = parseFloat(remStr)
                  if (!Number.isNaN(r)) syncFromRem(r)
                }
              }}
              className="w-28 font-mono"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 bg-muted/20">
            <span className="text-sm text-muted-foreground">px → rem</span>
            <Switch
              checked={!pxToRem}
              onCheckedChange={(c) => setPxToRem(!c)}
              aria-label="Toggle conversion direction"
            />
            <span className="text-sm text-muted-foreground">rem → px</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fld-px">Pixels</Label>
            <Input
              id="fld-px"
              inputMode="decimal"
              value={pxStr}
              onChange={(e) => onPxInput(e.target.value)}
              className="font-mono text-lg"
              onFocus={() => setPxToRem(true)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fld-rem">Rem</Label>
            <Input
              id="fld-rem"
              inputMode="decimal"
              value={remStr}
              onChange={(e) => onRemInput(e.target.value)}
              className="font-mono text-lg"
              onFocus={() => setPxToRem(false)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4 bg-background-secondary">
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          <p className="text-sm font-mono flex-1 min-w-0">{primarySummary}</p>
          <Button type="button" variant="outline" size="sm" onClick={copySummary} className="gap-1">
            <Copy className="h-3.5 w-3.5" />
            Copy result
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Quick table (px · rem @ base {safeBase}px)</Label>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">px</TableHead>
                  <TableHead className="font-mono">rem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRESET_PX.map((px) => {
                  const rem = px / safeBase
                  return (
                    <TableRow key={px}>
                      <TableCell className="font-mono">{px}</TableCell>
                      <TableCell className="font-mono">
                        {rem === 0 ? '0' : rem.toFixed(4).replace(/\.?0+$/, '')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
