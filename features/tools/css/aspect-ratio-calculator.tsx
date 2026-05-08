'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

const PRESETS: { label: string; w: number; h: number; hint: string }[] = [
  { label: '1:1', w: 1, h: 1, hint: 'Square' },
  { label: '4:3', w: 4, h: 3, hint: 'Classic display' },
  { label: '3:2', w: 3, h: 2, hint: 'Photography' },
  { label: '16:9', w: 16, h: 9, hint: 'HD video' },
  { label: '21:9', w: 21, h: 9, hint: 'Ultrawide' },
  { label: '9:16', w: 9, h: 16, hint: 'Vertical video' },
]

export function AspectRatioCalculator() {
  const [w, setW] = useState(16)
  const [h, setH] = useState(9)
  const [resizeW, setResizeW] = useState('')
  const [resizeH, setResizeH] = useState('')

  const derived = useMemo(() => {
    const ww = w > 0 ? w : 1
    const hh = h > 0 ? h : 1
    const g = gcd(ww, hh)
    const rw = ww / g
    const rh = hh / g
    const dec = ww / hh
    const cssValue = `${rw} / ${rh}`
    return { rw, rh, dec, cssValue }
  }, [w, h])

  const applyPreset = (pw: number, ph: number) => {
    setW(pw)
    setH(ph)
    setResizeW('')
    setResizeH('')
  }

  const onResizeWChange = (raw: string) => {
    setResizeW(raw)
    setResizeH('')
    const n = parseFloat(raw)
    if (!Number.isNaN(n) && n > 0 && w > 0 && h > 0) {
      setResizeH(String((n * h) / w))
    }
  }

  const onResizeHChange = (raw: string) => {
    setResizeH(raw)
    setResizeW('')
    const n = parseFloat(raw)
    if (!Number.isNaN(n) && n > 0 && w > 0 && h > 0) {
      setResizeW(String((n * w) / h))
    }
  }

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success('Copied')
  }

  return (
    <ToolShell toolId="aspect-ratio-calculator">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ar-w">Width</Label>
            <Input
              id="ar-w"
              type="number"
              min={1}
              value={w}
              onChange={(e) => setW(parseInt(e.target.value, 10) || 1)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ar-h">Height</Label>
            <Input
              id="ar-h"
              type="number"
              min={1}
              value={h}
              onChange={(e) => setH(parseInt(e.target.value, 10) || 1)}
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              variant="outline"
              size="sm"
              title={p.hint}
              onClick={() => applyPreset(p.w, p.h)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3 rounded-xl border border-border p-4 bg-background-secondary">
            <h3 className="text-sm font-medium">Computed</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Ratio</dt>
                <dd className="font-mono">
                  {derived.rw}:{derived.rh}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    aria-label="Copy ratio"
                    onClick={() => copy(`${derived.rw}:${derived.rh}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Decimal (W÷H)</dt>
                <dd className="font-mono">{derived.dec.toFixed(6).replace(/\.?0+$/, '')}</dd>
              </div>
              <div className="flex justify-between gap-2 items-start">
                <dt className="text-muted-foreground">CSS</dt>
                <dd className="font-mono text-right break-all">
                  aspect-ratio: {derived.cssValue};
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    aria-label="Copy CSS aspect-ratio"
                    onClick={() => copy(`aspect-ratio: ${derived.cssValue};`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border p-4 bg-muted/10">
            <p className="text-xs text-muted-foreground">Preview</p>
            <div
              className="w-full max-w-[200px] rounded-lg bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 shadow-inner"
              style={{ aspectRatio: derived.cssValue }}
            />
            <p className="text-[11px] text-muted-foreground font-mono">
              max-width 200px · ratio {derived.rw}:{derived.rh}
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium">Resize calculator</h3>
          <p className="text-xs text-muted-foreground">
            Fix one dimension; the other updates from the current ratio ({derived.rw}:{derived.rh}).
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rs-w">Width</Label>
              <Input
                id="rs-w"
                inputMode="decimal"
                value={resizeW}
                onChange={(e) => onResizeWChange(e.target.value)}
                className="font-mono"
                placeholder="e.g. 1920"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rs-h">Height</Label>
              <Input
                id="rs-h"
                inputMode="decimal"
                value={resizeH}
                onChange={(e) => onResizeHChange(e.target.value)}
                className="font-mono"
                placeholder="e.g. 1080"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
