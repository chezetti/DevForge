'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { OutputPanel } from '@/components/tools/output-panel'

export function CssGridGenerator() {
  const [columns, setColumns] = useState(3)
  const [rows, setRows] = useState(2)
  const [gap, setGap] = useState(16)

  const css = useMemo(
    () =>
      `display: grid;\ngrid-template-columns: repeat(${columns}, 1fr);\ngrid-template-rows: repeat(${rows}, 1fr);\ngap: ${gap}px;`,
    [columns, rows, gap]
  )

  const items = useMemo(() => Array.from({ length: Math.min(columns * rows, 12) }, (_, i) => i + 1), [columns, rows])

  return (
    <ToolShell toolId="css-grid-generator" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Columns</Label>
              <Input type="number" className="no-spin" min={1} max={6} value={columns} onChange={(e) => setColumns(Math.max(1, Math.min(6, Number(e.target.value) || 1)))} />
            </div>
            <div className="space-y-2">
              <Label>Rows</Label>
              <Input type="number" className="no-spin" min={1} max={6} value={rows} onChange={(e) => setRows(Math.max(1, Math.min(6, Number(e.target.value) || 1)))} />
            </div>
            <div className="space-y-2">
              <Label>Gap</Label>
              <Input type="number" className="no-spin" min={0} max={40} value={gap} onChange={(e) => setGap(Math.max(0, Math.min(40, Number(e.target.value) || 0)))} />
            </div>
          </div>
          <div className="h-44 rounded border border-border bg-zinc-900 p-3">
            <div
              className="w-full h-full"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gap: `${gap}px`,
              }}
            >
              {items.map((item) => (
                <div key={item} className="rounded bg-zinc-200/90 text-zinc-900 text-xs flex items-center justify-center font-medium">
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
