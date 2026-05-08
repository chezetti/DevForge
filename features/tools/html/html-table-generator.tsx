'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getToolById } from '@/config/tool-registry'

function buildTableHtml(opts: {
  rows: number
  cols: number
  cells: string[][]
  useThead: boolean
  tableClass: string
}): string {
  const { rows, cols, cells, useThead, tableClass } = opts
  const cls = tableClass.trim()
  const classAttr = cls ? ` class="${cls.replace(/"/g, '&quot;')}"` : ''

  let html = `<table${classAttr}>\n`

  const bodyStart = useThead && rows > 0 ? 1 : 0

  if (useThead && rows > 0) {
    html += '  <thead>\n    <tr>\n'
    for (let c = 0; c < cols; c++) {
      const v = cells[0]?.[c] ?? ''
      html += `      <th>${escapeCell(v)}</th>\n`
    }
    html += '    </tr>\n  </thead>\n'
  }

  html += '  <tbody>\n'
  for (let r = bodyStart; r < rows; r++) {
    html += '    <tr>\n'
    for (let c = 0; c < cols; c++) {
      const v = cells[r]?.[c] ?? ''
      html += `      <td>${escapeCell(v)}</td>\n`
    }
    html += '    </tr>\n'
  }
  html += '  </tbody>\n</table>'
  return html
}

function escapeCell(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function emptyGrid(rows: number, cols: number, prev: string[][]): string[][] {
  const g: string[][] = []
  for (let r = 0; r < rows; r++) {
    const row: string[] = []
    for (let c = 0; c < cols; c++) {
      row.push(prev[r]?.[c] ?? '')
    }
    g.push(row)
  }
  return g
}

export function HtmlTableGenerator() {
  const tool = getToolById('html-table-generator')!

  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(4)
  const [cells, setCells] = useState<string[][]>(() =>
    emptyGrid(3, 4, [
      ['Product', 'SKU', 'Price', 'Stock'],
      ['Ergo keyboard', 'KB-01', '$89', '12'],
      ['USB hub', 'UH-9', '$24', '40'],
    ])
  )
  const [useThead, setUseThead] = useState(true)
  const [tableClass, setTableClass] = useState('table')
  const [copied, setCopied] = useState(false)

  const html = useMemo(
    () =>
      buildTableHtml({
        rows,
        cols,
        cells,
        useThead,
        tableClass,
      }),
    [rows, cols, cells, useThead, tableClass]
  )

  const applySize = useCallback((r: number, c: number) => {
    const nr = Math.max(1, Math.min(24, r))
    const nc = Math.max(1, Math.min(16, c))
    setRows(nr)
    setCols(nc)
    setCells((prev) => emptyGrid(nr, nc, prev))
  }, [])

  const setCell = useCallback((r: number, c: number, v: string) => {
    setCells((prev) => {
      const next = prev.map((row) => [...row])
      if (!next[r]) next[r] = Array(cols).fill('')
      next[r][c] = v
      return next
    })
  }, [cols])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    toast.success('Table HTML copied')
    setTimeout(() => setCopied(false), 1500)
  }, [html])

  return (
    <ToolShell tool={tool} showHistory={false}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg bg-background-secondary p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="table-rows">Rows</Label>
                <Input
                  id="table-rows"
                  type="number"
                  min={1}
                  max={24}
                  className="no-spin"
                  value={rows}
                  onChange={(e) => applySize(Number(e.target.value) || 1, cols)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-cols">Columns</Label>
                <Input
                  id="table-cols"
                  type="number"
                  min={1}
                  max={16}
                  className="no-spin"
                  value={cols}
                  onChange={(e) => applySize(rows, Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <Switch id="use-thead" checked={useThead} onCheckedChange={setUseThead} />
                <Label htmlFor="use-thead" className="text-sm font-normal cursor-pointer">
                  First row in <code className="text-xs bg-muted px-1 rounded">&lt;thead&gt;</code>
                </Label>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <Label htmlFor="table-class">Table CSS classes</Label>
                <Input
                  id="table-class"
                  placeholder="table table-striped"
                  value={tableClass}
                  onChange={(e) => setTableClass(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cell grid</Label>
              <div
                className="rounded-md border border-border overflow-auto max-h-[320px]"
                style={{ scrollbarGutter: 'stable' }}
              >
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {Array.from({ length: rows }, (_, r) => (
                      <tr key={r} className="border-b border-border">
                        {Array.from({ length: cols }, (_, c) => (
                          <td
                            key={c}
                            className="p-0 border-r border-border last:border-r-0 align-top"
                          >
                            <Input
                              aria-label={`Cell row ${r + 1} column ${c + 1}`}
                              className="rounded-none border-0 focus-visible:ring-0 shadow-none h-9 text-xs font-mono"
                              value={cells[r]?.[c] ?? ''}
                              onChange={(e) => setCell(r, c, e.target.value)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Generated HTML
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={handleCopy}
                aria-label="Copy generated HTML"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success-foreground" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy HTML
              </Button>
            </div>
            <pre
              className="flex-1 min-h-[320px] text-xs font-mono leading-relaxed p-4 rounded-lg border border-border bg-background-secondary text-foreground overflow-auto whitespace-pre-wrap break-all"
              tabIndex={0}
            >
              {html}
            </pre>
            <p className="text-xs text-muted-foreground px-1">
              Edit dimensions and cells on the left. Output updates live and stays copy-ready.
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
