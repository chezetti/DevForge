'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OutputPanel } from '@/components/tools/output-panel'
import { Sun, Moon } from 'lucide-react'

export function FlexboxGenerator() {
  const [direction, setDirection] = useState('row')
  const [justify, setJustify] = useState('center')
  const [align, setAlign] = useState('center')
  const [wrap, setWrap] = useState('nowrap')
  const [gap, setGap] = useState(16)
  const [previewDark, setPreviewDark] = useState(true)

  const css = useMemo(
    () =>
      `display: flex;\nflex-direction: ${direction};\njustify-content: ${justify};\nalign-items: ${align};\nflex-wrap: ${wrap};\ngap: ${gap}px;`,
    [direction, justify, align, wrap, gap]
  )

  return (
    <ToolShell toolId="flexbox-generator" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="row">row</SelectItem>
                  <SelectItem value="column">column</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Justify</Label>
              <Select value={justify} onValueChange={setJustify}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">flex-start</SelectItem>
                  <SelectItem value="center">center</SelectItem>
                  <SelectItem value="flex-end">flex-end</SelectItem>
                  <SelectItem value="space-between">space-between</SelectItem>
                  <SelectItem value="space-around">space-around</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Align</Label>
              <Select value={align} onValueChange={setAlign}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flex-start">flex-start</SelectItem>
                  <SelectItem value="center">center</SelectItem>
                  <SelectItem value="flex-end">flex-end</SelectItem>
                  <SelectItem value="stretch">stretch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wrap</Label>
              <Select value={wrap} onValueChange={setWrap}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nowrap">nowrap</SelectItem>
                  <SelectItem value="wrap">wrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gap</Label>
              <Input type="number" className="no-spin" min={0} max={40} value={gap} onChange={(e) => setGap(Math.max(0, Math.min(40, Number(e.target.value) || 0)))} />
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
          <div className={`h-44 rounded border border-border p-3 ${previewDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <div
              className="w-full h-full"
              style={{
                display: 'flex',
                flexDirection: direction as 'row' | 'column',
                justifyContent: justify,
                alignItems: align,
                flexWrap: wrap as 'nowrap' | 'wrap',
                gap: `${gap}px`,
              }}
            >
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className={`w-10 h-10 rounded text-xs flex items-center justify-center font-medium shrink-0 ${previewDark ? 'bg-zinc-200/90 text-zinc-900' : 'bg-zinc-800 text-zinc-100'}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <OutputPanel value={css} language="css" title="CSS Output" status="success" minHeight="360px" />
      </div>
    </ToolShell>
  )
}
