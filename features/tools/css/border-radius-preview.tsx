'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { OutputPanel } from '@/components/tools/output-panel'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function BorderRadiusPreview() {
  const [topLeft, setTopLeft] = useState(8)
  const [topRight, setTopRight] = useState(8)
  const [bottomRight, setBottomRight] = useState(8)
  const [bottomLeft, setBottomLeft] = useState(8)

  const css = useMemo(
    () => `border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;`,
    [topLeft, topRight, bottomRight, bottomLeft]
  )

  return (
    <ToolShell toolId="border-radius-preview" showHistory={false}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
        <div className="border border-border rounded bg-background-secondary p-4 space-y-4 min-h-[360px]">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Top Left</Label>
              <Input type="number" className="no-spin" value={topLeft} onChange={(e) => setTopLeft(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Top Right</Label>
              <Input type="number" className="no-spin" value={topRight} onChange={(e) => setTopRight(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Bottom Right</Label>
              <Input type="number" className="no-spin" value={bottomRight} onChange={(e) => setBottomRight(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Bottom Left</Label>
              <Input type="number" className="no-spin" value={bottomLeft} onChange={(e) => setBottomLeft(Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="h-40 rounded border border-border bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center">
            <div
              className="w-32 h-32 bg-zinc-100/90 border border-zinc-300 transition-all"
              style={{ borderRadius: `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px` }}
            />
          </div>
        </div>
        <OutputPanel value={css} language="css" title="CSS Output" status="success" minHeight="360px" />
      </div>
    </ToolShell>
  )
}
