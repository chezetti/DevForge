'use client'

import { useMemo, useState } from 'react'
import { ArrowLeftRight, Check, X } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { parseColor, rateContrast, toHex } from '@/utils/colors'
import { cn } from '@/lib/utils'

function ResultRow({ label, hint, pass }: { label: string; hint: string; pass: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border px-3 py-2',
        pass ? 'border-success-foreground/30 bg-success/10' : 'border-destructive-foreground/30 bg-destructive/10',
      )}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-sm font-semibold',
          pass ? 'text-success-foreground' : 'text-destructive-foreground',
        )}
      >
        {pass ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
        {pass ? 'Pass' : 'Fail'}
      </span>
    </div>
  )
}

export function ContrastChecker() {
  const [fg, setFg] = useState('#E5E7EB')
  const [bg, setBg] = useState('#0A0A0A')

  const fgRgb = useMemo(() => parseColor(fg), [fg])
  const bgRgb = useMemo(() => parseColor(bg), [bg])
  const rating = useMemo(() => (fgRgb && bgRgb ? rateContrast(fgRgb, bgRgb) : null), [fgRgb, bgRgb])

  const fgHex = fgRgb ? toHex(fgRgb) : '#000000'
  const bgHex = bgRgb ? toHex(bgRgb) : '#ffffff'

  const swap = () => {
    setFg(bg)
    setBg(fg)
  }

  return (
    <ToolShell toolId="contrast-checker" showHistory={false}>
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
        {/* Controls + preview */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-fg">Text color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgHex}
                  onChange={(e) => setFg(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
                  aria-label="Pick text color"
                />
                <Input
                  id="cc-fg"
                  value={fg}
                  onChange={(e) => setFg(e.target.value)}
                  className={cn('font-mono', !fgRgb && 'border-destructive-foreground')}
                  aria-invalid={!fgRgb}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-bg">Background color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgHex}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
                  aria-label="Pick background color"
                />
                <Input
                  id="cc-bg"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className={cn('font-mono', !bgRgb && 'border-destructive-foreground')}
                  aria-invalid={!bgRgb}
                />
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={swap} className="gap-2">
            <ArrowLeftRight className="h-4 w-4" aria-hidden />
            Swap colors
          </Button>

          {/* Live preview */}
          <div
            className="space-y-3 rounded-lg border border-border p-5"
            style={{ backgroundColor: bgHex, color: fgHex }}
          >
            <p className="text-2xl font-bold">Large text — 24px bold</p>
            <p className="text-base">
              Normal body text — the quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-sm opacity-90">Small caption text sample 123456.</p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="rounded-lg glass-panel p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Contrast ratio</p>
            <p className="mt-1 text-5xl font-bold tabular-nums text-foreground">
              {rating ? `${rating.ratio.toFixed(2)}` : '—'}
              <span className="text-2xl text-muted-foreground">:1</span>
            </p>
            {!rating && (
              <p className="mt-2 text-sm text-destructive-foreground">Enter valid HEX or RGB colors</p>
            )}
          </div>

          {rating && (
            <div className="space-y-2">
              <ResultRow label="AA — Normal text" hint="≥ 4.5:1 (body text < 18pt)" pass={rating.aaNormal} />
              <ResultRow label="AAA — Normal text" hint="≥ 7:1 (enhanced)" pass={rating.aaaNormal} />
              <ResultRow label="AA — Large text" hint="≥ 3:1 (≥ 18pt or 14pt bold)" pass={rating.aaLarge} />
              <ResultRow label="AAA — Large text" hint="≥ 4.5:1 (enhanced)" pass={rating.aaaLarge} />
              <ResultRow label="UI components" hint="≥ 3:1 (borders, icons, states)" pass={rating.uiComponent} />
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  )
}
