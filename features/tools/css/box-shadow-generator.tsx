'use client'

import { useMemo, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { OutputPanel } from '@/components/tools/output-panel'

export function BoxShadowGenerator() {
  const [x, setX] = useState(4)
  const [y, setY] = useState(4)
  const [blur, setBlur] = useState(10)
  const [spread, setSpread] = useState(0)
  const [opacity, setOpacity] = useState(25)
  const [color, setColor] = useState('#000000')
  const [previewDark, setPreviewDark] = useState(true)

  const css = useMemo(() => {
    const alpha = Math.min(100, Math.max(0, opacity)) / 100
    const rgb = color
      .replace('#', '')
      .match(/.{1,2}/g)
      ?.map((v) => parseInt(v, 16)) || [0, 0, 0]
    return `box-shadow: ${x}px ${y}px ${blur}px ${spread}px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(2)});`
  }, [x, y, blur, spread, opacity, color])

  return (
    <ToolShell toolId="box-shadow-generator" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>X</Label>
              <Input type="number" className="no-spin" value={x} onChange={(e) => setX(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Y</Label>
              <Input type="number" className="no-spin" value={y} onChange={(e) => setY(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Blur</Label>
              <Input type="number" className="no-spin" value={blur} onChange={(e) => setBlur(Math.max(0, Number(e.target.value) || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Spread</Label>
              <Input type="number" className="no-spin" value={spread} onChange={(e) => setSpread(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Opacity %</Label>
              <Input type="number" className="no-spin" min={0} max={100} value={opacity} onChange={(e) => setOpacity(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 p-1" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Preview</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              onClick={() => setPreviewDark(!previewDark)}
              aria-label={`Switch to ${previewDark ? 'light' : 'dark'} preview`}
            >
              {previewDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {previewDark ? 'Light' : 'Dark'}
            </Button>
          </div>
          <div className={`h-44 rounded border border-border flex items-center justify-center ${previewDark ? 'bg-linear-to-br from-zinc-900 to-zinc-700' : 'bg-linear-to-br from-zinc-100 to-zinc-300'}`}>
            <div className={`w-32 h-32 rounded transition-all ${previewDark ? 'bg-white' : 'bg-zinc-800'}`} style={{ boxShadow: css.replace('box-shadow: ', '').replace(';', '') }} />
          </div>
        </div>
        <OutputPanel value={css} language="css" title="CSS Output" status="success" minHeight="360px" />
      </div>
    </ToolShell>
  )
}
